"use client";

import { formatDate } from "@/lib/utils";

interface Season {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
}

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeasonId: string | null;
  onSeasonChange: (seasonId: string) => void;
}

export function SeasonSelector({
  seasons,
  selectedSeasonId,
  onSeasonChange,
}: SeasonSelectorProps) {
  if (seasons.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No seasons created yet
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <label
        htmlFor="season-select"
        className="text-sm font-medium text-gray-700"
      >
        Select Season
      </label>
      <select
        id="season-select"
        value={selectedSeasonId || ""}
        onChange={(e) => onSeasonChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="" disabled>
          Choose a season
        </option>
        {seasons.map((season) => {
          const statusBadge = {
            ACTIVE: "🟢",
            COMPLETED: "🏁",
            CANCELLED: "🚫",
          }[season.status] || "";

          return (
            <option key={season.id} value={season.id}>
              {statusBadge} {season.name} ({formatDate(season.startDate)} -{" "}
              {formatDate(season.endDate)})
            </option>
          );
        })}
      </select>
    </div>
  );
}
