import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await requireUserId();
    const { tripId } = await params;

    // tripId is now actually an eventId (backward compatibility)
    const event = await prisma.event.findUnique({
      where: { id: tripId },
      include: {
        eventMembers: {
          include: {
            userProfile: true,
          },
        },
        itineraryItems: {
          orderBy: { startsAt: "asc" },
        },
        rounds: {
          orderBy: { startsAt: "asc" },
          include: {
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
          },
        },
        costItems: true,
        announcements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Map to old structure for backward compatibility
    const trip = {
      ...event,
      members: event.eventMembers,
    };

    return NextResponse.json({ trip });
  } catch (error) {
    console.error("Get trip error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip" },
      { status: 500 }
    );
  }
}
