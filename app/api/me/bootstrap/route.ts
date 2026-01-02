import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if profile already exists
    let profile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (!profile) {
      // Create new profile
      profile = await prisma.userProfile.create({
        data: {
          clerkUserId: userId,
          email: user.emailAddresses[0]?.emailAddress,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
        },
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Bootstrap error:", error);
    return NextResponse.json(
      { error: "Failed to bootstrap user profile" },
      { status: 500 }
    );
  }
}
