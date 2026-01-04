import { NextRequest, NextResponse } from "next/server";
import { requireUserId, isOrganizer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  calculatePlayingHandicap,
  calculateHandicapStrokesPerHole,
  calculateNetScore,
  applySimpleHandicap,
} from "@/lib/handicap";
import { getScoringEngine } from "@/lib/scoring/factory";
import { ScoringFormat, HoleScoreInput } from "@/lib/scoring/types";

const upsertHoleScoresSchema = z.object({
  scores: z.array(
    z.object({
      holeNumber: z.number().int().min(1).max(18),
      strokes: z.number().int().min(0).nullable(),
    })
  ),
});

async function calculateTotals(scorecardId: string) {
  const scorecard = await prisma.scorecard.findUnique({
    where: { id: scorecardId },
    include: {
      holeScores: {
        orderBy: { holeNumber: "asc" },
      },
      round: {
        include: {
          event: true,
          tee: {
            include: {
              holes: {
                orderBy: { holeNumber: "asc" },
              },
            },
          },
        },
      },
      eventMember: {
        include: {
          event: true,
        },
      },
    },
  });

  if (!scorecard) return;

  const holeScores = scorecard.holeScores.filter(
    (h) => h.strokes !== null
  ) as Array<{ holeNumber: number; strokes: number }>;

  // Only calculate if we have all 18 hole scores
  if (holeScores.length !== 18) {
    return;
  }

  const event = scorecard.eventMember.event;
  const tee = scorecard.round.tee;

  // Determine which scoring format to use (round-specific or event-wide)
  const scoringFormat = (scorecard.round.scoringFormat || event.scoringFormat || ScoringFormat.STROKE_PLAY) as ScoringFormat;
  const scoringConfig = (scorecard.round.scoringConfig as any) || (event.scoringConfig as any) || {};

  // Get the scoring engine
  const engine = getScoringEngine(scoringFormat, scoringConfig);

  // Calculate handicap strokes per hole if we have tee data
  let strokesPerHole: number[] = [];
  if (tee && tee.holes.length === 18 && scorecard.eventMember.handicap !== null) {
    if (tee.slopeRating && tee.courseRating) {
      const playingHandicap = calculatePlayingHandicap(
        scorecard.eventMember.handicap,
        tee.slopeRating,
        tee.courseRating,
        tee.par,
        event.handicapPct,
        event.handicapCap
      );
      strokesPerHole = calculateHandicapStrokesPerHole(playingHandicap, tee.holes);
    } else {
      // Simple handicap distribution without slope/rating
      const adjustedHandicap = Math.round(
        (scorecard.eventMember.handicap * event.handicapPct) / 100
      );
      const cappedHandicap =
        event.handicapCap !== null
          ? Math.min(adjustedHandicap, event.handicapCap)
          : adjustedHandicap;

      strokesPerHole = calculateHandicapStrokesPerHole(cappedHandicap, tee.holes);
    }
  }

  // Calculate hole-by-hole results using the scoring engine
  const holeResults = holeScores.map((holeScore) => {
    const hole = tee?.holes.find((h) => h.holeNumber === holeScore.holeNumber);
    const par = hole?.par || 4; // Default to par 4 if no hole data
    const handicapStrokes = strokesPerHole[holeScore.holeNumber - 1] || 0;

    const input: HoleScoreInput = {
      holeNumber: holeScore.holeNumber,
      strokes: holeScore.strokes,
      par,
      handicapStrokes,
    };

    return engine.calculateHoleScore(input);
  });

  // Calculate total score using the scoring engine
  const totalScore = engine.calculateTotalScore(holeResults);

  // Update the scorecard with all results
  await prisma.scorecard.update({
    where: { id: scorecardId },
    data: {
      grossTotal: totalScore.grossTotal,
      netTotal: totalScore.netTotal,
      stablefordPoints: totalScore.totalPoints,
      matchPlayResult: totalScore.matchResult,
      holesWon: totalScore.holesWon,
      holesLost: totalScore.holesLost,
      holesTied: totalScore.holesTied,
      results: totalScore as any,
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scorecardId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { scorecardId } = await params;

    const body = await request.json();
    const data = upsertHoleScoresSchema.parse(body);

    // Check if user owns this scorecard or is organizer
    const scorecard = await prisma.scorecard.findUnique({
      where: { id: scorecardId },
      include: {
        eventMember: {
          include: {
            userProfile: true,
          },
        },
      },
    });

    if (!scorecard) {
      return NextResponse.json(
        { error: "Scorecard not found" },
        { status: 404 }
      );
    }

    const isOwner = scorecard.eventMember.userProfile.clerkUserId === userId;
    const isOrganizerRole = await isOrganizer();

    if (!isOwner && !isOrganizerRole) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if scorecard is locked
    if (scorecard.status === "LOCKED") {
      return NextResponse.json(
        { error: "Scorecard is locked" },
        { status: 403 }
      );
    }

    // Upsert hole scores
    await Promise.all(
      data.scores.map((score) =>
        prisma.holeScore.upsert({
          where: {
            scorecardId_holeNumber: {
              scorecardId,
              holeNumber: score.holeNumber,
            },
          },
          update: {
            strokes: score.strokes,
          },
          create: {
            scorecardId,
            holeNumber: score.holeNumber,
            strokes: score.strokes,
          },
        })
      )
    );

    // Recalculate totals
    await calculateTotals(scorecardId);

    const updatedScorecard = await prisma.scorecard.findUnique({
      where: { id: scorecardId },
      include: {
        holeScores: {
          orderBy: { holeNumber: "asc" },
        },
      },
    });

    return NextResponse.json({ scorecard: updatedScorecard });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Upsert hole scores error:", error);
    return NextResponse.json(
      { error: "Failed to update scores" },
      { status: 500 }
    );
  }
}
