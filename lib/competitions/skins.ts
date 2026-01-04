/**
 * Skins Game Competition Logic
 *
 * A skins game is a golf competition where the lowest score on each hole wins a "skin"
 * If multiple players tie for low score, the skin carries over to the next hole
 */

export interface SkinsConfig {
  carryover: boolean; // If true, tied holes carry value to next hole
  value: number; // Value per skin (in cents for money, or just points)
  eligibleHoles: number[]; // Which holes have skins (default: all 18)
  autoCarryLastHole: boolean; // If last hole ties, split or carry to playoff
}

export interface HoleScore {
  eventMemberId: string;
  holeNumber: number;
  netStrokes: number;
}

export interface SkinsResult {
  holeNumber: number;
  winnerId?: string;
  winnerName?: string;
  value: number;
  tied: boolean;
  carriedOver: number; // Accumulated value from previous ties
  participants: Array<{
    eventMemberId: string;
    name: string;
    netStrokes: number;
  }>;
}

export interface SkinsTotals {
  [eventMemberId: string]: {
    skinsWon: number;
    totalValue: number;
    holes: number[]; // Hole numbers won
  };
}

/**
 * Calculate skins game results for a round
 */
export function calculateSkins(
  allScores: HoleScore[],
  playerNames: Map<string, string>,
  config: SkinsConfig = {
    carryover: true,
    value: 100, // $1.00 default
    eligibleHoles: Array.from({ length: 18 }, (_, i) => i + 1),
    autoCarryLastHole: false,
  }
): {
  holeResults: SkinsResult[];
  totals: SkinsTotals;
} {
  const holeResults: SkinsResult[] = [];
  const totals: SkinsTotals = {};

  // Initialize totals for all players
  const uniquePlayers = new Set(allScores.map((s) => s.eventMemberId));
  uniquePlayers.forEach((playerId) => {
    totals[playerId] = {
      skinsWon: 0,
      totalValue: 0,
      holes: [],
    };
  });

  let carryoverValue = 0;

  for (const holeNumber of config.eligibleHoles) {
    // Get all scores for this hole
    const holeScores = allScores.filter((s) => s.holeNumber === holeNumber);

    if (holeScores.length === 0) continue;

    // Find the lowest score
    const lowestScore = Math.min(...holeScores.map((s) => s.netStrokes));
    const winners = holeScores.filter((s) => s.netStrokes === lowestScore);

    const currentValue = config.value + carryoverValue;
    const participants = holeScores.map((s) => ({
      eventMemberId: s.eventMemberId,
      name: playerNames.get(s.eventMemberId) || "Unknown",
      netStrokes: s.netStrokes,
    }));

    if (winners.length === 1) {
      // Single winner - award the skin
      const winnerId = winners[0].eventMemberId;
      const winnerName = playerNames.get(winnerId) || "Unknown";

      holeResults.push({
        holeNumber,
        winnerId,
        winnerName,
        value: currentValue,
        tied: false,
        carriedOver: carryoverValue,
        participants,
      });

      // Update totals
      totals[winnerId].skinsWon++;
      totals[winnerId].totalValue += currentValue;
      totals[winnerId].holes.push(holeNumber);

      // Reset carryover
      carryoverValue = 0;
    } else {
      // Tie - no winner
      holeResults.push({
        holeNumber,
        value: currentValue,
        tied: true,
        carriedOver: carryoverValue,
        participants,
      });

      // Carry over value if enabled
      if (config.carryover) {
        carryoverValue += config.value;
      } else {
        carryoverValue = 0;
      }
    }
  }

  // Handle final carryover (if hole 18 tied)
  if (carryoverValue > 0 && !config.autoCarryLastHole) {
    // Split the carryover among all players
    const playerCount = uniquePlayers.size;
    const splitValue = Math.floor(carryoverValue / playerCount);

    uniquePlayers.forEach((playerId) => {
      totals[playerId].totalValue += splitValue;
    });
  }

  return {
    holeResults,
    totals,
  };
}

/**
 * Get skins leaderboard sorted by skins won, then total value
 */
export function getSkinsLeaderboard(
  totals: SkinsTotals,
  playerNames: Map<string, string>
): Array<{
  position: number;
  eventMemberId: string;
  name: string;
  skinsWon: number;
  totalValue: number;
  holes: number[];
}> {
  const entries = Object.entries(totals).map(([eventMemberId, data]) => ({
    eventMemberId,
    name: playerNames.get(eventMemberId) || "Unknown",
    ...data,
  }));

  // Sort by skins won (descending), then by total value (descending)
  entries.sort((a, b) => {
    if (b.skinsWon !== a.skinsWon) {
      return b.skinsWon - a.skinsWon;
    }
    return b.totalValue - a.totalValue;
  });

  // Assign positions with ties
  let position = 1;
  const leaderboard = entries.map((entry, index) => {
    if (index > 0) {
      const prev = entries[index - 1];
      if (
        entry.skinsWon !== prev.skinsWon ||
        entry.totalValue !== prev.totalValue
      ) {
        position = index + 1;
      }
    }

    return {
      position,
      ...entry,
    };
  });

  return leaderboard;
}
