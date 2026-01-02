import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer, requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createItineraryItemSchema = z.object({
  type: z.enum(["ROUND", "LODGING", "DINNER", "ACTIVITY", "TRAVEL", "NOTE"]),
  title: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await requireOrganizer();
    const { tripId } = await params;

    const body = await request.json();
    const data = createItineraryItemSchema.parse(body);

    const item = await prisma.itineraryItem.create({
      data: {
        tripId,
        type: data.type,
        title: data.title,
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        location: data.location,
        notes: data.notes,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create itinerary item error:", error);
    return NextResponse.json(
      { error: "Failed to create itinerary item" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await requireUserId();
    const { tripId } = await params;

    const items = await prisma.itineraryItem.findMany({
      where: { tripId },
      orderBy: { startsAt: "asc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Get itinerary items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch itinerary items" },
      { status: 500 }
    );
  }
}
