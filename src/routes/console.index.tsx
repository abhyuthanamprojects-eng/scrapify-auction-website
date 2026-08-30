import { createFileRoute, Link } from "@tanstack/react-router";
import {
  EVENTS,
  KPIS,
  SPEND_TREND,
  FORMAT_MIX,
  cr,
  timeLeft,
  fmtDate,
  FORMAT_LABEL,
} from "@/lib/enterprise";
import { Card, Kpi, PageHead, StateBadge, Table, Pill } from "@/components/console/shell";
import { useTick } from "@/hooks/use-tick";

export const Route = createFileRoute("/console/")({
  head: () => ({
    meta: [
      { title: "Sourcing Command Centre | Scrapify Auctions" },
      {
        name: "description",
        content:
          "Live auctions, approvals, savings and realisation across every sourcing category in one enterprise command centre.",
      },
      { property: "og:title", content: "Sourcing Command Centre | Scrapify Auctions" },
      {
        property: "og:description",
        content: "Monitor live auction events, approvals and settlement performance in real time.",
      },
    ],
  }),
  component: ConsoleDashboard,
});

function ConsoleDashboard() {
  useTick(1000);
  const now = Date.now();
  const live = EVENTS.filter((e) => e.state === "live");
  const maxSav = Math.max(...SPEND_TREND.map((d) => d.realisation));
  const maxMix = Math.max(...FORMAT_MIX.map((d) => d.events));

  return (
    <>
      <PageHead
        title="Sourcing command centre"
        subtitle="One secure platform to source, sell, procure, negotiate, auction, approve, award, fulfil and audit commercial transactions."
        actions={
          <Link
            to="/console/events"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            All events
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Live events" value={String(KPIS.liveEvents)} hint="2 closing within the hour" />
        <Kpi label="Awaiting approval" value={String(KPIS.awaitingApproval)} hint="Oldest pending 2 days" />
        <Kpi label="Savings YTD" value={cr(KPIS.savingsYtd)} delta="+18.4%" hint="vs last year" />
        <Kpi label="Realisation YTD" value={cr(KPIS.realisationYtd)} delta="+22.1%" hint="disposal income" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card
          title="Savings & realisation trend"
          desc="₹ crore per month"
          className="lg:col-span-2"
        >
          <div className="flex h-56 items-end gap-3">
            {SPEND_TREND.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-44 w-full items-end justify-center gap-1">
                  <div
                    className="w-1/2 rounded-t bg-[color:var(--navy)]"
                    style={{ height: `${(d.realisation / maxSav) * 100}%` }}
                    title={`Realisation ₹${d.realisation} Cr`}
                  />
                  <div
                    className="w-1/2 rounded-t bg-[color:var(--auction)]"
                    style={{ height: `${(d.savings / maxSav) * 100}%` }}
                    title={`Savings ₹${d.savings} Cr`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[color:var(--navy)]" /> Realisation
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[color:var(--auction)]" /> Savings
            </span>
          </div>
        </Card>

        <Card title="Event format mix" desc="Last 12 months">
          <ul className="space-y-3">
            {FORMAT_MIX.map((f) => (
              <li key={f.format}>
                <div className="flex justify-between text-sm">
                  <span>{f.format}</span>
                  <span className="font-semibold">{f.events}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-[color:var(--accent-blue)]"
                    style={{ width: `${(f.events / maxMix) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Cycle time</dt>
              <dd className="font-display font-bold">{KPIS.cycleTimeDays} days</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Participation</dt>
              <dd className="font-display font-bold">{Math.round(KPIS.participationRate * 100)}%</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Awarded YTD</dt>
              <dd className="font-display font-bold">{KPIS.awardedYtd}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Active vendors</dt>
              <dd className="font-display font-bold">{KPIS.vendorsActive}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Live now" desc="Auto-extension armed" className="lg:col-span-2">
          <Table head={["Event", "Format", "Best price", "Bidders", "Closes in", ""]}>
            {live.map((e) => (
              <tr key={e.id}>
                <td className="py-3 pr-4">
                  <Link to="/console/events/$id" params={{ id: e.id }} className="font-semibold hover:underline">
                    {e.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {e.id} · {e.category}
                  </div>
                </td>
                <td className="py-3 pr-4 text-xs">
                  {e.direction === "forward" ? "Forward" : "Reverse"} · {FORMAT_LABEL[e.format]}
                </td>
                <td className="py-3 pr-4 font-semibold">{cr(e.value)}</td>
                <td className="py-3 pr-4">{e.participants.filter((x) => x.accepted).length}</td>
                <td className="py-3 pr-4 font-semibold text-[color:var(--auction)]">
                  {timeLeft(e.endAt, now)}
                </td>
                <td className="py-3">
                  <Link
                    to="/console/events/$id"
                    params={{ id: e.id }}
                    search={{ tab: "monitor" }}
                    className="rounded-full bg-[color:var(--navy)] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Monitor
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="Needs your attention">
          <ul className="space-y-4 text-sm">
            {[
              { t: "L2 finance approval — RFP-2026-0077", s: "Above target budget by 3.1%", tone: "warn" as const, to: "/console/approvals" },
              { t: "Overdue payment — INV-9003", s: "₹7.15 Cr, 2 days overdue", tone: "bad" as const, to: "/console/finance" },
              { t: "EMD pending — SLD-2026-0203", s: "2 participants not funded", tone: "warn" as const, to: "/console/finance" },
              { t: "Compliance expiring — TransBharat", s: "Insurance lapses in 9 days", tone: "warn" as const, to: "/console/vendors" },
              { t: "Dispute under review — DSP-51", s: "Auto-extension challenge", tone: "bad" as const, to: "/console/disputes" },
            ].map((x) => (
              <li key={x.t} className="flex items-start justify-between gap-3">
                <div>
                  <Link to={x.to} className="font-semibold hover:underline">
                    {x.t}
                  </Link>
                  <p className="text-xs text-muted-foreground">{x.s}</p>
                </div>
                <Pill tone={x.tone}>Act</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Event pipeline" desc="Draft to award, across all business units" className="mt-4">
        <Table head={["Event", "Owner / BU", "State", "Baseline", "Best", "Schedule"]}>
          {EVENTS.map((e) => (
            <tr key={e.id}>
              <td className="py-3 pr-4">
                <Link to="/console/events/$id" params={{ id: e.id }} className="font-semibold hover:underline">
                  {e.title}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {e.id} · {FORMAT_LABEL[e.format]}
                </div>
              </td>
              <td className="py-3 pr-4 text-xs">
                {e.owner}
                <div className="text-muted-foreground">{e.businessUnit}</div>
              </td>
              <td className="py-3 pr-4">
                <StateBadge state={e.state} />
              </td>
              <td className="py-3 pr-4">{cr(e.baseline)}</td>
              <td className="py-3 pr-4 font-semibold">{e.value ? cr(e.value) : "—"}</td>
              <td className="py-3 text-xs text-muted-foreground">
                {fmtDate(e.startAt)} → {fmtDate(e.endAt)}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
