import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// Get all channels accessible by the user
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();

    // Get user profile ID
    const userProfile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get channels where user is a member
    const channels = await prisma.channel.findMany({
      where: {
        memberIds: {
          has: userProfile.id,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        round: {
          select: {
            id: true,
            courseName: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("Get channels error:", error);
    return NextResponse.json(
      { error: "Failed to get channels" },
      { status: 500 }
    );
  }
}
