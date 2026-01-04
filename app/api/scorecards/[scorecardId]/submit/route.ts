import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scorecardId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { scorecardId } = await params;

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

    if (scorecard.eventMember.userProfile.clerkUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const updatedScorecard = await prisma.scorecard.update({
      where: { id: scorecardId },
      data: { status: "SUBMITTED" },
    });

    return NextResponse.json({ scorecard: updatedScorecard });
  } catch (error) {
    console.error("Submit scorecard error:", error);
    return NextResponse.json(
      { error: "Failed to submit scorecard" },
      { status: 500 }
    );
  }
}
