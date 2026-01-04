import {
  ScoringEngine,
  ScoringFormat,
  HoleScoreInput,
  HoleScoreResult,
  TotalScoreResult,
} from "../types";

/**
 * Stroke Play scoring engine
 * Traditional golf scoring - lowest gross/net score wins
 */
export class StrokePlayEngine implements ScoringEngine {
  format = ScoringFormat.STROKE_PLAY;

  calculateHoleScore(input: HoleScoreInput): HoleScoreResult {
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
    // Lower net score is better
    return a.netTotal - b.netTotal;
  }

  getLeaderboardDisplay(score: TotalScoreResult): string {
    const par = 72; // Default par, should be passed from course
    const toPar = score.netTotal - par;

    if (toPar === 0) return "E";
    if (toPar > 0) return `+${toPar}`;
    return `${toPar}`;
  }

  getDescription(): string {
    return "Traditional stroke play - lowest score wins. Net scores are calculated by subtracting handicap strokes from gross scores.";
  }
}
