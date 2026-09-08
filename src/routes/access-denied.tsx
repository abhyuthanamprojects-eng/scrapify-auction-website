import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/access-denied")({
  component: AccessDeniedPage,
});

function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <section className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-10 w-10 text-[color:var(--auction)]" />
        <h1 className="mt-4 font-display text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have permission to open this workspace.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-[color:var(--navy)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Return to marketplace
        </Link>
      </section>
    </main>
  );
}
