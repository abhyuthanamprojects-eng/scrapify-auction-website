import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/shell";

export const Route = createFileRoute("/console")({
  component: () => (
    <ConsoleShell>
      <Outlet />
    </ConsoleShell>
  ),
});
