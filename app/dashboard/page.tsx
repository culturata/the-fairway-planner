import { auth } from "@clerk/nextjs/server";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

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

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let events: any[] = [];
  let organization = null;

  if (orgId) {
    // Get or create organization
    organization = await prisma.organization.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: { clerkOrgId: orgId },
      });
    }

    // Get all events for this organization
    events = await prisma.event.findMany({
      where: { organizationId: organization.id },
      include: {
        eventMembers: {
          include: {
            userProfile: true,
          },
        },
        rounds: true,
      },
      orderBy: { startDate: "desc" },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Fairway Planner</h1>
            <div className="flex items-center space-x-4">
              <OrganizationSwitcher />
              <UserButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!orgId ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Welcome to Fairway Planner</h2>
            <p className="text-gray-600 mb-6">
              Select or create an organization to get started planning your golf events.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Events</h2>
              <Link
                href="/trip/create"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Create Event
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">No Events Yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first golf event to get started.
                </p>
                <Link
                  href="/trip/create"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Create Event
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <div key={event.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold">{event.name}</h3>
                      <EventTypeBadge type={event.eventType} />
                    </div>

                    {event.location && (
                      <p className="text-gray-600 text-sm mb-2">📍 {event.location}</p>
                    )}

                    <p className="text-gray-600 text-sm mb-4">
                      {formatDate(event.startDate)} - {formatDate(event.endDate)}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>{event.eventMembers.length} members</span>
                      <span>{event.rounds.length} rounds</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        event.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                        event.status === "DRAFT" ? "bg-gray-100 text-gray-800" :
                        event.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {event.status}
                      </span>

                      <Link
                        href={`/e/${event.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
