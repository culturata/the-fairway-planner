import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default async function EventPaymentsPage({
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
      costItems: {
        include: {
          payments: {
            include: {
              userProfile: true,
            },
          },
        },
      },
      eventMembers: {
        include: {
          userProfile: true,
        },
      },
    },
  });

  if (!event) {
    return <div>Event not found</div>;
  }

  // Calculate payment stats
  const totalRevenue = event.costItems.reduce((sum, item) => {
    const paidAmount = item.payments
      .filter((p) => p.status === "PAID")
      .reduce((s, p) => s + p.amountCents, 0);
    return sum + paidAmount;
  }, 0);

  const totalExpected = event.costItems.reduce((sum, item) => {
    if (item.required) {
      return sum + item.amountCents * event.eventMembers.length;
    }
    return sum + item.amountCents * item.payments.length;
  }, 0);

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
          <h1 className="text-3xl font-bold mb-6">{event.name} - Payments</h1>

          {/* Payment Summary */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-sm font-medium text-green-600">Collected</div>
              <div className="text-2xl font-bold text-green-900">
                ${(totalRevenue / 100).toFixed(2)}
              </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-sm font-medium text-blue-600">Expected</div>
              <div className="text-2xl font-bold text-blue-900">
                ${(totalExpected / 100).toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-sm font-medium text-gray-600">Outstanding</div>
              <div className="text-2xl font-bold text-gray-900">
                ${((totalExpected - totalRevenue) / 100).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Cost Items */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Cost Items</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Add Cost Item
              </button>
            </div>

            {event.costItems.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">No cost items yet</p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                  Create First Cost Item
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {event.costItems.map((item) => {
                  const paidCount = item.payments.filter((p) => p.status === "PAID").length;
                  const paidAmount = item.payments
                    .filter((p) => p.status === "PAID")
                    .reduce((s, p) => s + p.amountCents, 0);

                  return (
                    <div key={item.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{item.name}</h3>
                          <p className="text-gray-600">
                            ${(item.amountCents / 100).toFixed(2)}
                            {item.required && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {paidCount} / {item.required ? event.eventMembers.length : item.payments.length} paid
                          </div>
                          <div className="font-semibold text-green-600">
                            ${(paidAmount / 100).toFixed(2)} collected
                          </div>
                        </div>
                      </div>

                      {/* Payment Status by Member */}
                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">Payment Status</h4>
                        <div className="grid gap-2">
                          {event.eventMembers.map((member) => {
                            const payment = item.payments.find(
                              (p) => p.userProfileId === member.userProfile.id
                            );

                            return (
                              <div
                                key={member.id}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded"
                              >
                                <span className="font-medium">
                                  {member.userProfile.name || member.userProfile.email}
                                </span>
                                {payment ? (
                                  <span
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                      payment.status === "PAID"
                                        ? "bg-green-100 text-green-800"
                                        : payment.status === "PENDING"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : payment.status === "FAILED"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {payment.status}
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">
                                    Not Started
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
