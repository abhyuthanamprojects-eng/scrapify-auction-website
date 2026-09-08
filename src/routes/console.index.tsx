import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, Kpi, PageHead } from "@/components/console/shell";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/console/")({
  head: () => ({ meta: [{ title: "Sourcing Command Centre | Scrapify Auctions" }] }),
  component: ConsoleDashboard,
});

type DashboardState = { liveEvents: number; totalEvents: number; orders: number };

function rows(response: any): any[] {
  return Array.isArray(response?.data) ? response.data : [];
}

function ConsoleDashboard() {
  const [data, setData] = useState<DashboardState | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.getAuctions({ per_page: "100", mine: "true" }), api.getOrders({ per_page: "100" })])
      .then(([auctions, orders]) => {
        if (!active) return;
        const events = rows(auctions);
        const liveEvents = events.filter((event) => ["live", "extended", "paused"].includes(String(event.status))).length;
        setData({ liveEvents, totalEvents: events.length, orders: rows(orders).length });
      })
      .catch(() => {
        if (active) setData({ liveEvents: 0, totalEvents: 0, orders: 0 });
      });
    return () => { active = false; };
  }, []);

  return (
    <>
      <PageHead
        title="Sourcing command centre"
        subtitle="Your organisation’s live sourcing activity, approvals and fulfilment data from the platform API."
        actions={<Link to="/console/events" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">All events</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Live events" value={data ? String(data.liveEvents) : "—"} hint="Current API status" />
        <Kpi label="Events" value={data ? String(data.totalEvents) : "—"} hint="Visible to your account" />
        <Kpi label="Orders & contracts" value={data ? String(data.orders) : "—"} hint="Visible to your account" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Live sourcing activity" desc="Only records returned for your authenticated organisation are shown.">
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {data?.liveEvents ? `${data.liveEvents} live event${data.liveEvents === 1 ? "" : "s"} available.` : "No live event data is available."}
          </div>
        </Card>
        <Card title="Action centre" desc="Approvals, finance, disputes and fulfilment alerts will appear here when returned by the API.">
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No actionable items available.</div>
        </Card>
      </div>
    </>
  );
}
