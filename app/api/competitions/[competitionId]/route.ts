import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer, requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCompetitionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

// Get competition details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    await requireUserId();
    const { competitionId } = await params;

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        event: true,
        results: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ competition });
  } catch (error) {
    console.error("Get competition error:", error);
    return NextResponse.json(
      { error: "Failed to get competition" },
      { status: 500 }
    );
  }
}

// Update competition
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    await requireOrganizer();
    const { competitionId } = await params;

    const body = await request.json();
    const data = updateCompetitionSchema.parse(body);

    const competition = await prisma.competition.update({
      where: { id: competitionId },
      data,
      include: {
        results: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json({ competition });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update competition error:", error);
    return NextResponse.json(
      { error: "Failed to update competition" },
      { status: 500 }
    );
  }
}

// Delete competition
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    await requireOrganizer();
    const { competitionId } = await params;

    await prisma.competition.delete({
      where: { id: competitionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete competition error:", error);
    return NextResponse.json(
      { error: "Failed to delete competition" },
      { status: 500 }
    );
  }
}
