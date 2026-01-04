import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createNotifications } from "@/lib/notifications";

const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  type: z.enum(["TEXT", "SYSTEM", "IMAGE"]).default("TEXT"),
  metadata: z.record(z.any()).optional(),
});

// Get messages for a channel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { channelId } = await params;

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

    // Check if user has access to this channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (!channel.memberIds.includes(userProfile.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since"); // Message ID to get messages after
    const limit = parseInt(searchParams.get("limit") || "50");

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(since ? { id: { gt: since } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    );
  }
}

// Send a message to a channel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { channelId } = await params;

    const body = await request.json();
    const data = sendMessageSchema.parse(body);

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

    // Check if user has access to this channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        event: true,
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (!channel.memberIds.includes(userProfile.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        channelId,
        senderId: userProfile.id,
        content: data.content,
        type: data.type,
        metadata: data.metadata || {},
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update channel's updatedAt timestamp
    await prisma.channel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() },
    });

    // Send notifications to other channel members
    const otherMembers = channel.memberIds.filter((id) => id !== userProfile.id);
    if (otherMembers.length > 0) {
      const senderName = userProfile.name || userProfile.email || "Someone";
      const channelName =
        channel.name || channel.event?.name || "a channel";

      await createNotifications(
        otherMembers.map((memberId) => ({
          userId: memberId,
          type: "MESSAGE",
          title: `New message in ${channelName}`,
          message: `${senderName}: ${data.content.substring(0, 100)}${
            data.content.length > 100 ? "..." : ""
          }`,
          actionUrl: `/channels/${channelId}`,
          data: {
            channelId,
            messageId: message.id,
          },
        }))
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
