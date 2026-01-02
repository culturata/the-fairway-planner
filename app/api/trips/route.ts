import { NextRequest, NextResponse } from "next/server";
import { requireOrgId, requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTripSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  handicapPct: z.number().int().min(0).max(200).default(100),
  handicapCap: z.number().int().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const orgId = await requireOrgId();
    const userId = await requireUserId();

    const body = await request.json();
    const data = createTripSchema.parse(body);

    // Check if trip already exists for this org
    let trip = await prisma.trip.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (trip) {
      // Update existing trip
      trip = await prisma.trip.update({
        where: { clerkOrgId: orgId },
        data: {
          name: data.name,
          location: data.location,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          handicapPct: data.handicapPct,
          handicapCap: data.handicapCap,
        },
      });
    } else {
      // Create new trip
      trip = await prisma.trip.create({
        data: {
          clerkOrgId: orgId,
          name: data.name,
          location: data.location,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          handicapPct: data.handicapPct,
          handicapCap: data.handicapCap,
        },
      });
    }

    // Ensure user has a profile
    let userProfile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: { clerkUserId: userId },
      });
    }

    // Ensure user is a member of the trip
    const existingMember = await prisma.tripMember.findUnique({
      where: {
        tripId_userProfileId: {
          tripId: trip.id,
          userProfileId: userProfile.id,
        },
      },
    });

    if (!existingMember) {
      await prisma.tripMember.create({
        data: {
          tripId: trip.id,
          userProfileId: userProfile.id,
          rsvpStatus: "GOING",
        },
      });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create trip error:", error);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const orgId = await requireOrgId();

    const trip = await prisma.trip.findUnique({
      where: { clerkOrgId: orgId },
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
        },
        costItems: true,
        announcements: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ trip: null });
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
