import {
  ScoringEngine,
  ScoringFormat,
  HoleScoreInput,
  HoleScoreResult,
  TotalScoreResult,
  ScoringConfig,
} from "../types";

/**
 * Stableford scoring engine
 * Points-based system where higher scores are better
 */
export class StablefordEngine implements ScoringEngine {
  format = ScoringFormat.STABLEFORD;
  private config: ScoringConfig;

  constructor(config: ScoringConfig = {}) {
    this.config = config;
  }

  /**
   * Get points for a hole based on score relative to par
   */
  private getPoints(netStrokes: number, par: number): number {
    const diff = par - netStrokes;

    // Use custom points if provided
    if (this.config.stablefordPoints) {
      const points = this.config.stablefordPoints;
      if (diff >= 3) return points.albatross ?? 5;
      if (diff === 2) return points.eagle ?? 4;
      if (diff === 1) return points.birdie ?? 3;
      if (diff === 0) return points.par ?? 2;
      if (diff === -1) return points.bogey ?? 1;
      if (diff === -2) return points.doubleBogey ?? 0;
      return points.worse ?? 0;
    }

    // Standard Stableford points
    if (diff >= 3) return 5; // Albatross or better
    if (diff === 2) return 4; // Eagle
    if (diff === 1) return 3; // Birdie
    if (diff === 0) return 2; // Par
    if (diff === -1) return 1; // Bogey
    return 0; // Double bogey or worse
  }

  calculateHoleScore(input: HoleScoreInput): HoleScoreResult {
    const netStrokes = Math.max(0, input.strokes - input.handicapStrokes);
    const points = this.getPoints(netStrokes, input.par);

    return {
      holeNumber: input.holeNumber,
      strokes: input.strokes,
      netStrokes,
      points,
    };
  }

  calculateTotalScore(holes: HoleScoreResult[]): TotalScoreResult {
    const grossTotal = holes.reduce((sum, hole) => sum + hole.strokes, 0);
    const netTotal = holes.reduce((sum, hole) => sum + hole.netStrokes, 0);
    const totalPoints = holes.reduce((sum, hole) => sum + (hole.points || 0), 0);

    return {
      grossTotal,
      netTotal,
      totalPoints,
    };
  }

  compareScores(a: TotalScoreResult, b: TotalScoreResult): number {
    // Higher points is better
    return (b.totalPoints || 0) - (a.totalPoints || 0);
  }

  getLeaderboardDisplay(score: TotalScoreResult): string {
    return `${score.totalPoints || 0} pts`;
  }

  getDescription(): string {
    return "Stableford scoring - earn points based on score relative to par. Higher points win. Standard: Eagle=4, Birdie=3, Par=2, Bogey=1.";
  }
}

/**
 * Modified Stableford scoring engine
 * Custom points system (e.g., PGA Tour uses different values)
 */
export class ModifiedStablefordEngine extends StablefordEngine {
  format = ScoringFormat.MODIFIED_STABLEFORD;

  constructor(config: ScoringConfig = {}) {
    // Set modified Stableford defaults if not provided
    const modifiedConfig = {
      ...config,
      stablefordPoints: config.stablefordPoints || {
        albatross: 8,
        eagle: 5,
        birdie: 2,
        par: 0,
        bogey: -1,
        doubleBogey: -3,
        worse: -3,
      },
    };
    super(modifiedConfig);
  }

  getDescription(): string {
    return "Modified Stableford - custom points system. Typically: Eagle=5, Birdie=2, Par=0, Bogey=-1, Double=-3.";
  }
}
