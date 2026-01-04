"use client";

interface CompetitionResult {
  id: string;
  participantId: string;
  participantType: string;
  result: any;
  position: number | null;
  prize?: string | null;
}

interface Competition {
  id: string;
  type: string;
  name: string;
  description?: string | null;
  status: string;
  results: CompetitionResult[];
}

interface CompetitionLeaderboardProps {
  competition: Competition;
  playerNames?: Map<string, string>;
}

export default function CompetitionLeaderboard({
  competition,
  playerNames = new Map(),
}: CompetitionLeaderboardProps) {
  const getPlayerName = (participantId: string): string => {
    return playerNames.get(participantId) || "Unknown Player";
  };

  const renderSkinsLeaderboard = () => {
    const sortedResults = [...competition.results].sort(
      (a, b) => (a.position || 999) - (b.position || 999)
    );

    return (
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
                Skins Won
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Holes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedResults.map((result) => (
              <tr key={result.id} className={result.position === 1 ? "bg-yellow-50" : ""}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {result.position || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getPlayerName(result.participantId)}
                  {result.position === 1 && <span className="ml-2">🏆</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {result.result.skinsWon || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${((result.result.totalValue || 0) / 100).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {result.result.holes?.join(", ") || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderFlightLeaderboard = () => {
    // Group results by flight
    const byFlight = competition.results.reduce((acc, result) => {
      const flightName = result.result.flightName || "Unknown Flight";
      if (!acc[flightName]) {
        acc[flightName] = [];
      }
      acc[flightName].push(result);
      return acc;
    }, {} as Record<string, CompetitionResult[]>);

    return (
      <div className="space-y-6">
        {Object.entries(byFlight).map(([flightName, results]) => {
          const sortedResults = [...results].sort(
            (a, b) => (a.position || 999) - (b.position || 999)
          );

          return (
            <div key={flightName} className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">{flightName}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Pos
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Player
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Gross
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Net
                      </th>
                      {results[0]?.result.stablefordPoints !== undefined && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Points
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedResults.map((result) => (
                      <tr
                        key={result.id}
                        className={result.position === 1 ? "bg-yellow-50" : ""}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.position || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {getPlayerName(result.participantId)}
                          {result.position === 1 && <span className="ml-2">🏆</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {result.result.grossTotal || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {result.result.netTotal || "-"}
                        </td>
                        {result.result.stablefordPoints !== undefined && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {result.result.stablefordPoints}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGenericLeaderboard = () => {
    const sortedResults = [...competition.results].sort(
      (a, b) => (a.position || 999) - (b.position || 999)
    );

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedResults.map((result) => (
              <tr key={result.id} className={result.position === 1 ? "bg-yellow-50" : ""}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {result.position || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getPlayerName(result.participantId)}
                  {result.position === 1 && <span className="ml-2">🏆</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {JSON.stringify(result.result)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{competition.name}</h2>
            {competition.description && (
              <p className="text-gray-600 mt-1">{competition.description}</p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              competition.status === "COMPLETED"
                ? "bg-green-100 text-green-800"
                : competition.status === "ACTIVE"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {competition.status}
          </span>
        </div>
      </div>

      {competition.results.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No results yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Results will appear here once the competition is calculated
          </p>
        </div>
      ) : (
        <>
          {competition.type === "SKINS" && renderSkinsLeaderboard()}
          {competition.type === "FLIGHT" && renderFlightLeaderboard()}
          {!["SKINS", "FLIGHT"].includes(competition.type) &&
            renderGenericLeaderboard()}
        </>
      )}
    </div>
  );
}
