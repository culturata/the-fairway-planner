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

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: {
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
                    tripMember: {
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

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error("Get trip error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip" },
      { status: 500 }
    );
  }
}
