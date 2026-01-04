/**
 * Scoring format types and interfaces
 */

export enum ScoringFormat {
  STROKE_PLAY = "STROKE_PLAY",
  STABLEFORD = "STABLEFORD",
  MATCH_PLAY = "MATCH_PLAY",
  SCRAMBLE = "SCRAMBLE",
  BEST_BALL = "BEST_BALL",
  MODIFIED_STABLEFORD = "MODIFIED_STABLEFORD",
}

export interface HoleData {
  holeNumber: number;
  par: number;
  handicap: number; // Stroke index
  yardage?: number;
}

export interface HoleScoreInput {
  holeNumber: number;
  strokes: number;
  par: number;
  handicapStrokes: number; // Strokes received on this hole
}

export interface HoleScoreResult {
  holeNumber: number;
  strokes: number;
  netStrokes: number;
  points?: number; // For Stableford
  won?: boolean; // For Match Play
  tied?: boolean; // For Match Play
  [key: string]: any; // Allow additional format-specific data
}

export interface TotalScoreResult {
  grossTotal: number;
  netTotal: number;
  totalPoints?: number; // For Stableford
  holesWon?: number; // For Match Play
  holesLost?: number; // For Match Play
  holesTied?: number; // For Match Play
  matchResult?: string; // For Match Play (e.g., "3&2", "AS")
  [key: string]: any; // Allow additional format-specific data
}

export interface ScoringEngine {
  format: ScoringFormat;

  /**
   * Calculate the score for a single hole
   */
  calculateHoleScore(input: HoleScoreInput): HoleScoreResult;

  /**
   * Calculate the total score from all hole results
   */
  calculateTotalScore(holes: HoleScoreResult[]): TotalScoreResult;

  /**
   * Compare two total scores
   * @returns Negative if a is better, positive if b is better, 0 if tied
   */
  compareScores(a: TotalScoreResult, b: TotalScoreResult): number;

  /**
   * Get display string for leaderboard
   */
  getLeaderboardDisplay(score: TotalScoreResult): string;

  /**
   * Get scoring format description
   */
  getDescription(): string;
}

export interface ScoringConfig {
  // Stableford-specific
  stablefordPoints?: {
    albatross?: number;
    eagle?: number;
    birdie?: number;
    par?: number;
    bogey?: number;
    doubleBogey?: number;
    worse?: number;
  };

  // Match Play-specific
  matchPlayOpponentId?: string;

  // Team formats
  teamSize?: number;
  countBest?: number; // For best ball - count best X scores

  // Other format-specific config
  [key: string]: any;
}
