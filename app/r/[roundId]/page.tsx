import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function RoundPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { roundId } = await params;

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      trip: true,
      teeGroups: {
        include: {
          members: {
            include: {
              tripMember: {
                include: {
                  userProfile: true,
                },
              },
            },
          },
        },
      },
      scorecards: {
        include: {
          tripMember: {
            include: {
              userProfile: true,
            },
          },
        },
      },
    },
  });

  if (!round) {
    return <div>Round not found</div>;
  }

  // Calculate leaderboards
  const grossLeaderboard = round.scorecards
    .filter((s) => s.grossTotal !== null)
    .sort((a, b) => (a.grossTotal || 0) - (b.grossTotal || 0));

  const netLeaderboard = round.scorecards
    .filter((s) => s.netTotal !== null)
    .sort((a, b) => (a.netTotal || 0) - (b.netTotal || 0));

  // Find user's scorecard
  const userProfile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });

  const userScorecard = userProfile
    ? round.scorecards.find(
        (s) => s.tripMember.userProfileId === userProfile.id
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/t/${round.tripId}`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Trip
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">{round.courseName}</h1>
          {round.teesName && (
            <p className="text-gray-600 mb-2">{round.teesName}</p>
          )}
          <p className="text-gray-600">{formatDateTime(round.startsAt)}</p>
          {round.notes && <p className="text-gray-600 mt-2">{round.notes}</p>}

          {userScorecard && (
            <div className="mt-4">
              <Link
                href={`/r/${round.id}/score`}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block"
              >
                Enter My Score
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Gross Leaderboard</h2>
            {grossLeaderboard.length === 0 ? (
              <p className="text-gray-500">No scores yet</p>
            ) : (
              <div className="space-y-2">
                {grossLeaderboard.map((scorecard, index) => (
                  <div
                    key={scorecard.id}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <div className="flex items-center">
                      <span className="font-bold mr-4 text-gray-500">
                        {index + 1}
                      </span>
                      <span>
                        {scorecard.tripMember.userProfile.name ||
                          scorecard.tripMember.userProfile.email}
                      </span>
                    </div>
                    <span className="font-bold text-lg">
                      {scorecard.grossTotal}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Net Leaderboard</h2>
            {netLeaderboard.length === 0 ? (
              <p className="text-gray-500">No scores yet</p>
            ) : (
              <div className="space-y-2">
                {netLeaderboard.map((scorecard, index) => (
                  <div
                    key={scorecard.id}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <div className="flex items-center">
                      <span className="font-bold mr-4 text-gray-500">
                        {index + 1}
                      </span>
                      <span>
                        {scorecard.tripMember.userProfile.name ||
                          scorecard.tripMember.userProfile.email}
                      </span>
                    </div>
                    <span className="font-bold text-lg">
                      {scorecard.netTotal}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {round.teeGroups.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Tee Sheet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {round.teeGroups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4">
                  <div className="font-semibold mb-2">
                    {group.label || "Tee Group"}
                  </div>
                  {group.teeTime && (
                    <div className="text-sm text-gray-600 mb-2">
                      {new Date(group.teeTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                  {group.startingHole && (
                    <div className="text-sm text-gray-600 mb-2">
                      Starting Hole: {group.startingHole}
                    </div>
                  )}
                  <div className="space-y-1">
                    {group.members.map((member) => (
                      <div key={member.id} className="text-sm">
                        {member.tripMember.userProfile.name ||
                          member.tripMember.userProfile.email}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
