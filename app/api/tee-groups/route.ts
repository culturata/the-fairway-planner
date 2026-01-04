import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTeeGroupSchema = z.object({
  roundId: z.string(),
  label: z.string().optional(),
  teeTime: z.string().datetime().optional(),
  startingHole: z.number().int().min(1).max(18).optional(),
  memberIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    await requireOrganizer();

    const body = await request.json();
    const data = createTeeGroupSchema.parse(body);

    const teeGroup = await prisma.teeGroup.create({
      data: {
        roundId: data.roundId,
        label: data.label,
        teeTime: data.teeTime ? new Date(data.teeTime) : null,
        startingHole: data.startingHole,
        members: {
          create: data.memberIds.map((eventMemberId) => ({
            eventMemberId,
          })),
        },
      },
      include: {
        members: {
          include: {
            eventMember: {
              include: {
                userProfile: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ teeGroup });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create tee group error:", error);
    return NextResponse.json(
      { error: "Failed to create tee group" },
      { status: 500 }
    );
  }
}
