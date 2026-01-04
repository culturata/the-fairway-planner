/**
 * Golf handicap calculation utilities
 * Based on USGA handicap system
 */

/**
 * Calculate course handicap from handicap index
 * Formula: Handicap Index × (Slope Rating / 113) + (Course Rating - Par)
 *
 * @param handicapIndex - Player's handicap index
 * @param slopeRating - Course slope rating (typically 55-155, standard is 113)
 * @param courseRating - Course rating (e.g., 72.4)
 * @param par - Course par (typically 72)
 * @returns Rounded course handicap
 */
export function calculateCourseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number
): number {
  return Math.round(
    handicapIndex * (slopeRating / 113) + (courseRating - par)
  );
}

/**
 * Calculate playing handicap (course handicap with percentage applied)
 *
 * @param handicapIndex - Player's handicap index
 * @param slopeRating - Course slope rating
 * @param courseRating - Course rating
 * @param par - Course par
 * @param handicapPct - Handicap percentage (e.g., 100 = 100%, 80 = 80%)
 * @param handicapCap - Optional handicap cap
 * @returns Playing handicap for the round
 */
export function calculatePlayingHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number,
  handicapPct: number = 100,
  handicapCap?: number | null
): number {
  // Calculate course handicap
  const courseHandicap = calculateCourseHandicap(
    handicapIndex,
    slopeRating,
    courseRating,
    par
  );

  // Apply handicap percentage
  let playingHandicap = Math.round((courseHandicap * handicapPct) / 100);

  // Apply cap if specified
  if (handicapCap !== null && handicapCap !== undefined) {
    playingHandicap = Math.min(playingHandicap, handicapCap);
  }

  return playingHandicap;
}

/**
 * Distribute handicap strokes across 18 holes based on hole handicap/stroke index
 *
 * @param playingHandicap - Playing handicap for the round
 * @param holes - Array of hole data with handicap (stroke index)
 * @returns Array of strokes to receive on each hole (0 or 1 or 2 for high handicaps)
 */
export function calculateHandicapStrokesPerHole(
  playingHandicap: number,
  holes: Array<{ holeNumber: number; handicap: number }>
): number[] {
  const strokesPerHole = new Array(18).fill(0);

  // Sort holes by handicap index to determine stroke allocation
  const sortedHoles = [...holes].sort((a, b) => a.handicap - b.handicap);

  // Distribute strokes based on playing handicap
  let strokesRemaining = Math.abs(playingHandicap);

  // First pass: give 1 stroke to holes based on handicap index
  for (let i = 0; i < Math.min(18, strokesRemaining); i++) {
    const hole = sortedHoles[i];
    const holeIndex = hole.holeNumber - 1;
    strokesPerHole[holeIndex] = 1;
  }

  strokesRemaining -= 18;

  // Second pass: for handicaps > 18, give second strokes
  if (strokesRemaining > 0) {
    for (let i = 0; i < Math.min(18, strokesRemaining); i++) {
      const hole = sortedHoles[i];
      const holeIndex = hole.holeNumber - 1;
      strokesPerHole[holeIndex] = 2;
    }
  }

  return strokesPerHole;
}

/**
 * Calculate net score for a hole
 *
 * @param grossScore - Gross strokes on the hole
 * @param strokesReceived - Number of strokes received on this hole
 * @returns Net score
 */
export function calculateNetScore(
  grossScore: number,
  strokesReceived: number
): number {
  return Math.max(0, grossScore - strokesReceived);
}

/**
 * Calculate differential for handicap index calculation
 * Differential = (Adjusted Gross Score - Course Rating) × (113 / Slope Rating)
 *
 * @param adjustedGrossScore - Player's adjusted gross score
 * @param courseRating - Course rating
 * @param slopeRating - Course slope rating
 * @returns Score differential
 */
export function calculateDifferential(
  adjustedGrossScore: number,
  courseRating: number,
  slopeRating: number
): number {
  return ((adjustedGrossScore - courseRating) * 113) / slopeRating;
}

/**
 * Legacy function: Simple handicap application without course data
 * Used for backward compatibility when course rating/slope not available
 *
 * @param grossScore - Gross score
 * @param handicap - Player's handicap
 * @param handicapPct - Handicap percentage
 * @param handicapCap - Optional handicap cap
 * @returns Net score
 */
export function applySimpleHandicap(
  grossScore: number,
  handicap: number,
  handicapPct: number = 100,
  handicapCap?: number | null
): number {
  let adjustedHandicap = (handicap * handicapPct) / 100;

  if (handicapCap !== null && handicapCap !== undefined) {
    adjustedHandicap = Math.min(adjustedHandicap, handicapCap);
  }

  return Math.round(grossScore - adjustedHandicap);
}
