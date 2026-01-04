import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

function EventTypeBadge({ type }: { type: string }) {
  const colors = {
    TRIP: "bg-blue-100 text-blue-800",
    OUTING: "bg-green-100 text-green-800",
    LEAGUE: "bg-purple-100 text-purple-800",
    TOURNAMENT: "bg-orange-100 text-orange-800",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type as keyof typeof colors] || colors.TRIP}`}>
      {type}
    </span>
  );
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventMembers: {
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

  if (!event) {
    return <div>Event not found</div>;
  }

  // Group itinerary by date
  const itineraryByDate = event.itineraryItems.reduce((acc, item) => {
    const date = formatDate(item.startsAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof event.itineraryItems>);

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
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
              <EventTypeBadge type={event.eventType} />
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              event.status === "ACTIVE" ? "bg-green-100 text-green-800" :
              event.status === "DRAFT" ? "bg-gray-100 text-gray-800" :
              event.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
              "bg-red-100 text-red-800"
            }`}>
              {event.status}
            </span>
          </div>

          {event.location && <p className="text-gray-600 mb-2">📍 {event.location}</p>}
          <p className="text-gray-600">
            {formatDate(event.startDate)} - {formatDate(event.endDate)}
          </p>

          <div className="mt-6 flex space-x-4">
            <Link
              href={`/e/${event.id}/admin`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Event Settings
            </Link>
            <Link
              href={`/e/${event.id}/payments`}
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
                  {Object.entries(itineraryByDate).map(([date, items]) => (
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
              {event.rounds.length === 0 ? (
                <p className="text-gray-500">No rounds scheduled yet</p>
              ) : (
                <div className="space-y-4">
                  {event.rounds.map((round) => (
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
                {event.eventMembers.map((member) => (
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
              {event.announcements.length === 0 ? (
                <p className="text-gray-500">No announcements yet</p>
              ) : (
                <div className="space-y-4">
                  {event.announcements.map((announcement) => (
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
}
