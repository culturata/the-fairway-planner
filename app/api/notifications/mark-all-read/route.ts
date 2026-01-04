import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// Mark all notifications as read
export async function POST(request: NextRequest) {
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

    // Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: userProfile.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ count: result.count });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
