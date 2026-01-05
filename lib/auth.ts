import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Require that a user is authenticated and return their userId
 * Returns a NextResponse with 401 error if not authenticated
 */
export async function requireUserId() {
  const { userId } = await auth();

  if (!userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      userId: null,
    };
  }

  return { userId, error: null };
}

/**
 * Require that a user is authenticated and has an organization
 * Returns a NextResponse with 401 error if not authenticated or no org
 */
export async function requireOrgId() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized or no organization selected" },
        { status: 401 }
      ),
      userId: null,
      orgId: null,
    };
  }

  return { userId, orgId, error: null };
}
