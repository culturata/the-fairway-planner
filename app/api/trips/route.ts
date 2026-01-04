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

    // Get or create organization
    let organization = await prisma.organization.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: { clerkOrgId: orgId },
      });
    }

    // Check if a trip event already exists for this org (maintain MVP behavior)
    let event = await prisma.event.findFirst({
      where: {
        organizationId: organization.id,
        eventType: "TRIP",
      },
    });

    if (event) {
      // Update existing trip event
      event = await prisma.event.update({
        where: { id: event.id },
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
      // Create new trip event
      event = await prisma.event.create({
        data: {
          organizationId: organization.id,
          eventType: "TRIP",
          name: data.name,
          location: data.location,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          handicapPct: data.handicapPct,
          handicapCap: data.handicapCap,
          scoringFormat: "STROKE_PLAY",
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

    // Ensure user is a member of the event
    const existingMember = await prisma.eventMember.findUnique({
      where: {
        eventId_userProfileId: {
          eventId: event.id,
          userProfileId: userProfile.id,
        },
      },
    });

    if (!existingMember) {
      await prisma.eventMember.create({
        data: {
          eventId: event.id,
          userProfileId: userProfile.id,
          rsvpStatus: "GOING",
        },
      });
    }

    // Return as 'trip' for backward compatibility
    return NextResponse.json({ trip: event });
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

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!organization) {
      return NextResponse.json({ trip: null });
    }

    // Get the first TRIP event for this organization (maintain MVP behavior)
    const event = await prisma.event.findFirst({
      where: {
        organizationId: organization.id,
        eventType: "TRIP",
      },
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
        },
        costItems: true,
        announcements: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!event) {
      return NextResponse.json({ trip: null });
    }

    // Map eventMembers to members for backward compatibility
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
