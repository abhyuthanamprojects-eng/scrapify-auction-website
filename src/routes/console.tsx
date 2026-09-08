import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/shell";
import { requireRole } from "@/lib/route-guards";

export const Route = createFileRoute("/console")({
  ssr: false,
  beforeLoad: ({ location }) => requireRole(location, ["seller"]),
  component: () => (
    <ConsoleShell>
      <Outlet />
    </ConsoleShell>
  ),
});
