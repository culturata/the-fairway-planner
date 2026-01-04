/**
 * Closest to Pin (CTP) Competition Logic
 *
 * Competition for par 3 holes where players measure distance from pin
 */

export interface CTPConfig {
  holes: number[]; // Which holes have CTP (typically par 3s)
  unit: "FEET" | "INCHES" | "METERS"; // Distance measurement unit
  requireGreen: boolean; // If true, ball must be on green to qualify
}

export interface CTPMeasurement {
  eventMemberId: string;
  name: string;
  holeNumber: number;
  distance: number; // Distance in configured unit
  unit: string;
  onGreen: boolean;
  timestamp: Date;
}

export interface CTPResult {
  holeNumber: number;
  winnerId?: string;
  winnerName?: string;
  distance?: number;
  unit: string;
  measurements: CTPMeasurement[];
}

/**
 * Calculate CTP winners for each configured hole
 */
export function calculateCTP(
  measurements: CTPMeasurement[],
  config: CTPConfig
): CTPResult[] {
  const results: CTPResult[] = [];

  for (const holeNumber of config.holes) {
    // Get all measurements for this hole
    const holeMeasurements = measurements.filter(
      (m) => m.holeNumber === holeNumber
    );

    // Filter by green requirement if needed
    const qualifyingMeasurements = config.requireGreen
      ? holeMeasurements.filter((m) => m.onGreen)
      : holeMeasurements;

    if (qualifyingMeasurements.length === 0) {
      results.push({
        holeNumber,
        unit: config.unit,
        measurements: holeMeasurements,
      });
      continue;
    }

    // Find the closest
    const winner = qualifyingMeasurements.reduce((closest, current) => {
      return current.distance < closest.distance ? current : closest;
    });

    results.push({
      holeNumber,
      winnerId: winner.eventMemberId,
      winnerName: winner.name,
      distance: winner.distance,
      unit: config.unit,
      measurements: holeMeasurements,
    });
  }

  return results;
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number, unit: string): string {
  if (unit === "FEET") {
    const feet = Math.floor(distance / 12);
    const inches = Math.round(distance % 12);
    return `${feet}' ${inches}"`;
  } else if (unit === "INCHES") {
    return `${distance}"`;
  } else if (unit === "METERS") {
    return `${distance.toFixed(2)}m`;
  }
  return `${distance} ${unit}`;
}

/**
 * Convert distance to inches for consistent storage
 */
export function convertToInches(distance: number, unit: string): number {
  if (unit === "FEET") {
    return distance * 12;
  } else if (unit === "METERS") {
    return distance * 39.3701; // 1 meter = 39.3701 inches
  }
  return distance; // Already in inches
}

/**
 * Convert inches to target unit
 */
export function convertFromInches(inches: number, unit: string): number {
  if (unit === "FEET") {
    return inches / 12;
  } else if (unit === "METERS") {
    return inches / 39.3701;
  }
  return inches; // Return as inches
}

/**
 * Validate a CTP measurement
 */
export function validateMeasurement(
  measurement: Omit<CTPMeasurement, "timestamp">,
  config: CTPConfig
): { valid: boolean; error?: string } {
  // Check if hole is configured for CTP
  if (!config.holes.includes(measurement.holeNumber)) {
    return {
      valid: false,
      error: `Hole ${measurement.holeNumber} is not configured for CTP`,
    };
  }

  // Check green requirement
  if (config.requireGreen && !measurement.onGreen) {
    return {
      valid: false,
      error: "Ball must be on the green to qualify",
    };
  }

  // Check distance is positive
  if (measurement.distance < 0) {
    return {
      valid: false,
      error: "Distance must be positive",
    };
  }

  // Sanity check on distance (e.g., no more than 300 yards)
  const distanceInInches = convertToInches(measurement.distance, measurement.unit);
  if (distanceInInches > 10800) {
    // 300 yards = 10800 inches
    return {
      valid: false,
      error: "Distance seems unrealistic (> 300 yards)",
    };
  }

  return { valid: true };
}

/**
 * Get overall CTP champion across all holes
 */
export function getCTPChampion(
  results: CTPResult[]
): {
  eventMemberId: string;
  name: string;
  ctpWins: number;
  holes: number[];
} | null {
  const wins = new Map<
    string,
    { name: string; count: number; holes: number[] }
  >();

  for (const result of results) {
    if (!result.winnerId) continue;

    const existing = wins.get(result.winnerId);
    if (existing) {
      existing.count++;
      existing.holes.push(result.holeNumber);
    } else {
      wins.set(result.winnerId, {
        name: result.winnerName!,
        count: 1,
        holes: [result.holeNumber],
      });
    }
  }

  if (wins.size === 0) return null;

  // Find player with most CTP wins
  let champion: {
    eventMemberId: string;
    name: string;
    ctpWins: number;
    holes: number[];
  } | null = null;

  for (const [eventMemberId, data] of wins.entries()) {
    if (!champion || data.count > champion.ctpWins) {
      champion = {
        eventMemberId,
        name: data.name,
        ctpWins: data.count,
        holes: data.holes,
      };
    }
  }

  return champion;
}
