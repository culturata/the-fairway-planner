import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateRsvpSchema = z.object({
  rsvpStatus: z.enum(["INVITED", "GOING", "MAYBE", "DECLINED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { tripId } = await params;

    const body = await request.json();
    const data = updateRsvpSchema.parse(body);

    // Get user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Update or create trip member
    const tripMember = await prisma.tripMember.upsert({
      where: {
        tripId_userProfileId: {
          tripId,
          userProfileId: userProfile.id,
        },
      },
      update: {
        rsvpStatus: data.rsvpStatus,
      },
      create: {
        tripId,
        userProfileId: userProfile.id,
        rsvpStatus: data.rsvpStatus,
      },
    });

    return NextResponse.json({ tripMember });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update RSVP error:", error);
    return NextResponse.json(
      { error: "Failed to update RSVP" },
      { status: 500 }
    );
  }
}
