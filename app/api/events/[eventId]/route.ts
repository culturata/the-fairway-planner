import { NextRequest, NextResponse } from "next/server";
import { requireUserId, requireOrganizer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  handicapPct: z.number().int().min(0).max(100).optional(),
  handicapCap: z.number().int().min(0).optional().nullable(),
  scoringFormat: z.string().optional(),
  scoringConfig: z.any().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  seasonStartDate: z.string().datetime().optional().nullable(),
  seasonEndDate: z.string().datetime().optional().nullable(),
  leagueSettings: z.any().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUserId();
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: true,
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
            scorecards: {
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
        costItems: true,
        announcements: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Get event error:", error);
    return NextResponse.json(
      { error: "Failed to get event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUserId();
    await requireOrganizer();
    const { eventId } = await params;

    const body = await request.json();
    const data = updateEventSchema.parse(body);

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.status && { status: data.status }),
        ...(data.handicapPct !== undefined && {
          handicapPct: data.handicapPct,
        }),
        ...(data.handicapCap !== undefined && {
          handicapCap: data.handicapCap,
        }),
        ...(data.scoringFormat && { scoringFormat: data.scoringFormat }),
        ...(data.scoringConfig !== undefined && {
          scoringConfig: data.scoringConfig,
        }),
        ...(data.isRecurring !== undefined && {
          isRecurring: data.isRecurring,
        }),
        ...(data.recurrenceRule !== undefined && {
          recurrenceRule: data.recurrenceRule,
        }),
        ...(data.seasonStartDate !== undefined && {
          seasonStartDate: data.seasonStartDate
            ? new Date(data.seasonStartDate)
            : null,
        }),
        ...(data.seasonEndDate !== undefined && {
          seasonEndDate: data.seasonEndDate ? new Date(data.seasonEndDate) : null,
        }),
        ...(data.leagueSettings !== undefined && {
          leagueSettings: data.leagueSettings,
        }),
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
    console.error("Update event error:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUserId();
    await requireOrganizer();
    const { eventId } = await params;

    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
