import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { notificationId } = await params;

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

    // Check if notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.userId !== userProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Mark as read
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({ notification: updated });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
