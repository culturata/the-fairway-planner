import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { canManageEvent } from "@/lib/permissions";
import {
  calculateSeasonPoints,
  calculateStandings,
  LeagueSettings,
} from "@/lib/league/points";
import { getScoringEngine } from "@/lib/scoring/factory";

/**
 * POST /api/seasons/:seasonId/recalculate
 * Recalculate all standings for a league season
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    await requireUserId();
    const { seasonId } = await params;

    const season = await prisma.leagueSeason.findUnique({
      where: { id: seasonId },
      include: {
        event: {
          include: {
            rounds: {
              where: {
                startsAt: {
                  gte: new Date(0), // Get all rounds
                },
              },
            },
          },
        },
        standings: {
          include: {
            eventMember: true,
          },
        },
      },
    });

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    // Check permissions
    const hasAccess = await canManageEvent(season.eventId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const leagueSettings: LeagueSettings = (season.config as LeagueSettings) || {
      pointsSystem: "POSITION_BASED",
    };

    // Get all rounds in season date range
    const seasonRounds = season.event.rounds.filter((round) => {
      const roundDate = new Date(round.startsAt);
      return (
        roundDate >= season.startDate && roundDate <= season.endDate
      );
    });

    // For each event member, calculate their season points
    const standingsUpdates = await Promise.all(
      season.standings.map(async (standing) => {
        // Get all scorecards for this member in season rounds
        const scorecards = await prisma.scorecard.findMany({
          where: {
            eventMemberId: standing.eventMemberId,
            roundId: {
              in: seasonRounds.map((r) => r.id),
            },
            status: "SUBMITTED", // Only count submitted scorecards
          },
          include: {
            round: {
              include: {
                event: true,
              },
            },
          },
        });

        // Calculate positions for each round (needed for position-based scoring)
        const scorecardsWithPositions = await Promise.all(
          scorecards.map(async (scorecard) => {
            // Get all scorecards for this round to determine position
            const roundScorecards = await prisma.scorecard.findMany({
              where: {
                roundId: scorecard.roundId,
                status: "SUBMITTED",
              },
              orderBy: {
                netTotal: "asc",
              },
            });

            // Find position (1-indexed)
            const position =
              roundScorecards.findIndex((s) => s.id === scorecard.id) + 1;

            return {
              ...scorecard,
              position: position > 0 ? position : undefined,
            };
          })
        );

        // Calculate season points
        const seasonResult = calculateSeasonPoints(
          scorecardsWithPositions,
          leagueSettings
        );

        return {
          id: standing.id,
          eventMemberId: standing.eventMemberId,
          totalPoints: seasonResult.totalPoints,
          roundsPlayed: seasonResult.roundsPlayed,
          stats: seasonResult.stats,
        };
      })
    );

    // Calculate final positions/rankings
    const rankedStandings = calculateStandings(
      standingsUpdates,
      leagueSettings
    );

    // Update all standings in database
    await Promise.all(
      rankedStandings.map((standing) =>
        prisma.leagueStanding.update({
          where: { id: standing.id },
          data: {
            totalPoints: standing.totalPoints,
            roundsPlayed: standing.roundsPlayed,
            position: standing.position,
            stats: standing.stats,
          },
        })
      )
    );

    // Return updated standings
    const updatedStandings = await prisma.leagueStanding.findMany({
      where: { seasonId },
      include: {
        eventMember: {
          include: {
            userProfile: true,
          },
        },
      },
      orderBy: [
        { position: "asc" },
        { totalPoints: "desc" },
      ],
    });

    return NextResponse.json({
      message: "Standings recalculated successfully",
      standings: updatedStandings,
    });
  } catch (error) {
    console.error("Error recalculating standings:", error);
    return NextResponse.json(
      { error: "Failed to recalculate standings" },
      { status: 500 }
    );
  }
}
