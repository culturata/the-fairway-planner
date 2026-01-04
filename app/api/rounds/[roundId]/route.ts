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

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        event: true,
        teeGroups: {
          include: {
            members: {
              include: {
                eventMember: {
                  include: {
                    userProfile: true,
                  },
                },
              },
            },
          },
        },
        scorecards: {
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
        },
      },
    });

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    return NextResponse.json({ round });
  } catch (error) {
    console.error("Get round error:", error);
    return NextResponse.json(
      { error: "Failed to fetch round" },
      { status: 500 }
    );
  }
}
