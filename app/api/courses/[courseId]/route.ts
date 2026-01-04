import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCourseSchema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  holes: z.number().int().min(9).max(18).optional(),
  website: z.string().url().optional(),
});

// Get course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireUserId();
    const { courseId } = await params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        tees: {
          include: {
            holes: {
              orderBy: { holeNumber: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Get course error:", error);
    return NextResponse.json(
      { error: "Failed to get course" },
      { status: 500 }
    );
  }
}

// Update course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireUserId();
    const { courseId } = await params;

    const body = await request.json();
    const data = updateCourseSchema.parse(body);

    const course = await prisma.course.update({
      where: { id: courseId },
      data,
      include: {
        tees: true,
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update course error:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

// Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireUserId();
    const { courseId } = await params;

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
