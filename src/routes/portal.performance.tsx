import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Card, PageHead, Kpi, Pill } from "@/components/console/shell";

export const Route = createFileRoute("/portal/performance")({
  head: () => ({
    meta: [
      { title: "Vendor Scorecard & Tier — Scrapify Portal" },
      { name: "description", content: "Vendor performance score, trust rating, on-time delivery benchmarks, and Platinum perks." },
    ],
  }),
  component: VendorPerformancePage,
});

function VendorPerformancePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHead
        title="Vendor Performance Scorecard"
        subtitle="Track your platform reputation and delivery metrics when they are available from the account API."
        actions={
          <Link to="/portal" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
            Back to Portal
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Vendor Tier" value="—" hint="Awaiting account data" />
        <Kpi label="Trust Rating" value="—" hint="Awaiting account data" />
        <Kpi label="On-Time Delivery" value="—" hint="Awaiting account data" />
        <Kpi label="Dispute Ratio" value="—" hint="Awaiting account data" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card title="Account benefits" desc="Benefits will appear here after the platform returns verified performance data.">
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
              <span>No verified benefits to display</span>
            </li>
            <li className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
              <span>Priority access is determined per event</span>
            </li>
            <li className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
              <span>Settlement terms are determined per award</span>
            </li>
          </ul>
        </Card>

        <Card title="Category competency" desc="Verified sectors will appear after account data is available.">
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No competency data available.</div>
        </Card>
      </div>
    </div>
  );
}
