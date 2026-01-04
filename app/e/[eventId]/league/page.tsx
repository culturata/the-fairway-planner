"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LeagueStandingsTable } from "@/components/league/LeagueStandingsTable";
import { SeasonSelector } from "@/components/league/SeasonSelector";
import { LeagueSchedule } from "@/components/league/LeagueSchedule";

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  standings: any[];
}

interface Round {
  id: string;
  courseName: string;
  teesName: string | null;
  startsAt: string;
  scoringFormat: string | null;
}

export default function LeaguePage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch seasons
  useEffect(() => {
    async function fetchSeasons() {
      try {
        const response = await fetch(`/api/events/${eventId}/seasons`);
        if (!response.ok) throw new Error("Failed to fetch seasons");
        const data = await response.json();
        setSeasons(data.seasons);

        // Auto-select first active season
        const activeSeason = data.seasons.find((s: Season) => s.status === "ACTIVE");
        if (activeSeason) {
          setSelectedSeasonId(activeSeason.id);
        } else if (data.seasons.length > 0) {
          setSelectedSeasonId(data.seasons[0].id);
        }
      } catch (err) {
        setError("Failed to load seasons");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSeasons();
  }, [eventId]);

  // Fetch standings when season changes
  useEffect(() => {
    if (!selectedSeasonId) {
      setStandings([]);
      return;
    }

    async function fetchStandings() {
      try {
        const response = await fetch(`/api/seasons/${selectedSeasonId}/standings`);
        if (!response.ok) throw new Error("Failed to fetch standings");
        const data = await response.json();
        setStandings(data.standings);
      } catch (err) {
        setError("Failed to load standings");
        console.error(err);
      }
    }

    fetchStandings();
  }, [selectedSeasonId]);

  // Fetch rounds for the event
  useEffect(() => {
    async function fetchRounds() {
      try {
        const response = await fetch(`/api/events/${eventId}/rounds`);
        if (!response.ok) throw new Error("Failed to fetch rounds");
        const data = await response.json();
        setRounds(data.rounds || []);
      } catch (err) {
        console.error("Failed to load rounds:", err);
      }
    }

    fetchRounds();
  }, [eventId]);

  // Recalculate standings
  async function handleRecalculate() {
    if (!selectedSeasonId) return;

    setIsRecalculating(true);
    try {
      const response = await fetch(`/api/seasons/${selectedSeasonId}/recalculate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to recalculate");
      const data = await response.json();
      setStandings(data.standings);
    } catch (err) {
      setError("Failed to recalculate standings");
      console.error(err);
    } finally {
      setIsRecalculating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading league data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">League Standings</h1>
        <p className="text-gray-600 mt-2">
          Track performance across the season
        </p>
      </div>

      {seasons.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          <p className="font-medium">No seasons created yet</p>
          <p className="text-sm mt-1">
            Create a season to start tracking league standings.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Season Selector */}
          <div className="max-w-md">
            <SeasonSelector
              seasons={seasons}
              selectedSeasonId={selectedSeasonId}
              onSeasonChange={setSelectedSeasonId}
            />
          </div>

          {/* Standings Table */}
          {selectedSeason && (
            <LeagueStandingsTable
              standings={standings}
              seasonName={selectedSeason.name}
              seasonStartDate={new Date(selectedSeason.startDate)}
              seasonEndDate={new Date(selectedSeason.endDate)}
              onRecalculate={handleRecalculate}
              isRecalculating={isRecalculating}
            />
          )}

          {/* Schedule */}
          {selectedSeason && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Round Schedule</h2>
              <LeagueSchedule rounds={rounds} eventId={eventId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
