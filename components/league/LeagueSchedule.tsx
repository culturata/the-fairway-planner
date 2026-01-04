"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

interface Round {
  id: string;
  courseName: string;
  teesName: string | null;
  startsAt: Date | string;
  scoringFormat: string | null;
}

interface LeagueScheduleProps {
  rounds: Round[];
  eventId: string;
}

export function LeagueSchedule({ rounds, eventId }: LeagueScheduleProps) {
  const now = new Date();
  const upcomingRounds = rounds.filter(
    (r) => new Date(r.startsAt) > now
  );
  const pastRounds = rounds.filter(
    (r) => new Date(r.startsAt) <= now
  );

  return (
    <div className="space-y-6">
      {/* Upcoming Rounds */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Upcoming Rounds ({upcomingRounds.length})
        </h3>
        {upcomingRounds.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming rounds scheduled</p>
        ) : (
          <div className="space-y-2">
            {upcomingRounds.map((round) => (
              <RoundCard key={round.id} round={round} isPast={false} />
            ))}
          </div>
        )}
      </div>

      {/* Past Rounds */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Past Rounds ({pastRounds.length})
        </h3>
        {pastRounds.length === 0 ? (
          <p className="text-sm text-gray-500">No past rounds yet</p>
        ) : (
          <div className="space-y-2">
            {pastRounds.map((round) => (
              <RoundCard key={round.id} round={round} isPast={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RoundCard({ round, isPast }: { round: Round; isPast: boolean }) {
  return (
    <Link
      href={`/r/${round.id}`}
      className={`block p-4 border rounded-lg hover:shadow-md transition-shadow ${
        isPast ? "bg-gray-50 border-gray-200" : "bg-white border-blue-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{round.courseName}</h4>
          {round.teesName && (
            <p className="text-sm text-gray-600">{round.teesName} Tees</p>
          )}
          <p className="text-sm text-gray-500">
            {formatDateTime(round.startsAt)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {round.scoringFormat && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {round.scoringFormat.replace(/_/g, " ")}
            </span>
          )}
          {isPast ? (
            <span className="text-sm text-gray-500">Completed</span>
          ) : (
            <span className="text-sm text-blue-600 font-medium">Upcoming</span>
          )}
        </div>
      </div>
    </Link>
  );
}
