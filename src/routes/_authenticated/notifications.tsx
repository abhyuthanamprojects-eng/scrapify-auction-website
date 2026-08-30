import { createFileRoute } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useFlow } from "@/hooks/use-flow";
import { markAllRead, mutateFlow } from "@/lib/customer-flow";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notification centre — Scrapify Auction" },
      {
        name: "description",
        content:
          "Registration decisions, auction alerts, outbid and extension notices, results and payment reminders.",
      },
      { property: "og:title", content: "Notification centre — Scrapify Auction" },
      {
        property: "og:description",
        content: "Email, SMS, in-app and push preferences per event.",
      },
    ],
  }),
  component: NotificationsPage,
});

const EVENTS = [
  "Registration decision",
  "Auction published in my categories",
  "Auction starting in 1 hour",
  "Outbid",
  "Auction extended",
  "Auction closed",
  "Won / Lost result",
  "Payment due",
  "EMD refunded",
];

function NotificationsPage() {
  const flow = useFlow();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              Notifications
            </h1>
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-[color:var(--auction)]"
            >
              <Check className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>

          <div className="mt-6 card-soft overflow-hidden">
            {flow.notices.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                <Bell className="mx-auto h-6 w-6" />
                <p className="mt-2">No notifications yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {flow.notices.map((n) => (
                  <li
                    key={n.id}
                    className={`px-5 py-4 ${n.read ? "" : "bg-[color:var(--auction)]/5"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">{n.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.at).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside>
          <div className="card-soft p-6">
            <h2 className="font-display text-lg font-bold">Channels</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Same template set the auctioneer publishes on.
            </p>
            <div className="mt-4 space-y-3">
              {(["email", "sms", "inApp", "push"] as const).map((k) => (
                <label key={k} className="flex items-center justify-between text-sm">
                  <span className="capitalize">
                    {k === "inApp" ? "In-app" : k.toUpperCase()}
                  </span>
                  <input
                    type="checkbox"
                    checked={flow.prefs[k]}
                    onChange={(e) =>
                      mutateFlow((s) => ({
                        ...s,
                        prefs: { ...s.prefs, [k]: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 accent-[color:var(--auction)]"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 card-soft p-6">
            <h2 className="font-display text-lg font-bold">Events</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {EVENTS.map((e) => (
                <li key={e} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[color:var(--auction)]" /> {e}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
