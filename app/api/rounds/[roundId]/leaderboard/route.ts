import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  try {
    await requireUserId();
    const { roundId } = await params;

    const scorecards = await prisma.scorecard.findMany({
      where: { roundId },
      include: {
        tripMember: {
          include: {
            userProfile: true,
          },
        },
      },
      orderBy: [
        { grossTotal: "asc" },
        { netTotal: "asc" },
      ],
    });

    // Sort for gross leaderboard
    const grossLeaderboard = [...scorecards]
      .filter((s) => s.grossTotal !== null)
      .sort((a, b) => (a.grossTotal || 0) - (b.grossTotal || 0))
      .map((s, index) => ({
        position: index + 1,
        playerName: s.tripMember.userProfile.name || s.tripMember.userProfile.email || "Unknown",
        score: s.grossTotal,
        status: s.status,
      }));

    // Sort for net leaderboard
    const netLeaderboard = [...scorecards]
      .filter((s) => s.netTotal !== null)
      .sort((a, b) => (a.netTotal || 0) - (b.netTotal || 0))
      .map((s, index) => ({
        position: index + 1,
        playerName: s.tripMember.userProfile.name || s.tripMember.userProfile.email || "Unknown",
        score: s.netTotal,
        handicap: s.tripMember.handicap,
        status: s.status,
      }));

    return NextResponse.json({
      grossLeaderboard,
      netLeaderboard,
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
