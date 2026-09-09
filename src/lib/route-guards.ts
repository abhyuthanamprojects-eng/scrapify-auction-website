import { redirect } from "@tanstack/react-router";
import { api } from "@/lib/api-client";

type AuthenticatedUser = Record<string, any>;

function userFromResponse(response: any): AuthenticatedUser | null {
  return (response?.user ??
    response?.data?.user ??
    response?.data ??
    null) as AuthenticatedUser | null;
}

function rolesFor(user: AuthenticatedUser): string[] {
  const roles = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
  return roles.map((role) => String(role).toLowerCase());
}

export async function requireRole(location: { href: string }, allowed: string[]) {
  if (!api.getToken()) {
    throw redirect({ to: "/auth", search: { mode: "signin", redirect: location.href } });
  }

  try {
    const user = userFromResponse(await api.me());
    if (!user) throw new Error("Missing authenticated user");
    const roles = rolesFor(user);
    if (!allowed.some((role) => roles.includes(role))) {
      throw redirect({ to: "/access-denied", search: { from: location.href } });
    }
    return { user };
  } catch (error) {
    if (error && typeof error === "object" && "routerCode" in error) throw error;
    const status = (error as { status?: number })?.status;
    if (status === 403) {
      throw redirect({ to: "/access-denied", search: { from: location.href } });
    }
    if (status === 401) api.setToken(null);
    throw redirect({ to: "/auth", search: { mode: "signin", redirect: location.href } });
  }
}
