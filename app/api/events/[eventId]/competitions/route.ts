import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer, requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCompetitionSchema = z.object({
  type: z.enum(["SKINS", "CLOSEST_TO_PIN", "LONG_DRIVE", "FLIGHT"]),
  name: z.string().min(1),
  description: z.string().optional(),
  roundIds: z.array(z.string()).min(1),
  config: z.record(z.any()).optional(),
});

// Create competition
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireOrganizer();
    const { eventId } = await params;

    const body = await request.json();
    const data = createCompetitionSchema.parse(body);

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify all rounds belong to this event
    const rounds = await prisma.round.findMany({
      where: {
        id: { in: data.roundIds },
        eventId,
      },
    });

    if (rounds.length !== data.roundIds.length) {
      return NextResponse.json(
        { error: "Some rounds not found or don't belong to this event" },
        { status: 400 }
      );
    }

    const competition = await prisma.competition.create({
      data: {
        eventId,
        type: data.type,
        name: data.name,
        description: data.description,
        roundIds: data.roundIds,
        config: data.config || {},
      },
    });

    return NextResponse.json({ competition });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create competition error:", error);
    return NextResponse.json(
      { error: "Failed to create competition" },
      { status: 500 }
    );
  }
}

// Get all competitions for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUserId();
    const { eventId } = await params;

    const competitions = await prisma.competition.findMany({
      where: { eventId },
      include: {
        results: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("Get competitions error:", error);
    return NextResponse.json(
      { error: "Failed to get competitions" },
      { status: 500 }
    );
  }
}
