import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createRoundSchema = z.object({
  tripId: z.string(),
  courseName: z.string().min(1),
  teesName: z.string().optional(),
  startsAt: z.string().datetime(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireOrganizer();

    const body = await request.json();
    const data = createRoundSchema.parse(body);

    const round = await prisma.round.create({
      data: {
        tripId: data.tripId,
        courseName: data.courseName,
        teesName: data.teesName,
        startsAt: new Date(data.startsAt),
        notes: data.notes,
      },
    });

    // Create scorecards for all trip members
    const tripMembers = await prisma.tripMember.findMany({
      where: { tripId: data.tripId },
    });

    await Promise.all(
      tripMembers.map((member) =>
        prisma.scorecard.create({
          data: {
            roundId: round.id,
            tripMemberId: member.id,
          },
        })
      )
    );

    return NextResponse.json({ round });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create round error:", error);
    return NextResponse.json(
      { error: "Failed to create round" },
      { status: 500 }
    );
  }
}
