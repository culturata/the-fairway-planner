import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await requireUserId();
    const { tripId } = await params;

    // Get all rounds for the event (tripId is actually eventId)
    const rounds = await prisma.round.findMany({
      where: { eventId: tripId },
      include: {
        scorecards: {
          include: {
            eventMember: {
              include: {
                userProfile: true,
              },
            },
          },
        },
      },
    });

    // Calculate cumulative scores per player
    const playerTotals = new Map<
      string,
      {
        userProfileId: string;
        playerName: string;
        grossTotal: number;
        netTotal: number;
        roundsPlayed: number;
      }
    >();

    for (const round of rounds) {
      for (const scorecard of round.scorecards) {
        const key = scorecard.eventMember.userProfileId;
        const existing = playerTotals.get(key) || {
          userProfileId: key,
          playerName:
            scorecard.eventMember.userProfile.name ||
            scorecard.eventMember.userProfile.email ||
            "Unknown",
          grossTotal: 0,
          netTotal: 0,
          roundsPlayed: 0,
        };

        if (scorecard.grossTotal !== null) {
          existing.grossTotal += scorecard.grossTotal;
          existing.roundsPlayed += 1;
        }

        if (scorecard.netTotal !== null) {
          existing.netTotal += scorecard.netTotal;
        }

        playerTotals.set(key, existing);
      }
    }

    const players = Array.from(playerTotals.values());

    // Gross leaderboard
    const grossLeaderboard = [...players]
      .filter((p) => p.roundsPlayed > 0)
      .sort((a, b) => a.grossTotal - b.grossTotal)
      .map((p, index) => ({
        position: index + 1,
        playerName: p.playerName,
        totalScore: p.grossTotal,
        roundsPlayed: p.roundsPlayed,
      }));

    // Net leaderboard
    const netLeaderboard = [...players]
      .filter((p) => p.roundsPlayed > 0)
      .sort((a, b) => a.netTotal - b.netTotal)
      .map((p, index) => ({
        position: index + 1,
        playerName: p.playerName,
        totalScore: p.netTotal,
        roundsPlayed: p.roundsPlayed,
      }));

    return NextResponse.json({
      grossLeaderboard,
      netLeaderboard,
    });
  } catch (error) {
    console.error("Get trip leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip leaderboard" },
      { status: 500 }
    );
  }
}
