import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PackageCheck, Truck, Download, QrCode, CheckCircle2, Clock } from "lucide-react";
import { Card, PageHead, Pill, Table, Kpi } from "@/components/console/shell";
import { cr } from "@/lib/enterprise";
import { loadOrders } from "@/lib/enterprise-api";

export const Route = createFileRoute("/portal/orders")({
  head: () => ({
    meta: [
      { title: "My Fulfilment Orders & Contracts — Scrapify Vendor Portal" },
      {
        name: "description",
        content: "Vendor order tracking, gate passes, weighbridge slips, and milestone completion.",
      },
    ],
  }),
  loader: () => loadOrders(),
  component: VendorOrdersPage,
});

function VendorOrdersPage() {
  const vendorOrders = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title="My Orders & Fulfilment Deliveries"
        subtitle="Manage active purchase orders, site pickup tokens, weighbridge tare slips, and payment milestones."
        actions={
          <Link
            to="/portal"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Back to Portal
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Kpi
          label="Active Fulfilment Orders"
          value={String(vendorOrders.length)}
          hint="Under active delivery"
        />
        <Kpi
          label="Total Contracted Value"
          value={cr(vendorOrders.reduce((s, o) => s + o.totalValue, 0))}
          hint="Signed awards"
        />
        <Kpi label="Gate Passes Ready" value="2 Valid" delta="QR Ready" hint="Plot 48 Plant Yard" />
      </div>

      <Card
        title="Active Contracts & Deliveries"
        desc="Real-time milestone progress and gate pass tokens"
      >
        <Table
          head={[
            "Order #",
            "Type",
            "Event Title",
            "Value",
            "Milestone Progress",
            "Status",
            "Actions",
          ]}
        >
          {vendorOrders.map((o) => {
            const done = o.milestones.filter((m) => m.status === "completed").length;
            const pct = Math.round((done / o.milestones.length) * 100);

            return (
              <tr key={o.id}>
                <td className="py-3 font-mono font-bold text-foreground">{o.orderNumber}</td>
                <td className="py-3">
                  <span className="rounded bg-[color:var(--navy)]/10 px-2 py-0.5 text-[11px] font-bold text-[color:var(--navy)]">
                    {o.type}
                  </span>
                </td>
                <td className="py-3 font-semibold text-foreground max-w-xs truncate">
                  {o.eventTitle}
                </td>
                <td className="py-3 font-bold font-mono">{inr(o.totalValue)}</td>
                <td className="py-3 w-36">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {done}/{o.milestones.length}
                    </span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-[color:var(--success)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </td>
                <td className="py-3">
                  <Pill tone={o.status === "in_progress" ? "warn" : "good"}>
                    {o.status.replace("_", " ").toUpperCase()}
                  </Pill>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => alert(`Downloading QR Gate Pass for ${o.orderNumber}`)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[color:var(--navy)] px-3 py-1 text-xs font-bold text-white hover:brightness-110"
                  >
                    <QrCode className="h-3.5 w-3.5" /> Gate Pass
                  </button>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
