import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createRoundSchema = z.object({
  tripId: z.string(), // For backward compatibility, actually eventId
  eventId: z.string().optional(), // New field
  courseId: z.string().optional(), // NEW: Link to course database
  teeId: z.string().optional(), // NEW: Specific tee being played
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

    // Support both tripId (backward compat) and eventId
    const eventId = data.eventId || data.tripId;

    const round = await prisma.round.create({
      data: {
        eventId,
        courseId: data.courseId,
        teeId: data.teeId,
        courseName: data.courseName,
        teesName: data.teesName,
        startsAt: new Date(data.startsAt),
        notes: data.notes,
      },
      include: {
        course: true,
        tee: {
          include: {
            holes: {
              orderBy: { holeNumber: "asc" },
            },
          },
        },
      },
    });

    // Create scorecards for all event members
    const eventMembers = await prisma.eventMember.findMany({
      where: { eventId },
    });

    await Promise.all(
      eventMembers.map((member) =>
        prisma.scorecard.create({
          data: {
            roundId: round.id,
            eventMemberId: member.id,
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
