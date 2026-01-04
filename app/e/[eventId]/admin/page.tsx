import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default async function EventAdminPage({
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
      rounds: {
        orderBy: { startsAt: "asc" },
      },
      itineraryItems: {
        orderBy: { startsAt: "asc" },
      },
      announcements: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/e/${event.id}`} className="text-blue-600 hover:text-blue-800">
              ← Back to Event
            </Link>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-8 mb-6">
          <h1 className="text-3xl font-bold mb-6">{event.name} - Settings</h1>

          <div className="space-y-8">
            {/* Event Details Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Event Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Event Type</label>
                  <p className="mt-1 text-gray-900">{event.eventType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-gray-900">{event.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-gray-900">{event.location || "Not set"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dates</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </section>

            {/* Handicap Settings */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Handicap Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Handicap %</label>
                  <p className="mt-1 text-gray-900">{event.handicapPct}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Handicap Cap</label>
                  <p className="mt-1 text-gray-900">{event.handicapCap !== null ? event.handicapCap : "No cap"}</p>
                </div>
              </div>
            </section>

            {/* Scoring Settings */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Scoring Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scoring Format</label>
                  <p className="mt-1 text-gray-900">{event.scoringFormat}</p>
                </div>
              </div>
            </section>

            {/* Member Management */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Members ({event.eventMembers.length})</h2>
              <div className="space-y-2">
                {event.eventMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {member.userProfile.name || member.userProfile.email}
                      </div>
                      <div className="text-sm text-gray-600">
                        RSVP: {member.rsvpStatus}
                        {member.handicap !== null && ` • Handicap: ${member.handicap}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Danger Zone */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
              <div className="border-2 border-red-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">Delete Event</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete an event, there is no going back. This will delete all rounds, scorecards, and itinerary items.
                </p>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  onClick={() => alert("Delete functionality coming soon")}
                >
                  Delete Event
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
