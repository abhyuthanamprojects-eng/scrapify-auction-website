import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FORMAT_LABEL, cr, fmtDate, timeLeft, type AuctionEvent } from "@/lib/enterprise";
import { loadEvents } from "@/lib/enterprise-api";
import { Card, Kpi, PageHead, Pill, StateBadge } from "@/components/console/shell";
import { useTick } from "@/hooks/use-tick";

export const Route = createFileRoute("/portal/")({
  head: () => ({
    meta: [
      { title: "Bidder Portal — My Invitations & Live Events" },
      {
        name: "description",
        content:
          "Every sourcing event you are invited to: forward and reverse auctions, sealed bids, Dutch and Japanese clocks, RFQ, RFI and RFP, with EMD and terms status.",
      },
      { property: "og:title", content: "Bidder portal — my invitations" },
      {
        property: "og:description",
        content:
          "Accept invitations, clear the EMD and terms gates, then enter the right room for each auction format.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => loadEvents(),
  component: PortalHome,
});

/** The signed-in bidder is represented by the first participant of each event. */
export const myPart = (e: AuctionEvent) => e.participants[0];

const CTA: Record<string, string> = {
  english: "Enter live room",
  sealed: "Submit sealed offer",
  dutch: "Open Dutch clock",
  japanese: "Open Japanese clock",
  bafo: "Submit best & final",
  rfq: "Fill quote sheet",
  rfi: "Answer questionnaire",
  rfp: "Submit envelopes",
  hybrid: "Open event room",
  negotiated: "Open negotiation",
};

function PortalHome() {
  useTick(1000);
  const [tab, setTab] = useState<"all" | "action" | "live" | "closed">("all");

  const events = Route.useLoaderData();
  const mine = events.filter((e) => e.state !== "draft" && myPart(e));
  const rows = mine.filter((e) => {
    if (tab === "live") return e.state === "live" || e.state === "paused";
    if (tab === "closed")
      return ["closed", "evaluation", "approval", "awarded", "cancelled"].includes(e.state);
    if (tab === "action") {
      const p = myPart(e);
      return !p.termsAccepted || (e.emdRequired && p.emd !== "confirmed") || !p.accepted;
    }
    return true;
  });

  const emdHeld = mine
    .filter((e) => e.emdRequired && myPart(e).emd === "confirmed")
    .reduce((s, e) => s + e.emdAmount, 0);

  return (
    <>
      <PageHead
        title="My invitations"
        subtitle="Everything you have been invited to, with the gates you still need to clear before you can bid."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Open invitations" value={String(mine.length)} hint="Across all formats" />
        <Kpi
          label="Live right now"
          value={String(mine.filter((e) => e.state === "live").length)}
          hint="Rooms you can enter"
        />
        <Kpi label="EMD / security held" value={cr(emdHeld)} hint="Released after award decision" />
        <Kpi
          label="Awaiting outcome"
          value={String(
            mine.filter((e) => ["closed", "evaluation", "approval"].includes(e.state)).length,
          )}
          hint="Evaluation in progress"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(["all", "action", "live", "closed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
              tab === t
                ? "bg-[color:var(--navy)] text-white"
                : "border border-border hover:bg-muted"
            }`}
          >
            {t === "action" ? "Needs action" : t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {rows.map((e) => {
          const p = myPart(e);
          const myBids = e.bids.filter((b) => b.participantId === p.id);
          const best = myBids.sort((a, b) => a.rank - b.rank)[0];
          const gates = [
            { label: "Invitation accepted", ok: p.accepted },
            { label: "Terms accepted", ok: p.termsAccepted },
            {
              label: e.emdRequired ? `EMD ${cr(e.emdAmount)}` : "No EMD required",
              ok: !e.emdRequired || p.emd === "confirmed",
            },
            { label: `Eligibility: ${p.qualification}`, ok: p.qualification !== "blocked" },
          ];
          const ready = gates.every((g) => g.ok);

          return (
            <Card
              key={e.id}
              title={e.title}
              desc={`${e.id} · ${e.category} · ${e.direction === "forward" ? "Forward (you buy)" : "Reverse (you supply)"} · ${FORMAT_LABEL[e.format]}`}
              actions={
                <div className="flex items-center gap-2">
                  <StateBadge state={e.state} />
                  <Link
                    to="/portal/events/$id"
                    params={{ id: e.id }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      ready
                        ? "bg-[color:var(--auction)] text-white hover:brightness-110"
                        : "border border-border hover:bg-muted"
                    }`}
                  >
                    {ready ? (CTA[e.format] ?? "Open event") : "Clear gates"}
                  </Link>
                </div>
              }
            >
              <div className="grid gap-4 sm:grid-cols-4">
                <Detail
                  label={e.direction === "forward" ? "Current best bid" : "Current best offer"}
                  value={e.value ? cr(e.value) : "Sealed / not opened"}
                />
                <Detail
                  label="My last submission"
                  value={best ? `${cr(best.amount)} · rank ${best.rank}` : "None yet"}
                />
                <Detail label="Closes" value={`${fmtDate(e.endAt)} · ${timeLeft(e.endAt)}`} />
                <Detail
                  label="Lots / line items"
                  value={`${e.lots.length} · ${e.rankVisibility.replace("_", " ")}`}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {gates.map((g) => (
                  <Pill key={g.label} tone={g.ok ? "good" : "warn"}>
                    {g.ok ? "✓ " : "• "}
                    {g.label}
                  </Pill>
                ))}
              </div>
            </Card>
          );
        })}
        {rows.length === 0 && (
          <Card>
            <p className="text-sm text-muted-foreground">Nothing in this view right now.</p>
          </Card>
        )}
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
