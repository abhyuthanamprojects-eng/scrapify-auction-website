import { createFileRoute, redirect } from "@tanstack/react-router";

/** Support content consolidated onto /help; this path is kept for old links. */
export const Route = createFileRoute("/contact")({
  beforeLoad: () => {
    throw redirect({ to: "/help" });
  },
});
