import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { calculateSkins, getSkinsLeaderboard } from "@/lib/competitions/skins";
import {
  createFlights,
  getFlightLeaderboard,
  type FlightMember,
  type FlightScore,
} from "@/lib/competitions/flights";

// Calculate competition results
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    await requireOrganizer();
    const { competitionId } = await params;

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        event: {
          include: {
            eventMembers: {
              include: {
                userProfile: true,
                scorecards: {
                  where: {
                    roundId: { in: [] }, // Will be updated below
                  },
                  include: {
                    holeScores: {
                      orderBy: { holeNumber: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    // Get scorecards for relevant rounds
    const scorecards = await prisma.scorecard.findMany({
      where: {
        roundId: { in: competition.roundIds },
      },
      include: {
        eventMember: {
          include: {
            userProfile: true,
          },
        },
        holeScores: {
          orderBy: { holeNumber: "asc" },
        },
      },
    });

    // Calculate based on competition type
    let results: any[] = [];

    if (competition.type === "SKINS") {
      // Extract hole scores for skins calculation
      const allHoleScores = scorecards.flatMap((sc) =>
        sc.holeScores
          .filter((hs) => hs.strokes !== null)
          .map((hs) => ({
            eventMemberId: sc.eventMemberId,
            holeNumber: hs.holeNumber,
            netStrokes: hs.strokes!, // Will calculate net later
          }))
      );

      // Get player names
      const playerNames = new Map(
        competition.event.eventMembers.map((em) => [
          em.id,
          em.userProfile.name || em.userProfile.email || "Unknown",
        ])
      );

      const skinsConfig = competition.config as any;
      const skinsResults = calculateSkins(
        allHoleScores,
        playerNames,
        skinsConfig
      );

      const leaderboard = getSkinsLeaderboard(skinsResults.totals, playerNames);

      // Create competition results
      results = leaderboard.map((entry) => ({
        participantId: entry.eventMemberId,
        participantType: "INDIVIDUAL",
        result: {
          skinsWon: entry.skinsWon,
          totalValue: entry.totalValue,
          holes: entry.holes,
        },
        position: entry.position,
      }));
    } else if (competition.type === "FLIGHT") {
      // Create flights from event members
      const members: FlightMember[] = competition.event.eventMembers
        .filter((em) => em.handicap !== null)
        .map((em) => ({
          eventMemberId: em.id,
          name: em.userProfile.name || em.userProfile.email || "Unknown",
          handicap: em.handicap!,
        }));

      const flightConfig = competition.config as any;
      const flights = createFlights(members, flightConfig);

      // Get scores for leaderboard
      const scores: FlightScore[] = scorecards.map((sc) => ({
        eventMemberId: sc.eventMemberId,
        name:
          sc.eventMember.userProfile.name ||
          sc.eventMember.userProfile.email ||
          "Unknown",
        handicap: sc.eventMember.handicap || 0,
        grossTotal: sc.grossTotal || 0,
        netTotal: sc.netTotal || 0,
        stablefordPoints: sc.stablefordPoints || undefined,
      }));

      // Calculate leaderboard for each flight
      const allResults = flights.flatMap((flight) => {
        const leaderboard = getFlightLeaderboard(
          flight.id,
          flights,
          scores,
          competition.event.scoringFormat === "STABLEFORD"
            ? "STABLEFORD"
            : "STROKE_PLAY"
        );

        return leaderboard.map((entry) => ({
          participantId: entry.eventMemberId,
          participantType: "INDIVIDUAL",
          result: {
            flightId: flight.id,
            flightName: flight.name,
            grossTotal: entry.grossTotal,
            netTotal: entry.netTotal,
            stablefordPoints: entry.stablefordPoints,
          },
          position: entry.position,
        }));
      });

      results = allResults;
    }

    // Delete existing results and create new ones
    await prisma.competitionResult.deleteMany({
      where: { competitionId },
    });

    await prisma.competitionResult.createMany({
      data: results.map((r) => ({
        competitionId,
        ...r,
      })),
    });

    // Update competition status to COMPLETED
    await prisma.competition.update({
      where: { id: competitionId },
      data: { status: "COMPLETED" },
    });

    // Fetch and return updated competition with results
    const updated = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        results: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json({ competition: updated });
  } catch (error) {
    console.error("Calculate competition error:", error);
    return NextResponse.json(
      { error: "Failed to calculate competition results" },
      { status: 500 }
    );
  }
}
