import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SPEND_TREND, FORMAT_MIX, KPIS, VENDORS, EVENTS, cr, inr, FORMAT_LABEL } from "@/lib/enterprise";
import { Card, Kpi, PageHead, Table, Pill } from "@/components/console/shell";
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Layers } from "lucide-react";

export const Route = createFileRoute("/console/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Savings / Realisation Analytics — Scrapify Auctions" },
      {
        name: "description",
        content: "Board-ready analytics on procurement savings, asset realisation, cycle time, and vendor compliance.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "savings" | "realisation" | "vendors">("overview");

  const maxR = Math.max(...SPEND_TREND.map((d) => d.realisation));
  const maxMix = Math.max(...FORMAT_MIX.map((d) => d.events));

  return (
    <>
      <PageHead
        title="Reports & Commercial Analytics"
        subtitle="Comprehensive procurement savings, asset realisation uplift, and vendor performance intelligence."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => alert("Exporting Scrapify Financial Summary (Excel)...")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export XLSX
            </button>
            <button
              onClick={() => alert("Generating Board-Ready Audit & Decision Pack (PDF)...")}
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              <Download className="h-4 w-4" /> Export Board Pack
            </button>
          </div>
        }
      />

      {/* Report Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: "overview", label: "Executive Overview" },
          { id: "savings", label: "Procurement Savings (Reverse)" },
          { id: "realisation", label: "Asset Realisation (Forward)" },
          { id: "vendors", label: "Vendor Performance & Compliance" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === t.id ? "bg-[color:var(--navy)] text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Total Sourcing Savings YTD" value={cr(KPIS.savingsYtd)} delta="+18.4%" hint="Reverse auctions" />
            <Kpi label="Total Realisation YTD" value={cr(KPIS.realisationYtd)} delta="+22.1%" hint="Forward disposals" />
            <Kpi label="Average Event Cycle Time" value={`${KPIS.cycleTimeDays} Days`} hint="Draft to final award" />
            <Kpi label="Participant Engagement" value={`${Math.round(KPIS.participationRate * 100)}%`} hint="Invited vs active bids" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Monthly Sourcing Trends" desc="Asset Realisation vs Procurement Savings (₹ Cr)" className="lg:col-span-2">
              <div className="flex h-56 items-end gap-3 pt-4">
                {SPEND_TREND.map((d) => (
                  <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-44 w-full items-end justify-center gap-1.5">
                      <div
                        className="w-1/2 rounded-t bg-[color:var(--navy)]"
                        title={`Realisation: ₹${d.realisation} Cr`}
                        style={{ height: `${(d.realisation / maxR) * 100}%` }}
                      />
                      <div
                        className="w-1/2 rounded-t bg-[color:var(--auction)]"
                        title={`Savings: ₹${d.savings} Cr`}
                        style={{ height: `${(d.savings / maxR) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{d.month}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center gap-6 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-[color:var(--navy)]" /> Forward Realisation
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-[color:var(--auction)]" /> Reverse Savings
                </span>
              </div>
            </Card>

            <Card title="Auction Format Distribution" desc="Usage across 100+ sourcing events">
              <ul className="space-y-3.5">
                {FORMAT_MIX.map((f) => (
                  <li key={f.format}>
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{f.format}</span>
                      <span className="font-mono text-foreground">{f.events} Events</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-[color:var(--accent-blue)]"
                        style={{ width: `${(f.events / maxMix) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "savings" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Total Reverse Spend Negotiated" value="₹142.50 Cr" hint="Across 38 reverse events" />
            <Kpi label="Net Savings Under Budget" value="₹41.20 Cr" delta="18.4% Savings" hint="Ceiling vs L1" />
            <Kpi label="Average Bidders Per Reverse Event" value="6.4" hint="Strong competitive pressure" />
          </div>

          <Card title="Reverse Sourcing Savings by Sector" desc="Variance between pre-bid budget and final L1 contract">
            <Table head={["Sector / Category", "Budget Ceiling", "Final L1 Award", "Absolute Savings", "Savings %"]}>
              {[
                { cat: "Logistics & Transport Lanes", budget: 38_00_00_000, award: 32_40_00_000, savings: 5_60_00_000, pct: 14.7 },
                { cat: "Facility Management", budget: 48_00_00_000, award: 41_20_00_000, savings: 6_80_00_000, pct: 14.1 },
                { cat: "Manpower Contracts", budget: 26_00_00_000, award: 23_10_00_000, savings: 2_90_00_000, pct: 11.1 },
                { cat: "IT Hardware & Equipment", budget: 18_50_00_000, award: 15_90_00_000, savings: 2_60_00_000, pct: 14.0 },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="py-3 font-bold text-foreground">{row.cat}</td>
                  <td className="py-3 font-mono">{cr(row.budget)}</td>
                  <td className="py-3 font-mono font-bold text-[color:var(--navy)]">{cr(row.award)}</td>
                  <td className="py-3 font-mono font-bold text-[color:var(--success)]">{cr(row.savings)}</td>
                  <td className="py-3 font-bold text-[color:var(--success)]">+{row.pct}%</td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {activeTab === "realisation" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Total Scrap & Asset Disposals" value="₹128.60 Cr" hint="52 forward auctions" />
            <Kpi label="Uplift Over Reserve Baseline" value="₹24.80 Cr" delta="+22.1% Realisation" hint="Reserve vs H1" />
            <Kpi label="Average H1 vs H2 Spread" value="2.4%" hint="Tight competitive bids" />
          </div>

          <Card title="Forward Auction Realisation by Category" desc="Premium achieved above reserve price">
            <Table head={["Disposal Category", "Reserve Baseline", "Final H1 Realisation", "Uplift Value", "Uplift %"]}>
              {[
                { cat: "Scrap & Heavy Metals", reserve: 42_00_00_000, h1: 51_20_00_000, uplift: 9_20_00_000, pct: 21.9 },
                { cat: "Industrial Machinery & Plants", reserve: 34_00_00_000, h1: 41_80_00_000, uplift: 7_80_00_000, pct: 22.9 },
                { cat: "Commercial Fleet Vehicles", reserve: 16_50_00_000, h1: 19_80_00_000, uplift: 3_30_00_000, pct: 20.0 },
                { cat: "Surplus Inventory & E-waste", reserve: 12_00_00_000, h1: 15_80_00_000, uplift: 3_80_00_000, pct: 31.6 },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="py-3 font-bold text-foreground">{row.cat}</td>
                  <td className="py-3 font-mono">{cr(row.reserve)}</td>
                  <td className="py-3 font-mono font-bold text-[color:var(--navy)]">{cr(row.h1)}</td>
                  <td className="py-3 font-mono font-bold text-[color:var(--success)]">+{cr(row.uplift)}</td>
                  <td className="py-3 font-bold text-[color:var(--success)]">+{row.pct}%</td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {activeTab === "vendors" && (
        <Card title="Vendor Performance & Quality League" desc="Comprehensive supplier scorecard and compliance status">
          <Table head={["Vendor Name", "Operating Sector", "Score", "Events", "Win Rate", "Compliance"]}>
            {[...VENDORS]
              .sort((a, b) => b.score - a.score)
              .map((v) => (
                <tr key={v.id}>
                  <td className="py-3 font-bold text-foreground">{v.name}</td>
                  <td className="py-3 text-xs text-muted-foreground">{v.categories.join(", ")}</td>
                  <td className="py-3 font-mono font-bold text-base text-[color:var(--navy)]">{v.score} / 100</td>
                  <td className="py-3 font-bold">{v.events}</td>
                  <td className="py-3 font-mono font-semibold">{Math.round(v.winRate * 100)}%</td>
                  <td className="py-3">
                    <Pill tone={v.compliance === "valid" ? "good" : v.compliance === "expiring" ? "warn" : "bad"}>
                      {v.compliance.toUpperCase()}
                    </Pill>
                  </td>
                </tr>
              ))}
          </Table>
        </Card>
      )}
    </>
  );
}
