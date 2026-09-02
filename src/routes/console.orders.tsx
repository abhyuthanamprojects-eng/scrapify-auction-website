import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  PackageCheck,
  Truck,
  FileText,
  Scale,
  QrCode,
  CheckCircle2,
  Clock,
  Download,
  Search,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card, PageHead, Pill, Table, Kpi } from "@/components/console/shell";
import { inr, cr, type Order } from "@/lib/enterprise";
import { loadOrders } from "@/lib/enterprise-api";

export const Route = createFileRoute("/console/orders")({
  loader: () => loadOrders(),
  head: () => ({
    meta: [
      { title: "Orders & Contracts — Scrapify Auctions" },
      { name: "description", content: "Manage enterprise Sale Orders, Purchase Orders, Work Orders, gate passes and weighbridge slips." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const orders = Route.useLoaderData();
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesType = filterType === "all" || o.type.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.eventTitle.toLowerCase().includes(search.toLowerCase()) ||
      o.vendorName.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <>
      <PageHead
        title="Orders & Contract Management"
        subtitle="Track post-award Sale Orders, POs, Work Orders, site lifting, weighbridge tickets, and milestone sign-offs."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("Downloading Orders Ledger CSV...")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Export Orders
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active Orders" value={String(orders.length)} hint="Across all categories" />
        <Kpi label="Total Contract Value" value={cr(orders.reduce((s, o) => s + o.totalValue, 0))} delta="+14.2%" hint="YTD execution" />
        <Kpi label="Gate Passes Issued" value="12 Valid" hint="Yard entry clearance" />
        <Kpi label="Weighbridge Matched" value="99.4%" delta="Zero dispute" hint="Gross - Tare verified" />
      </div>

      {/* Filters Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "sale", "purchase", "work order"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider capitalize transition-colors ${
                filterType === t ? "bg-[color:var(--navy)] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t === "all" ? "All Orders" : `${t}s`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground w-64">
          <Search className="h-3.5 w-3.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, event, vendor..."
            className="w-full bg-transparent focus:outline-none text-foreground"
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card title={`Orders & Contracts (${filteredOrders.length})`} desc="Direct execution linkage to auction awards">
        <Table head={["Order #", "Type", "Event & Vendor", "Value + GST", "Milestones", "Status", "Actions"]}>
          {filteredOrders.map((o) => {
            const completedCount = o.milestones.filter((m) => m.status === "completed").length;
            const progressPct = Math.round((completedCount / o.milestones.length) * 100);

            return (
              <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 font-mono font-bold text-foreground">{o.orderNumber}</td>
                <td className="py-3">
                  <span className="rounded bg-[color:var(--navy)]/10 px-2 py-0.5 text-[11px] font-bold text-[color:var(--navy)]">
                    {o.type}
                  </span>
                </td>
                <td className="py-3 max-w-xs">
                  <div className="font-semibold text-foreground truncate">{o.eventTitle}</div>
                  <div className="text-xs text-muted-foreground">{o.vendorName}</div>
                </td>
                <td className="py-3">
                  <div className="font-bold text-foreground">{cr(o.totalValue)}</div>
                  <div className="text-[11px] text-muted-foreground">+ GST {inr(o.gstAmount)}</div>
                </td>
                <td className="py-3 w-40">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{completedCount}/{o.milestones.length} Done</span>
                    <span className="font-bold text-[color:var(--navy)]">{progressPct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-[color:var(--success)]" style={{ width: `${progressPct}%` }} />
                  </div>
                </td>
                <td className="py-3">
                  <Pill tone={o.status === "in_progress" ? "warn" : o.status === "closed" ? "good" : "muted"}>
                    {o.status.replace("_", " ").toUpperCase()}
                  </Pill>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => setSelectedOrder(o)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[color:var(--navy)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      {/* Detailed Order Modal / Slide-Over */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="rounded bg-[color:var(--auction)]/10 px-2 py-0.5 text-xs font-bold text-[color:var(--auction)]">
                  {selectedOrder.type}
                </span>
                <h2 className="mt-1 font-display text-xl font-bold">{selectedOrder.orderNumber}</h2>
                <p className="text-xs text-muted-foreground">{selectedOrder.eventTitle} • Vendor: {selectedOrder.vendorName}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full border border-border p-1.5 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* Commercial Breakdown */}
            <div className="my-4 grid gap-3 sm:grid-cols-3 rounded-xl bg-muted/40 p-4">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Contract Base Value</span>
                <p className="font-display text-base font-bold text-foreground">{inr(selectedOrder.totalValue)}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">GST (18%)</span>
                <p className="font-display text-base font-bold text-foreground">{inr(selectedOrder.gstAmount)}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Delivery / Lifting SLA</span>
                <p className="font-display text-base font-bold text-[color:var(--auction)]">{selectedOrder.deliveryDeadline}</p>
              </div>
            </div>

            {/* Milestone Roadmap Stepper */}
            <div className="my-4">
              <h3 className="font-display text-sm font-bold mb-3 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[color:var(--navy)]" />
                Fulfilment Roadmap & Milestones
              </h3>
              <div className="space-y-2.5">
                {selectedOrder.milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
                      m.status === "completed"
                        ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/5"
                        : m.status === "current"
                          ? "border-[color:var(--auction)]/30 bg-[color:var(--auction)]/5 font-semibold"
                          : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {m.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
                      ) : (
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-muted text-[10px] font-bold">
                          {idx + 1}
                        </span>
                      )}
                      <span>{m.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground">Weight: {m.weightPercent}%</span>
                      <span className="rounded bg-background px-2 py-0.5 font-mono text-[11px]">Due: {m.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weighbridge & Gate Pass Slips */}
            {selectedOrder.weighbridgeSlips && selectedOrder.weighbridgeSlips.length > 0 && (
              <div className="my-4 rounded-xl border border-border bg-card p-4">
                <h3 className="font-display text-sm font-bold mb-2 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-[color:var(--accent-blue)]" />
                  Weighbridge Tare / Gross Slips
                </h3>
                {selectedOrder.weighbridgeSlips.map((wb, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-lg">
                    <div>
                      <span className="font-mono font-bold text-foreground">{wb.slipNo}</span>
                      <span className="text-muted-foreground ml-2">Date: {wb.date}</span>
                    </div>
                    <div className="font-semibold text-foreground">
                      Gross: {wb.grossWeight} • Tare: {wb.tareWeight} • <span className="text-[color:var(--success)]">Net: {wb.netWeight}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <button
                onClick={() => alert(`Downloading signed contract ${selectedOrder.orderNumber}.pdf`)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                Download Contract PDF
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full bg-[color:var(--navy)] px-5 py-2 text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
