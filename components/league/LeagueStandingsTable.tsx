"use client";

import { formatDate } from "@/lib/utils";

interface Standing {
  id: string;
  position: number | null;
  totalPoints: number;
  roundsPlayed: number;
  stats?: {
    avgScore?: number;
    bestRound?: number;
    worstRound?: number;
    avgPoints?: number;
  };
  eventMember: {
    id: string;
    handicap: number | null;
    userProfile: {
      id: string;
      name: string | null;
      email: string | null;
    };
  };
}

interface LeagueStandingsTableProps {
  standings: Standing[];
  seasonName: string;
  seasonStartDate: Date;
  seasonEndDate: Date;
  onRecalculate?: () => void;
  isRecalculating?: boolean;
}

export function LeagueStandingsTable({
  standings,
  seasonName,
  seasonStartDate,
  seasonEndDate,
  onRecalculate,
  isRecalculating = false,
}: LeagueStandingsTableProps) {
  // Sort standings by position
  const sortedStandings = [...standings].sort((a, b) => {
    if (a.position === null) return 1;
    if (b.position === null) return -1;
    return a.position - b.position;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{seasonName}</h2>
          <p className="text-sm text-gray-600">
            {formatDate(seasonStartDate)} - {formatDate(seasonEndDate)}
          </p>
        </div>
        {onRecalculate && (
          <button
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRecalculating ? "Recalculating..." : "Recalculate Standings"}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                HCP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rounds
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Best Round
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStandings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No standings available yet
                </td>
              </tr>
            ) : (
              sortedStandings.map((standing, index) => {
                const playerName =
                  standing.eventMember.userProfile.name ||
                  standing.eventMember.userProfile.email ||
                  "Unknown Player";

                const isTopThree = standing.position && standing.position <= 3;
                const positionColors = {
                  1: "bg-yellow-100 text-yellow-800",
                  2: "bg-gray-100 text-gray-800",
                  3: "bg-orange-100 text-orange-800",
                };

                return (
                  <tr
                    key={standing.id}
                    className={isTopThree ? positionColors[standing.position as 1 | 2 | 3] : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {standing.position !== null ? (
                          <span className="text-lg font-bold">
                            {standing.position}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {playerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.eventMember.handicap !== null
                        ? standing.eventMember.handicap.toFixed(1)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-blue-600">
                        {standing.totalPoints}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.roundsPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.stats?.avgScore
                        ? standing.stats.avgScore.toFixed(1)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.stats?.bestRound || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {sortedStandings.length > 0 && (
        <div className="text-xs text-gray-500 mt-2">
          <p>
            Total players: {sortedStandings.length} |{" "}
            Total rounds played:{" "}
            {sortedStandings.reduce((sum, s) => sum + s.roundsPlayed, 0)}
          </p>
        </div>
      )}
    </div>
  );
}
