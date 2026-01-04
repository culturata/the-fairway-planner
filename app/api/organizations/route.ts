import { NextRequest, NextResponse } from "next/server";
import { requireUserId, getOrgId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireUserId();
    const orgId = await getOrgId();

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization context" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { clerkOrgId: orgId },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Get organization error:", error);
    return NextResponse.json(
      { error: "Failed to get organization" },
      { status: 500 }
    );
  }
}
