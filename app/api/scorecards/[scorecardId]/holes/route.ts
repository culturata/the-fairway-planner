import { NextRequest, NextResponse } from "next/server";
import { requireUserId, isOrganizer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
      holeScores: true,
      tripMember: {
        include: {
          trip: true,
        },
      },
    },
  });

  if (!scorecard) return;

  const holeScores = scorecard.holeScores.filter(
    (h) => h.strokes !== null
  ) as Array<{ strokes: number }>;

  const grossTotal =
    holeScores.length === 18
      ? holeScores.reduce((sum, h) => sum + h.strokes, 0)
      : null;

  let netTotal = null;
  if (grossTotal !== null && scorecard.tripMember.handicap !== null) {
    const trip = scorecard.tripMember.trip;
    let adjustedHandicap = (scorecard.tripMember.handicap * trip.handicapPct) / 100;
    if (trip.handicapCap !== null) {
      adjustedHandicap = Math.min(adjustedHandicap, trip.handicapCap);
    }
    netTotal = Math.round(grossTotal - adjustedHandicap);
  }

  await prisma.scorecard.update({
    where: { id: scorecardId },
    data: { grossTotal, netTotal },
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
        tripMember: {
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

    const isOwner = scorecard.tripMember.userProfile.clerkUserId === userId;
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
