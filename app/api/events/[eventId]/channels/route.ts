import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// Create a channel for an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireOrganizer();
    const { eventId } = await params;

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventMembers: {
          include: {
            userProfile: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if a channel already exists for this event
    const existingChannel = await prisma.channel.findFirst({
      where: {
        type: "EVENT",
        eventId,
      },
    });

    if (existingChannel) {
      return NextResponse.json({ channel: existingChannel });
    }

    // Get all member user profile IDs
    const memberIds = event.eventMembers.map((em) => em.userProfile.id);

    // Create the channel
    const channel = await prisma.channel.create({
      data: {
        type: "EVENT",
        name: `${event.name} Chat`,
        eventId,
        memberIds,
      },
      include: {
        event: true,
      },
    });

    return NextResponse.json({ channel });
  } catch (error) {
    console.error("Create event channel error:", error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}

// Get channel for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const channel = await prisma.channel.findFirst({
      where: {
        type: "EVENT",
        eventId,
      },
      include: {
        event: true,
      },
    });

    if (!channel) {
      return NextResponse.json({ channel: null });
    }

    return NextResponse.json({ channel });
  } catch (error) {
    console.error("Get event channel error:", error);
    return NextResponse.json(
      { error: "Failed to get channel" },
      { status: 500 }
    );
  }
}
