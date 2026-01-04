import { redirect } from "next/navigation";

export default async function TripRedirectPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
<<<<<<< Updated upstream

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      members: {
        include: {
          userProfile: true,
        },
      },
      itineraryItems: {
        orderBy: { startsAt: "asc" },
      },
      rounds: {
        orderBy: { startsAt: "asc" },
      },
      announcements: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!trip) {
    return <div>Trip not found</div>;
  }

  // Group itinerary by date
  const itineraryByDate = trip.itineraryItems.reduce((acc, item) => {
    const date = formatDate(item.startsAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof trip.itineraryItems>);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </Link>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-8 mb-6">
          <h1 className="text-3xl font-bold mb-4">{trip.name}</h1>
          {trip.location && <p className="text-gray-600 mb-2">📍 {trip.location}</p>}
          <p className="text-gray-600">
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </p>

          <div className="mt-6 flex space-x-4">
            <Link
              href={`/t/${trip.id}/admin`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Trip Settings
            </Link>
            <Link
              href={`/t/${trip.id}/payments`}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Payments
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Itinerary</h2>
              {Object.keys(itineraryByDate).length === 0 ? (
                <p className="text-gray-500">No itinerary items yet</p>
              ) : (
                <div className="space-y-6">
                  {(Object.entries(itineraryByDate) as [string, typeof trip.itineraryItems][]).map(([date, items]) => (
                    <div key={date}>
                      <h3 className="font-semibold text-lg mb-2">{date}</h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="border-l-4 border-blue-500 pl-4 py-2"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">{item.title}</span>
                              <span className="text-sm text-gray-500">
                                {item.type}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(item.startsAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            {item.location && (
                              <div className="text-sm text-gray-600">
                                📍 {item.location}
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-sm text-gray-600 mt-1">
                                {item.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Rounds</h2>
              {trip.rounds.length === 0 ? (
                <p className="text-gray-500">No rounds scheduled yet</p>
              ) : (
                <div className="space-y-4">
                  {trip.rounds.map((round) => (
                    <Link
                      key={round.id}
                      href={`/r/${round.id}`}
                      className="block border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <h3 className="font-semibold">{round.courseName}</h3>
                      {round.teesName && (
                        <p className="text-sm text-gray-600">{round.teesName}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {formatDateTime(round.startsAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Roster</h2>
              <div className="space-y-2">
                {trip.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <div>
                      <div className="font-medium">
                        {member.userProfile.name || member.userProfile.email}
                      </div>
                      <div className="text-sm text-gray-600">
                        {member.rsvpStatus}
                      </div>
                    </div>
                    {member.handicap !== null && (
                      <div className="text-sm text-gray-600">
                        HCP: {member.handicap}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Announcements</h2>
              {trip.announcements.length === 0 ? (
                <p className="text-gray-500">No announcements yet</p>
              ) : (
                <div className="space-y-4">
                  {trip.announcements.map((announcement) => (
                    <div key={announcement.id} className="border-b pb-3">
                      {announcement.title && (
                        <h3 className="font-semibold">{announcement.title}</h3>
                      )}
                      <p className="text-sm text-gray-700">{announcement.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(announcement.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
=======
  redirect(`/e/${tripId}`);
>>>>>>> Stashed changes
}
