import {
  ScoringEngine,
  ScoringFormat,
  HoleScoreInput,
  HoleScoreResult,
  TotalScoreResult,
} from "../types";

/**
 * Match Play scoring engine
 * Head-to-head competition where you win/lose/tie each hole
 */
export class MatchPlayEngine implements ScoringEngine {
  format = ScoringFormat.MATCH_PLAY;

  /**
   * Calculate match play for a single hole
   * Note: For match play to work properly, you need both players' scores
   * This engine assumes comparison happens at the total score level
   */
  calculateHoleScore(input: HoleScoreInput): HoleScoreResult {
    const netStrokes = Math.max(0, input.strokes - input.handicapStrokes);

    return {
      holeNumber: input.holeNumber,
      strokes: input.strokes,
      netStrokes,
    };
  }

  /**
   * Calculate match play result between two scorecards
   * This is different from other formats as it requires both players' scores
   */
  calculateTotalScore(holes: HoleScoreResult[]): TotalScoreResult {
    const grossTotal = holes.reduce((sum, hole) => sum + hole.strokes, 0);
    const netTotal = holes.reduce((sum, hole) => sum + hole.netStrokes, 0);

    return {
      grossTotal,
      netTotal,
      holesWon: 0,
      holesLost: 0,
      holesTied: 0,
      matchResult: "AS", // All Square
    };
  }

  /**
   * Compare two match play scores
   * Note: For proper match play, use compareMatchPlay instead
   */
  compareScores(a: TotalScoreResult, b: TotalScoreResult): number {
    const aResult = (a.holesWon || 0) - (a.holesLost || 0);
    const bResult = (b.holesWon || 0) - (b.holesLost || 0);
    return bResult - aResult; // Higher difference is better
  }

  /**
   * Compare two players' scorecards hole-by-hole for match play
   */
  compareMatchPlay(
    playerA: HoleScoreResult[],
    playerB: HoleScoreResult[]
  ): {
    playerAScore: TotalScoreResult;
    playerBScore: TotalScoreResult;
    matchResult: string;
    winner?: "A" | "B" | "TIE";
  } {
    let holesWonA = 0;
    let holesWonB = 0;
    let holesTied = 0;
    let currentStatus = 0; // Positive = A ahead, Negative = B ahead
    let holesRemaining = 18;

    // Compare each hole
    for (let i = 0; i < Math.min(playerA.length, playerB.length); i++) {
      const holeA = playerA[i];
      const holeB = playerB[i];

      if (holeA.netStrokes < holeB.netStrokes) {
        holesWonA++;
        currentStatus++;
      } else if (holeA.netStrokes > holeB.netStrokes) {
        holesWonB++;
        currentStatus--;
      } else {
        holesTied++;
      }

      holesRemaining = 18 - (i + 1);

      // Check if match is over (one player can't catch up)
      if (Math.abs(currentStatus) > holesRemaining) {
        break;
      }
    }

    const totalHolesPlayed = holesWonA + holesWonB + holesTied;
    const holesRemainingFinal = 18 - totalHolesPlayed;

    // Determine match result string
    let matchResult: string;
    let winner: "A" | "B" | "TIE" | undefined;

    if (holesWonA > holesWonB) {
      const margin = holesWonA - holesWonB;
      if (holesRemainingFinal > 0) {
        matchResult = `${margin}&${holesRemainingFinal}`; // e.g., "3&2"
      } else {
        matchResult = `${margin} up`; // e.g., "1 up"
      }
      winner = "A";
    } else if (holesWonB > holesWonA) {
      const margin = holesWonB - holesWonA;
      if (holesRemainingFinal > 0) {
        matchResult = `${margin}&${holesRemainingFinal}`;
      } else {
        matchResult = `${margin} up`;
      }
      winner = "B";
    } else {
      matchResult = "AS"; // All Square
      winner = "TIE";
    }

    const grossTotalA = playerA.reduce((sum, h) => sum + h.strokes, 0);
    const netTotalA = playerA.reduce((sum, h) => sum + h.netStrokes, 0);
    const grossTotalB = playerB.reduce((sum, h) => sum + h.strokes, 0);
    const netTotalB = playerB.reduce((sum, h) => sum + h.netStrokes, 0);

    return {
      playerAScore: {
        grossTotal: grossTotalA,
        netTotal: netTotalA,
        holesWon: holesWonA,
        holesLost: holesWonB,
        holesTied,
        matchResult: winner === "A" ? matchResult : undefined,
      },
      playerBScore: {
        grossTotal: grossTotalB,
        netTotal: netTotalB,
        holesWon: holesWonB,
        holesLost: holesWonA,
        holesTied,
        matchResult: winner === "B" ? matchResult : undefined,
      },
      matchResult,
      winner,
    };
  }

  getLeaderboardDisplay(score: TotalScoreResult): string {
    if (score.matchResult) {
      return score.matchResult;
    }
    const won = score.holesWon || 0;
    const lost = score.holesLost || 0;
    if (won > lost) return `${won - lost} up`;
    if (lost > won) return `${lost - won} down`;
    return "AS";
  }

  getDescription(): string {
    return "Match Play - compete hole-by-hole against an opponent. Win the hole with the lowest net score. Match is won when opponent cannot catch up.";
  }
}
