import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTeeSchema = z.object({
  name: z.string().min(1).optional(),
  gender: z.enum(["M", "F", "A"]).optional(),
  courseRating: z.number().optional(),
  slopeRating: z.number().int().min(55).max(155).optional(),
  totalYardage: z.number().int().min(0).optional(),
  par: z.number().int().min(54).max(90).optional(),
});

// Get tee details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teeId: string }> }
) {
  try {
    await requireUserId();
    const { teeId } = await params;

    const tee = await prisma.tee.findUnique({
      where: { id: teeId },
      include: {
        course: true,
        holes: {
          orderBy: { holeNumber: "asc" },
        },
      },
    });

    if (!tee) {
      return NextResponse.json({ error: "Tee not found" }, { status: 404 });
    }

    return NextResponse.json({ tee });
  } catch (error) {
    console.error("Get tee error:", error);
    return NextResponse.json(
      { error: "Failed to get tee" },
      { status: 500 }
    );
  }
}

// Update tee
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teeId: string }> }
) {
  try {
    await requireUserId();
    const { teeId } = await params;

    const body = await request.json();
    const data = updateTeeSchema.parse(body);

    const tee = await prisma.tee.update({
      where: { id: teeId },
      data,
      include: {
        holes: {
          orderBy: { holeNumber: "asc" },
        },
      },
    });

    return NextResponse.json({ tee });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update tee error:", error);
    return NextResponse.json(
      { error: "Failed to update tee" },
      { status: 500 }
    );
  }
}

// Delete tee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teeId: string }> }
) {
  try {
    await requireUserId();
    const { teeId } = await params;

    await prisma.tee.delete({
      where: { id: teeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tee error:", error);
    return NextResponse.json(
      { error: "Failed to delete tee" },
      { status: 500 }
    );
  }
}
