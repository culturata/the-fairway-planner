import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCourseSchema = z.object({
  name: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("USA"),
  holes: z.number().int().min(9).max(18).default(18),
  website: z.string().url().optional(),
});

// Search courses
export async function GET(request: NextRequest) {
  try {
    await requireUserId();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { state: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        tees: {
          select: {
            id: true,
            name: true,
            courseRating: true,
            slopeRating: true,
            par: true,
          },
        },
      },
      take: limit,
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Search courses error:", error);
    return NextResponse.json(
      { error: "Failed to search courses" },
      { status: 500 }
    );
  }
}

// Create new course
export async function POST(request: NextRequest) {
  try {
    await requireUserId();

    const body = await request.json();
    const data = createCourseSchema.parse(body);

    const course = await prisma.course.create({
      data: {
        name: data.name,
        city: data.city,
        state: data.state,
        country: data.country,
        holes: data.holes,
        website: data.website,
      },
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
    console.error("Create course error:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
