import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, Kpi, PageHead } from "@/components/console/shell";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/console/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics — Scrapify Auctions" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const [report, setReport] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let active = true;
    api.getDashboardReports()
      .then((response: any) => { if (active) setReport(response?.data ?? response ?? {}); })
      .catch(() => { if (active) setReport({}); });
    return () => { active = false; };
  }, []);

  const value = (keys: string[]) => {
    const found = keys.find((key) => report?.[key] !== undefined && report?.[key] !== null);
    return found ? String(report?.[found]) : "—";
  };

  return (
    <>
      <PageHead title="Reports & commercial analytics" subtitle="Metrics are shown only when returned by the authenticated reporting API." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Sourcing savings" value={value(["savings_ytd", "savingsYtd"])} hint="API report" />
        <Kpi label="Realisation" value={value(["realisation_ytd", "realisationYtd"])} hint="API report" />
        <Kpi label="Average cycle time" value={value(["cycle_time_days", "cycleTimeDays"])} hint="API report" />
        <Kpi label="Participation" value={value(["participation_rate", "participationRate"])} hint="API report" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Savings and realisation" desc="No chart is rendered without reporting API data.">
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{report && Object.keys(report).length ? "Report data is available through the API." : "No report data is available."}</div>
        </Card>
        <Card title="Vendor performance" desc="Vendor metrics require an authenticated, organisation-scoped report response.">
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No vendor analytics are available.</div>
        </Card>
      </div>
    </>
  );
}
