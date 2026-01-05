import { auth } from "@clerk/nextjs/server";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

function EventTypeBadge({ type }: { type: string }) {
  const styles = {
    TRIP: "badge badge-gold",
    OUTING: "badge badge-green",
    LEAGUE: "badge-forest text-white px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wider",
    TOURNAMENT: "badge-gold text-white px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wider bg-[#b8960a]",
  };

  return (
    <span className={styles[type as keyof typeof styles] || styles.TRIP}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    ACTIVE: "badge badge-green",
    DRAFT: "badge bg-gray-100 text-gray-700 border-gray-300",
    COMPLETED: "badge bg-[#0d3321] text-white border-[#0d3321]",
    CANCELLED: "badge bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span className={styles[status as keyof typeof styles] || styles.DRAFT}>
      {status}
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
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Navigation */}
      <nav className="nav-elegant sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#0d3321]">Fairway Planner</h1>
              <div className="text-xs text-[#6b7280] tracking-wider uppercase mt-1">Golf Trip Management</div>
            </div>
            <div className="flex items-center gap-4">
              <OrganizationSwitcher
                appearance={{
                  elements: {
                    rootBox: "border border-[#1a4d2e]/20 rounded-md",
                  },
                }}
              />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 border-2 border-[#d4af37]",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!orgId ? (
          // No organization selected
          <div className="card-elegant p-12 text-center max-w-2xl mx-auto corner-accent">
            <div className="text-5xl mb-6">⛳</div>
            <h2 className="text-3xl font-serif font-bold text-[#0d3321] mb-4">
              Welcome to Fairway Planner
            </h2>
            <p className="text-[#6b7280] mb-8 leading-relaxed">
              Select or create an organization to begin planning your golf events.
              Your journey to organized, memorable golf trips starts here.
            </p>
            <div className="divider-gold mb-6"></div>
            <p className="text-sm text-[#6b7280] italic">
              Use the organization switcher above to get started
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header with Create Button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-4xl font-serif font-bold text-[#0d3321] mb-2">Your Events</h2>
                <p className="text-[#6b7280]">Manage and view all your golf events</p>
              </div>
              <Link
                href="/trip/create"
                className="btn-primary"
              >
                Create New Event
              </Link>
            </div>

            <div className="divider-gold"></div>

            {events.length === 0 ? (
              // Empty state
              <div className="card-elegant p-16 text-center corner-accent">
                <div className="text-6xl mb-6">🏌️</div>
                <h3 className="text-2xl font-serif font-bold text-[#0d3321] mb-4">
                  No Events Yet
                </h3>
                <p className="text-[#6b7280] mb-8 max-w-md mx-auto leading-relaxed">
                  Create your first golf event to start planning an unforgettable trip with your group.
                </p>
                <Link
                  href="/trip/create"
                  className="btn-gold inline-block"
                >
                  Create Your First Event
                </Link>
              </div>
            ) : (
              // Events grid
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event, index) => (
                  <div
                    key={event.id}
                    className="card-elegant p-6 group animate-fadeInScale"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-serif font-bold text-[#0d3321] leading-tight flex-1 pr-2">
                        {event.name}
                      </h3>
                      <EventTypeBadge type={event.eventType} />
                    </div>

                    {/* Location */}
                    {event.location && (
                      <p className="text-sm text-[#6b7280] mb-3 flex items-center gap-2">
                        <span>📍</span>
                        <span>{event.location}</span>
                      </p>
                    )}

                    {/* Dates */}
                    <div className="mb-4 pb-4 border-b border-[#1a4d2e]/10">
                      <p className="text-sm font-medium text-[#2c2c2c]">
                        {formatDate(event.startDate)} – {formatDate(event.endDate)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="stat-number text-2xl">{event.eventMembers.length}</div>
                        <div className="stat-label text-xs">Members</div>
                      </div>
                      <div>
                        <div className="stat-number text-2xl">{event.rounds.length}</div>
                        <div className="stat-label text-xs">Rounds</div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#1a4d2e]/10">
                      <StatusBadge status={event.status} />

                      <Link
                        href={`/e/${event.id}`}
                        className="text-sm font-semibold text-[#1a4d2e] hover:text-[#0d3321] transition-colors group-hover:translate-x-1 transform duration-200 flex items-center gap-1"
                      >
                        View Details
                        <span>→</span>
                      </Link>
                    </div>

                    {/* Hover effect line */}
                    <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-[#1a4d2e] to-[#d4af37] group-hover:w-full transition-all duration-500"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats Summary (if events exist) */}
            {events.length > 0 && (
              <div className="mt-12 card-elegant p-8">
                <h3 className="text-2xl font-serif font-bold text-[#0d3321] mb-6 text-center">
                  Organization Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="stat-number">{events.length}</div>
                    <div className="stat-label">Total Events</div>
                  </div>
                  <div className="text-center">
                    <div className="stat-number">
                      {events.filter((e) => e.status === "ACTIVE").length}
                    </div>
                    <div className="stat-label">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="stat-number">
                      {events.reduce((sum, e) => sum + e.rounds.length, 0)}
                    </div>
                    <div className="stat-label">Total Rounds</div>
                  </div>
                  <div className="text-center">
                    <div className="stat-number">
                      {events.reduce((sum, e) => sum + e.eventMembers.length, 0)}
                    </div>
                    <div className="stat-label">Total Members</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#1a4d2e]/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-[#6b7280]">
            Fairway Planner © 2026 · Elevating Golf Trip Management
          </p>
        </div>
      </footer>
    </div>
  );
}
