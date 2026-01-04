import { redirect } from "next/navigation";

export default async function TripPaymentsRedirectPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  redirect(`/e/${tripId}/payments`);
}
