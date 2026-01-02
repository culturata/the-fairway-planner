import { auth } from "@clerk/nextjs/server";

export async function isOrganizer(): Promise<boolean> {
  const { orgRole } = await auth();
  return orgRole === "org:admin" || orgRole === "org:owner";
}

export async function requireOrganizer() {
  const organizer = await isOrganizer();
  if (!organizer) {
    throw new Error("Unauthorized: Organizer role required");
  }
}

export async function getOrgId(): Promise<string | null> {
  const { orgId } = await auth();
  return orgId;
}

export async function requireOrgId(): Promise<string> {
  const orgId = await getOrgId();
  if (!orgId) {
    throw new Error("Organization context required");
  }
  return orgId;
}

export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
}
