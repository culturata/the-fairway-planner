import { NextRequest, NextResponse } from "next/server";
import { requireUserId, requireOrganizer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createEventSchema = z.object({
  eventType: z.enum(["TRIP", "OUTING", "LEAGUE", "TOURNAMENT"]),
  name: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  handicapPct: z.number().int().min(0).max(100).default(100),
  handicapCap: z.number().int().min(0).optional(),
  scoringFormat: z.string().default("STROKE_PLAY"),
  scoringConfig: z.any().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  seasonStartDate: z.string().datetime().optional(),
  seasonEndDate: z.string().datetime().optional(),
  leagueSettings: z.any().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await requireUserId();
    const { orgId } = await params;

    // Get organization by Clerk org ID
    const organization = await prisma.organization.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get("type");
    const status = searchParams.get("status");

    const events = await prisma.event.findMany({
      where: {
        organizationId: organization.id,
        ...(eventType && { eventType }),
        ...(status && { status }),
      },
      include: {
        eventMembers: {
          include: {
            userProfile: true,
          },
        },
        rounds: true,
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("List events error:", error);
    return NextResponse.json(
      { error: "Failed to list events" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const userId = await requireUserId();
    await requireOrganizer();
    const { orgId } = await params;

    const body = await request.json();
    const data = createEventSchema.parse(body);

    // Get or create organization
    let organization = await prisma.organization.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          clerkOrgId: orgId,
        },
      });
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        organizationId: organization.id,
        eventType: data.eventType,
        name: data.name,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        handicapPct: data.handicapPct,
        handicapCap: data.handicapCap,
        scoringFormat: data.scoringFormat,
        scoringConfig: data.scoringConfig,
        isRecurring: data.isRecurring,
        recurrenceRule: data.recurrenceRule,
        seasonStartDate: data.seasonStartDate
          ? new Date(data.seasonStartDate)
          : null,
        seasonEndDate: data.seasonEndDate ? new Date(data.seasonEndDate) : null,
        leagueSettings: data.leagueSettings,
      },
    });

    // Get or create user profile
    let userProfile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (!userProfile) {
      const { User } = await import("@clerk/nextjs/server");
      const user = await User.get(userId);
      userProfile = await prisma.userProfile.create({
        data: {
          clerkUserId: userId,
          email: user.emailAddresses[0]?.emailAddress,
          name: user.firstName
            ? `${user.firstName} ${user.lastName || ""}`.trim()
            : user.username || "User",
        },
      });
    }

    // Add creator as event member with GOING status
    await prisma.eventMember.create({
      data: {
        eventId: event.id,
        userProfileId: userProfile.id,
        rsvpStatus: "GOING",
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
