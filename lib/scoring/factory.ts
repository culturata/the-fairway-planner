import { ScoringFormat, ScoringEngine, ScoringConfig } from "./types";
import { StrokePlayEngine } from "./engines/stroke-play";
import {
  StablefordEngine,
  ModifiedStablefordEngine,
} from "./engines/stableford";
import { MatchPlayEngine } from "./engines/match-play";
import { ScrambleEngine, BestBallEngine } from "./engines/team-formats";

/**
 * Factory function to get the appropriate scoring engine
 *
 * @param format - The scoring format to use
 * @param config - Optional configuration for the scoring format
 * @returns The appropriate scoring engine instance
 */
export function getScoringEngine(
  format: ScoringFormat | string,
  config: ScoringConfig = {}
): ScoringEngine {
  switch (format) {
    case ScoringFormat.STROKE_PLAY:
      return new StrokePlayEngine();

    case ScoringFormat.STABLEFORD:
      return new StablefordEngine(config);

    case ScoringFormat.MODIFIED_STABLEFORD:
      return new ModifiedStablefordEngine(config);

    case ScoringFormat.MATCH_PLAY:
      return new MatchPlayEngine();

    case ScoringFormat.SCRAMBLE:
      return new ScrambleEngine(config);

    case ScoringFormat.BEST_BALL:
      return new BestBallEngine(config);

    default:
      // Default to stroke play for unknown formats
      console.warn(`Unknown scoring format: ${format}, defaulting to Stroke Play`);
      return new StrokePlayEngine();
  }
}

/**
 * Get all available scoring formats with descriptions
 */
export function getAvailableFormats(): Array<{
  format: ScoringFormat;
  name: string;
  description: string;
}> {
  return [
    {
      format: ScoringFormat.STROKE_PLAY,
      name: "Stroke Play",
      description: new StrokePlayEngine().getDescription(),
    },
    {
      format: ScoringFormat.STABLEFORD,
      name: "Stableford",
      description: new StablefordEngine().getDescription(),
    },
    {
      format: ScoringFormat.MODIFIED_STABLEFORD,
      name: "Modified Stableford",
      description: new ModifiedStablefordEngine().getDescription(),
    },
    {
      format: ScoringFormat.MATCH_PLAY,
      name: "Match Play",
      description: new MatchPlayEngine().getDescription(),
    },
    {
      format: ScoringFormat.SCRAMBLE,
      name: "Scramble",
      description: new ScrambleEngine().getDescription(),
    },
    {
      format: ScoringFormat.BEST_BALL,
      name: "Best Ball",
      description: new BestBallEngine().getDescription(),
    },
  ];
}
