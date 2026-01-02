import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scorecardId: string }> }
) {
  try {
    await requireOrganizer();
    const { scorecardId } = await params;

    const scorecard = await prisma.scorecard.update({
      where: { id: scorecardId },
      data: { status: "LOCKED" },
    });

    return NextResponse.json({ scorecard });
  } catch (error) {
    console.error("Lock scorecard error:", error);
    return NextResponse.json(
      { error: "Failed to lock scorecard" },
      { status: 500 }
    );
  }
}
