import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/shell";
import { requireRole } from "@/lib/route-guards";

export const Route = createFileRoute("/console")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const auth = await requireRole(location, ["seller"]);
    const sellerPaths = ["/console/events", "/console/orders", "/console/disputes"];
    const sellerRouteAllowed = location.pathname === "/console"
      || sellerPaths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
    if (!sellerRouteAllowed) {
      throw redirect({ to: "/access-denied", search: { from: location.href } });
    }
    return auth;
  },
  component: () => (
    <ConsoleShell>
      <Outlet />
    </ConsoleShell>
  ),
});
