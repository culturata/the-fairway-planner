import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const holeSchema = z.object({
  holeNumber: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(5),
  handicap: z.number().int().min(1).max(18),
  yardage: z.number().int().min(0).optional(),
});

const createTeeSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(["M", "F", "A"]).optional(),
  courseRating: z.number().optional(),
  slopeRating: z.number().int().min(55).max(155).optional(),
  totalYardage: z.number().int().min(0).optional(),
  par: z.number().int().min(54).max(90).default(72),
  holes: z.array(holeSchema).optional(),
});

// Create tee for a course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireUserId();
    const { courseId } = await params;

    const body = await request.json();
    const data = createTeeSchema.parse(body);

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Create tee with holes if provided
    const tee = await prisma.tee.create({
      data: {
        courseId,
        name: data.name,
        gender: data.gender,
        courseRating: data.courseRating,
        slopeRating: data.slopeRating,
        totalYardage: data.totalYardage,
        par: data.par,
        holes: data.holes
          ? {
              create: data.holes.map((hole) => ({
                holeNumber: hole.holeNumber,
                par: hole.par,
                handicap: hole.handicap,
                yardage: hole.yardage,
              })),
            }
          : undefined,
      },
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
    console.error("Create tee error:", error);
    return NextResponse.json(
      { error: "Failed to create tee" },
      { status: 500 }
    );
  }
}

// Get all tees for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireUserId();
    const { courseId } = await params;

    const tees = await prisma.tee.findMany({
      where: { courseId },
      include: {
        holes: {
          orderBy: { holeNumber: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ tees });
  } catch (error) {
    console.error("Get tees error:", error);
    return NextResponse.json(
      { error: "Failed to get tees" },
      { status: 500 }
    );
  }
}
