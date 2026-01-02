import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAnnouncementSchema = z.object({
  title: z.string().optional(),
  message: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await requireOrganizer();
    const { tripId } = await params;

    const body = await request.json();
    const data = createAnnouncementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: {
        tripId,
        title: data.title,
        message: data.message,
      },
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create announcement error:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
