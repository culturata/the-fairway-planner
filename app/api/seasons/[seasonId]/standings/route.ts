import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { canViewEvent } from "@/lib/permissions";

/**
 * GET /api/seasons/:seasonId/standings
 * Get current standings for a league season
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    await requireUserId();
    const { seasonId } = await params;

    const season = await prisma.leagueSeason.findUnique({
      where: { id: seasonId },
      include: {
        event: true,
      },
    });

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    // Check permissions
    const hasAccess = await canViewEvent(season.eventId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get standings with member details
    const standings = await prisma.leagueStanding.findMany({
      where: { seasonId },
      include: {
        eventMember: {
          include: {
            userProfile: true,
          },
        },
      },
      orderBy: [
        { position: "asc" },
        { totalPoints: "desc" },
        { roundsPlayed: "asc" },
      ],
    });

    return NextResponse.json({
      season,
      standings: standings.map((s) => ({
        id: s.id,
        position: s.position,
        totalPoints: s.totalPoints,
        roundsPlayed: s.roundsPlayed,
        stats: s.stats,
        eventMember: {
          id: s.eventMember.id,
          handicap: s.eventMember.handicap,
          userProfile: {
            id: s.eventMember.userProfile.id,
            name: s.eventMember.userProfile.name,
            email: s.eventMember.userProfile.email,
          },
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching standings:", error);
    return NextResponse.json(
      { error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}
