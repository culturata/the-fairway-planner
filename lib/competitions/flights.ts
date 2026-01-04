/**
 * Flights (Handicap Divisions) Competition Logic
 *
 * Flights divide players into groups based on handicap for fair competition
 */

export interface FlightMember {
  eventMemberId: string;
  name: string;
  handicap: number;
}

export interface Flight {
  id: string;
  name: string; // "Flight A", "Flight B", etc.
  minHandicap: number;
  maxHandicap: number;
  members: FlightMember[];
}

export interface FlightConfig {
  numberOfFlights: number;
  method: "EQUAL_SIZE" | "HANDICAP_RANGE"; // How to divide flights
  customRanges?: Array<{
    // For HANDICAP_RANGE method
    name: string;
    minHandicap: number;
    maxHandicap: number;
  }>;
}

/**
 * Create flights by dividing players into equal-sized groups
 */
export function createFlightsBySize(
  members: FlightMember[],
  numberOfFlights: number
): Flight[] {
  if (numberOfFlights < 1) {
    throw new Error("Number of flights must be at least 1");
  }

  if (members.length === 0) {
    return [];
  }

  // Sort members by handicap (lowest to highest)
  const sortedMembers = [...members].sort((a, b) => a.handicap - b.handicap);

  const flights: Flight[] = [];
  const flightSize = Math.ceil(sortedMembers.length / numberOfFlights);

  for (let i = 0; i < numberOfFlights; i++) {
    const startIndex = i * flightSize;
    const endIndex = Math.min(startIndex + flightSize, sortedMembers.length);
    const flightMembers = sortedMembers.slice(startIndex, endIndex);

    if (flightMembers.length === 0) break;

    const minHandicap = Math.min(...flightMembers.map((m) => m.handicap));
    const maxHandicap = Math.max(...flightMembers.map((m) => m.handicap));

    flights.push({
      id: `flight-${i}`,
      name: `Flight ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
      minHandicap,
      maxHandicap,
      members: flightMembers,
    });
  }

  return flights;
}

/**
 * Create flights using custom handicap ranges
 */
export function createFlightsByRange(
  members: FlightMember[],
  ranges: Array<{
    name: string;
    minHandicap: number;
    maxHandicap: number;
  }>
): Flight[] {
  const flights: Flight[] = [];

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const flightMembers = members.filter(
      (m) => m.handicap >= range.minHandicap && m.handicap <= range.maxHandicap
    );

    // Sort members within flight by handicap
    flightMembers.sort((a, b) => a.handicap - b.handicap);

    flights.push({
      id: `flight-${i}`,
      name: range.name,
      minHandicap: range.minHandicap,
      maxHandicap: range.maxHandicap,
      members: flightMembers,
    });
  }

  return flights;
}

/**
 * Create flights using the configured method
 */
export function createFlights(
  members: FlightMember[],
  config: FlightConfig
): Flight[] {
  if (config.method === "HANDICAP_RANGE" && config.customRanges) {
    return createFlightsByRange(members, config.customRanges);
  } else {
    return createFlightsBySize(members, config.numberOfFlights);
  }
}

/**
 * Get leaderboard for a specific flight
 */
export interface FlightScore {
  eventMemberId: string;
  name: string;
  handicap: number;
  grossTotal: number;
  netTotal: number;
  stablefordPoints?: number;
}

export function getFlightLeaderboard(
  flightId: string,
  flights: Flight[],
  scores: FlightScore[],
  scoringFormat: "STROKE_PLAY" | "STABLEFORD" = "STROKE_PLAY"
): Array<FlightScore & { position: number }> {
  const flight = flights.find((f) => f.id === flightId);
  if (!flight) {
    return [];
  }

  // Get scores only for members in this flight
  const memberIds = new Set(flight.members.map((m) => m.eventMemberId));
  const flightScores = scores.filter((s) => memberIds.has(s.eventMemberId));

  // Sort based on scoring format
  if (scoringFormat === "STABLEFORD") {
    flightScores.sort((a, b) => {
      const aPoints = a.stablefordPoints ?? 0;
      const bPoints = b.stablefordPoints ?? 0;
      return bPoints - aPoints; // Higher is better
    });
  } else {
    // STROKE_PLAY - lower is better
    flightScores.sort((a, b) => a.netTotal - b.netTotal);
  }

  // Assign positions with ties
  let position = 1;
  const leaderboard = flightScores.map((score, index) => {
    if (index > 0) {
      const prev = flightScores[index - 1];
      const currentKey =
        scoringFormat === "STABLEFORD"
          ? score.stablefordPoints
          : score.netTotal;
      const prevKey =
        scoringFormat === "STABLEFORD"
          ? prev.stablefordPoints
          : prev.netTotal;

      if (currentKey !== prevKey) {
        position = index + 1;
      }
    }

    return {
      position,
      ...score,
    };
  });

  return leaderboard;
}

/**
 * Auto-suggest flight ranges based on handicap distribution
 */
export function suggestFlightRanges(
  handicaps: number[],
  numberOfFlights: number
): Array<{
  name: string;
  minHandicap: number;
  maxHandicap: number;
}> {
  if (handicaps.length === 0 || numberOfFlights < 1) {
    return [];
  }

  const sorted = [...handicaps].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;
  const rangePerFlight = range / numberOfFlights;

  const suggestions = [];
  for (let i = 0; i < numberOfFlights; i++) {
    const minH = Math.floor(min + i * rangePerFlight);
    const maxH =
      i === numberOfFlights - 1
        ? max
        : Math.floor(min + (i + 1) * rangePerFlight);

    suggestions.push({
      name: `Flight ${String.fromCharCode(65 + i)}`,
      minHandicap: minH,
      maxHandicap: maxH,
    });
  }

  return suggestions;
}
