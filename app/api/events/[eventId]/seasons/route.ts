import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { canManageEvent, canViewEvent } from "@/lib/permissions";
import { z } from "zod";

const createSeasonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  config: z
    .object({
      pointsSystem: z.enum(["POSITION_BASED", "STABLEFORD", "STROKE_DIFF"]),
      positionPoints: z.array(z.number()).optional(),
      minRounds: z.number().optional(),
      countBestRounds: z.number().optional(),
      strokeDiffBase: z.number().optional(),
    })
    .optional(),
});

/**
 * GET /api/events/:eventId/seasons
 * List all seasons for an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUserId();
    const { eventId } = await params;

    // Check permissions
    const hasAccess = await canViewEvent(eventId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const seasons = await prisma.leagueSeason.findMany({
      where: { eventId },
      include: {
        standings: {
          include: {
            eventMember: {
              include: {
                userProfile: true,
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json({ seasons });
  } catch (error) {
    console.error("Error fetching seasons:", error);
    return NextResponse.json(
      { error: "Failed to fetch seasons" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/:eventId/seasons
 * Create a new league season
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUserId();
    const { eventId } = await params;

    // Check permissions
    const hasAccess = await canManageEvent(eventId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const data = createSeasonSchema.parse(body);

    // Verify event is a league
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.eventType !== "LEAGUE") {
      return NextResponse.json(
        { error: "Can only create seasons for league events" },
        { status: 400 }
      );
    }

    // Create season
    const season = await prisma.leagueSeason.create({
      data: {
        eventId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || "ACTIVE",
        config: data.config || {},
      },
    });

    // Create initial standings for all event members
    const eventMembers = await prisma.eventMember.findMany({
      where: { eventId },
    });

    await prisma.leagueStanding.createMany({
      data: eventMembers.map((member) => ({
        seasonId: season.id,
        eventMemberId: member.id,
        totalPoints: 0,
        roundsPlayed: 0,
      })),
    });

    return NextResponse.json({ season }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating season:", error);
    return NextResponse.json(
      { error: "Failed to create season" },
      { status: 500 }
    );
  }
}
