"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function TripAdminPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trips/${tripId}`)
      .then((res) => res.json())
      .then((data) => {
        setTrip(data.trip);
        setLoading(false);
      });
  }, [tripId]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!trip) {
    return <div className="p-8">Trip not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          href={`/t/${tripId}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Trip
        </Link>

        <div className="bg-white shadow rounded-lg p-8 mb-6">
          <h1 className="text-2xl font-bold mb-6">Trip Settings</h1>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Handicap Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Handicap Percentage
                  </label>
                  <p className="text-2xl font-bold">{trip.handicapPct}%</p>
                </div>
                {trip.handicapCap && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Handicap Cap
                    </label>
                    <p className="text-2xl font-bold">{trip.handicapCap}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Member Handicaps</h2>
              <div className="space-y-2">
                {trip.members?.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <span>
                      {member.userProfile.name || member.userProfile.email}
                    </span>
                    <span className="font-medium">
                      {member.handicap !== null ? member.handicap : "Not set"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Cost Items</h2>
              {trip.costItems?.length === 0 ? (
                <p className="text-gray-500">No cost items yet</p>
              ) : (
                <div className="space-y-2">
                  {trip.costItems?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {item.required && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <span className="font-medium">
                        ${(item.amountCents / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
