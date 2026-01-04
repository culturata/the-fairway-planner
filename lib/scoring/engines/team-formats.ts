import {
  ScoringEngine,
  ScoringFormat,
  HoleScoreInput,
  HoleScoreResult,
  TotalScoreResult,
  ScoringConfig,
} from "../types";

/**
 * Scramble scoring engine
 * Team format where all players hit from the best shot
 * Only one score per hole for the team
 */
export class ScrambleEngine implements ScoringEngine {
  format = ScoringFormat.SCRAMBLE;
  private config: ScoringConfig;

  constructor(config: ScoringConfig = {}) {
    this.config = config;
  }

  calculateHoleScore(input: HoleScoreInput): HoleScoreResult {
    // In scramble, the team score is already the best shot
    // Handicap strokes are applied differently (often team handicap / # of players)
    const netStrokes = Math.max(0, input.strokes - input.handicapStrokes);

    return {
      holeNumber: input.holeNumber,
      strokes: input.strokes,
      netStrokes,
    };
  }

  calculateTotalScore(holes: HoleScoreResult[]): TotalScoreResult {
    const grossTotal = holes.reduce((sum, hole) => sum + hole.strokes, 0);
    const netTotal = holes.reduce((sum, hole) => sum + hole.netStrokes, 0);

    return {
      grossTotal,
      netTotal,
    };
  }

  compareScores(a: TotalScoreResult, b: TotalScoreResult): number {
    // Lower score is better
    return a.netTotal - b.netTotal;
  }

  getLeaderboardDisplay(score: TotalScoreResult): string {
    const par = 72;
    const toPar = score.netTotal - par;

    if (toPar === 0) return "E";
    if (toPar > 0) return `+${toPar}`;
    return `${toPar}`;
  }

  getDescription(): string {
    return "Scramble - team format where all players hit from the best shot. Team records one score per hole.";
  }
}

/**
 * Best Ball (Four Ball) scoring engine
 * Team format where each player plays their own ball
 * Team score is the lowest score among team members on each hole
 */
export class BestBallEngine implements ScoringEngine {
  format = ScoringFormat.BEST_BALL;
  private config: ScoringConfig;

  constructor(config: ScoringConfig = {}) {
    this.config = config;
  }

  calculateHoleScore(input: HoleScoreInput): HoleScoreResult {
    const netStrokes = Math.max(0, input.strokes - input.handicapStrokes);

    return {
      holeNumber: input.holeNumber,
      strokes: input.strokes,
      netStrokes,
    };
  }

  /**
   * Calculate best ball score from multiple players' scores
   */
  calculateBestBall(
    playersHoles: HoleScoreResult[][],
    countBest: number = 1
  ): HoleScoreResult[] {
    const teamHoles: HoleScoreResult[] = [];

    // Process each hole
    for (let holeNum = 1; holeNum <= 18; holeNum++) {
      // Get all players' scores for this hole
      const holeScores = playersHoles
        .map((playerHoles) => playerHoles.find((h) => h.holeNumber === holeNum))
        .filter((h) => h !== undefined) as HoleScoreResult[];

      if (holeScores.length === 0) continue;

      // Sort by net score and take the best 'countBest' scores
      const bestScores = [...holeScores]
        .sort((a, b) => a.netStrokes - b.netStrokes)
        .slice(0, countBest);

      // Team score is the average (or sum) of best scores
      const teamNetStrokes = Math.round(
        bestScores.reduce((sum, s) => sum + s.netStrokes, 0) / bestScores.length
      );
      const teamGrossStrokes = Math.round(
        bestScores.reduce((sum, s) => sum + s.strokes, 0) / bestScores.length
      );

      teamHoles.push({
        holeNumber: holeNum,
        strokes: teamGrossStrokes,
        netStrokes: teamNetStrokes,
      });
    }

    return teamHoles;
  }

  calculateTotalScore(holes: HoleScoreResult[]): TotalScoreResult {
    const grossTotal = holes.reduce((sum, hole) => sum + hole.strokes, 0);
    const netTotal = holes.reduce((sum, hole) => sum + hole.netStrokes, 0);

    return {
      grossTotal,
      netTotal,
    };
  }

  compareScores(a: TotalScoreResult, b: TotalScoreResult): number {
    // Lower score is better
    return a.netTotal - b.netTotal;
  }

  getLeaderboardDisplay(score: TotalScoreResult): string {
    const par = 72;
    const toPar = score.netTotal - par;

    if (toPar === 0) return "E";
    if (toPar > 0) return `+${toPar}`;
    return `${toPar}`;
  }

  getDescription(): string {
    return "Best Ball - each player plays their own ball. Team score on each hole is the lowest net score among team members.";
  }
}
