import { auth } from "@clerk/nextjs/server";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let trip = null;
  if (orgId) {
    trip = await prisma.trip.findUnique({
      where: { clerkOrgId: orgId },
      include: {
        members: {
          include: {
            userProfile: true,
          },
        },
      },
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
              Select or create an organization to get started planning your golf trip.
            </p>
          </div>
        ) : !trip ? (
          <div className="bg-white shadow rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-4">Create Your Trip</h2>
            <p className="text-gray-600 mb-6">
              No trip found for this organization. Create one to get started.
            </p>
            <Link
              href="/trip/create"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Create Trip
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{trip.name}</h2>
                  {trip.location && (
                    <p className="text-gray-600 mb-2">📍 {trip.location}</p>
                  )}
                  <p className="text-gray-600">
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </p>
                </div>
                <Link
                  href={`/t/${trip.id}`}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  View Trip
                </Link>
              </div>

              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-2">Trip Members</h3>
                <div className="text-sm text-gray-600">
                  {trip.members.length} member{trip.members.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
