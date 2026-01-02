import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer, requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCostItemSchema = z.object({
  name: z.string().min(1),
  amountCents: z.number().int().min(0),
  required: z.boolean().default(true),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await requireOrganizer();
    const { tripId } = await params;

    const body = await request.json();
    const data = createCostItemSchema.parse(body);

    const costItem = await prisma.tripCostItem.create({
      data: {
        tripId,
        name: data.name,
        amountCents: data.amountCents,
        required: data.required,
      },
    });

    return NextResponse.json({ costItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create cost item error:", error);
    return NextResponse.json(
      { error: "Failed to create cost item" },
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

    const costItems = await prisma.tripCostItem.findMany({
      where: { tripId },
      include: {
        payments: {
          include: {
            userProfile: true,
          },
        },
      },
    });

    return NextResponse.json({ costItems });
  } catch (error) {
    console.error("Get cost items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost items" },
      { status: 500 }
    );
  }
}
