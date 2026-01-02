import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">Fairway Planner</h1>
        <p className="text-xl mb-8">
          Plan and manage multi-day golf trips with your group
        </p>
        <div className="space-x-4">
          <a
            href="/sign-in"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </a>
          <a
            href="/sign-up"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
