import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, TrendingUp, CheckCircle2, ShieldCheck, Star } from "lucide-react";
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
        subtitle="Track your platform reputation tier, delivery reliability, bid compliance, and fast-track EMD exemptions."
        actions={
          <Link to="/portal" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
            Back to Portal
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Vendor Tier" value="PLATINUM" delta="Top 5%" hint="Auto-EMD waiver active" />
        <Kpi label="Trust Rating" value="4.9 / 5.0" hint="Based on 42 events" />
        <Kpi label="On-Time Delivery" value="98.2%" hint="Weighbridge SLA" />
        <Kpi label="Dispute Ratio" value="0.0%" delta="Zero default" hint="100% resolution" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card title="Platinum Tier Privileges" desc="Automated platform benefits unlocked by your high performance">
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
              <span>Instant EMD Escrow Exemption up to ₹10,00,000</span>
            </li>
            <li className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
              <span>Priority Site Access & High-Speed Gate Passes</span>
            </li>
            <li className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
              <span>Same-Day Settlement & Accelerated RTGS Payouts</span>
            </li>
          </ul>
        </Card>

        <Card title="Category Competency Badges" desc="Verified operating sectors and handling capacity">
          <div className="space-y-2">
            {[
              { cat: "Scrap & Metals", capacity: "12,000 MT / yr", rank: "Tier 1 Verified" },
              { cat: "Machinery & Heavy Plants", capacity: "Multi-Axle Fleet", rank: "Certified Dismantler" },
              { cat: "Logistics & Freight Lanes", capacity: "180 Vehicles", rank: "All-India Permit" },
            ].map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-xs">
                <div>
                  <strong className="text-foreground">{b.cat}</strong>
                  <div className="text-muted-foreground">{b.capacity}</div>
                </div>
                <Pill tone="good">{b.rank}</Pill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
