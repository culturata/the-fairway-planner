import { Scorecard } from "@prisma/client";

/**
 * League points calculation systems
 */
export enum LeaguePointsSystem {
  POSITION_BASED = "POSITION_BASED", // Points based on finishing position
  STABLEFORD = "STABLEFORD", // Use Stableford points from scorecard
  STROKE_DIFF = "STROKE_DIFF", // Points based on strokes from par
}

/**
 * Configuration for league points system
 */
export interface LeagueSettings {
  pointsSystem: LeaguePointsSystem;
  positionPoints?: number[]; // Points for each position [10, 9, 8, ...]
  minRounds?: number; // Minimum rounds to be eligible
  countBestRounds?: number; // Only count best X rounds
  strokeDiffBase?: number; // Base points for stroke difference system
}

/**
 * Default position-based points (10 for 1st, 9 for 2nd, etc.)
 */
export const DEFAULT_POSITION_POINTS = [
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1, // Top 10
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 11-20 get 0 points
];

/**
 * Calculate points for a single round based on league settings
 */
export function calculateRoundPoints(
  scorecard: Scorecard & { position?: number },
  settings: LeagueSettings
): number {
  const { pointsSystem, positionPoints, strokeDiffBase = 50 } = settings;

  switch (pointsSystem) {
    case LeaguePointsSystem.POSITION_BASED: {
      if (scorecard.position === undefined || scorecard.position === null) {
        return 0;
      }
      const points = positionPoints || DEFAULT_POSITION_POINTS;
      const position = scorecard.position - 1; // Convert to 0-indexed
      return points[position] || 0;
    }

    case LeaguePointsSystem.STABLEFORD: {
      return scorecard.stablefordPoints || 0;
    }

    case LeaguePointsSystem.STROKE_DIFF: {
      if (!scorecard.netTotal) return 0;
      const par = 72; // TODO: Get actual par from course
      const diff = par - scorecard.netTotal;
      // Base of 50 points, +/- strokes from par
      return Math.max(0, strokeDiffBase + diff);
    }

    default:
      return 0;
  }
}

/**
 * Calculate total season points for a player
 */
export function calculateSeasonPoints(
  scorecards: (Scorecard & { position?: number })[],
  settings: LeagueSettings
): {
  totalPoints: number;
  roundsPlayed: number;
  countedRounds: number;
  stats: {
    avgScore?: number;
    bestRound?: number;
    worstRound?: number;
    avgPoints: number;
  };
} {
  const roundPoints = scorecards.map((sc) => ({
    points: calculateRoundPoints(sc, settings),
    netTotal: sc.netTotal,
  }));

  const roundsPlayed = roundPoints.length;

  // Sort by points descending for best rounds counting
  const sortedPoints = [...roundPoints].sort((a, b) => b.points - a.points);

  // Determine which rounds to count
  const countBestRounds = settings.countBestRounds;
  const countedRounds =
    countBestRounds && countBestRounds < roundsPlayed
      ? sortedPoints.slice(0, countBestRounds)
      : sortedPoints;

  const totalPoints = countedRounds.reduce((sum, r) => sum + r.points, 0);

  // Calculate stats
  const netScores = roundPoints
    .map((r) => r.netTotal)
    .filter((s): s is number => s !== null && s !== undefined);

  const avgScore =
    netScores.length > 0
      ? netScores.reduce((sum, s) => sum + s, 0) / netScores.length
      : undefined;

  const bestRound = netScores.length > 0 ? Math.min(...netScores) : undefined;
  const worstRound = netScores.length > 0 ? Math.max(...netScores) : undefined;
  const avgPoints =
    roundsPlayed > 0
      ? countedRounds.reduce((sum, r) => sum + r.points, 0) / countedRounds.length
      : 0;

  return {
    totalPoints,
    roundsPlayed,
    countedRounds: countedRounds.length,
    stats: {
      avgScore,
      bestRound,
      worstRound,
      avgPoints,
    },
  };
}

/**
 * Calculate positions/rankings for all players in a season
 */
export function calculateStandings(
  standings: Array<{
    eventMemberId: string;
    totalPoints: number;
    roundsPlayed: number;
    stats?: any;
  }>,
  settings: LeagueSettings
): Array<{
  eventMemberId: string;
  position: number;
  totalPoints: number;
  roundsPlayed: number;
  stats?: any;
}> {
  const minRounds = settings.minRounds || 0;

  // Filter eligible players (met minimum rounds requirement)
  const eligible = standings.filter((s) => s.roundsPlayed >= minRounds);

  // Sort by total points descending, then by rounds played ascending (fewer rounds = better if tied)
  eligible.sort((a, b) => {
    if (a.totalPoints !== b.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.roundsPlayed - b.roundsPlayed;
  });

  // Assign positions (handle ties)
  let currentPosition = 1;
  let previousPoints = -1;
  let tieCount = 0;

  return eligible.map((standing, index) => {
    if (standing.totalPoints === previousPoints) {
      // Tied with previous player
      tieCount++;
    } else {
      // New position
      currentPosition = index + 1;
      previousPoints = standing.totalPoints;
      tieCount = 0;
    }

    return {
      ...standing,
      position: currentPosition,
    };
  });
}
