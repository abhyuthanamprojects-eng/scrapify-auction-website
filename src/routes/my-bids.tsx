import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Keep the public navigation URL stable while the authenticated buyer
 * dashboard owns the bids view and its API-backed tabs.
 */
export const Route = createFileRoute("/my-bids")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
