import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  X,
  Pause,
  Clock,
  Gavel,
  Scale,
  QrCode,
  FileText,
  AlertTriangle,
  Send,
  Users,
  ShieldCheck,
  Download,
  Building2,
  Calendar,
} from "lucide-react";
import {
  getEvent,
  FORMAT_LABEL,
  approvalTriggers,
  publishChecklist,
  settlement,
  cr,
  inr,
  timeLeft,
  fmtDate,
  type AuctionEvent,
  FALLBACK_OFFERS,
} from "@/lib/enterprise";
import { Card, PageHead, StateBadge, Table, Pill, Kpi } from "@/components/console/shell";
import { useTick } from "@/hooks/use-tick";

const TABS = [
  "overview",
  "lots",
  "participants",
  "rfx",
  "clarifications",
  "inspection",
  "monitor",
  "evaluation",
  "award",
  "audit",
] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/console/events/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Event unavailable" }, { name: "robots", content: "noindex" }] };
    }
    const e = loaderData.event;
    const desc = `${e.direction === "forward" ? "Forward" : "Reverse"} ${FORMAT_LABEL[e.format]} for ${e.category}. Baseline ${cr(e.baseline)}, ${e.participants.length} participants.`;
    return {
      meta: [
        { title: `${e.id} · ${e.title} | Scrapify Auctions Event Workspace` },
        { name: "description", content: desc },
        { property: "og:title", content: `${e.id} — ${e.title}` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: EventWorkspace,
});

function EventWorkspace() {
  const { event } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>(event.state === "live" ? "monitor" : "overview");

  return (
    <>
      <PageHead
        title={event.title}
        subtitle={`${event.id} · ${event.category} · ${event.direction === "forward" ? "Forward (Selling)" : "Reverse (Procuring)"} · ${FORMAT_LABEL[event.format]} · Owner ${event.owner} (${event.businessUnit})`}
        actions={
          <>
            <StateBadge state={event.state} />
            <Link
              to="/console/events"
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Back to events
            </Link>
          </>
        }
      />

      {/* Tabs Bar */}
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-border pb-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider capitalize transition-colors ${
              tab === t ? "bg-[color:var(--navy)] text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.replace("rfx", "RFx Builder")}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview event={event} />}
      {tab === "lots" && <Lots event={event} />}
      {tab === "participants" && <Participants event={event} />}
      {tab === "rfx" && <RFxBuilder event={event} />}
      {tab === "clarifications" && <Clarifications event={event} />}
      {tab === "inspection" && <Inspection event={event} />}
      {tab === "monitor" && <Monitor event={event} />}
      {tab === "evaluation" && <Evaluation event={event} />}
      {tab === "award" && <Award event={event} />}
      {tab === "audit" && <Audit event={event} />}
    </>
  );
}

function Overview({ event }: { event: AuctionEvent }) {
  const isReverse = event.direction === "reverse";
  const checks = publishChecklist(event);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={isReverse ? "Current L1 Best Offer" : "Current Highest H1 Bid"}
          value={inr(event.value)}
          delta={isReverse ? "11.2% Under Budget" : "+10.8% Over Reserve"}
          hint="Live stream updated"
        />
        <Kpi label={isReverse ? "Target / Budget Ceiling" : "Reserve Baseline"} value={cr(event.baseline)} hint="Commercial threshold" />
        <Kpi label="Active Bidders" value={`${event.participants.filter((p) => p.accepted).length} of ${event.participants.length}`} hint="EMD qualified" />
        <Kpi label="Closes In" value={timeLeft(event.endAt)} hint="Anti-sniping (+3m) active" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Executive Commercial Summary" desc="Core contractual parameters and event governance">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Event Direction & Format</span>
                <p className="font-bold text-foreground capitalize">{event.direction} • {FORMAT_LABEL[event.format]}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Security Deposit / EMD</span>
                <p className="font-bold text-foreground">{event.emdRequired ? inr(event.emdAmount) : "Exempted"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Minimum Bid Step (Tick Size)</span>
                <p className="font-bold text-foreground">{inr(event.incrementValue)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Anti-Sniping Extension</span>
                <p className="font-bold text-foreground">{event.autoExtendMins} mins auto-extension on final 3m bids</p>
              </div>
            </div>
          </Card>

          <Card title="Contract Terms & Integrity Undertakings" desc="Standard legal clauses applicable to all participants">
            <ul className="space-y-2 text-xs text-muted-foreground">
              {event.terms.map((t, i) => (
                <li key={i} className="flex items-start gap-2 bg-muted/40 p-2.5 rounded-lg text-foreground">
                  <Check className="h-4 w-4 text-[color:var(--success)] shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div>
          <Card title="Publish Governance Checklist" desc="Mandatory pre-bid validation checks">
            <div className="space-y-2.5">
              {checks.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                  <span className="text-foreground font-medium">{c.label}</span>
                  {c.ok ? (
                    <span className="inline-flex items-center gap-1 text-[color:var(--success)] font-bold">
                      <Check className="h-3.5 w-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="text-destructive font-bold">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Lots({ event }: { event: AuctionEvent }) {
  return (
    <Card title={`Line Items & BOQ (${event.lots.length} Lots)`} desc="Specifications, quantities, and category attributes">
      <Table head={["Lot #", "Description & Specifications", "Quantity", "Start / Ceiling", "Attributes"]}>
        {event.lots.map((l) => (
          <tr key={l.no}>
            <td className="py-3 font-mono font-bold">#{l.no}</td>
            <td className="py-3 max-w-sm">
              <div className="font-semibold text-foreground">{l.description}</div>
            </td>
            <td className="py-3 font-bold">{l.quantity} {l.unit}</td>
            <td className="py-3 font-mono font-bold text-foreground">{inr(l.startPrice)}</td>
            <td className="py-3">
              <div className="flex flex-wrap gap-1">
                {Object.entries(l.attributes).map(([k, v]) => (
                  <span key={k} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {k}: <strong className="text-foreground">{v}</strong>
                  </span>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function Participants({ event }: { event: AuctionEvent }) {
  return (
    <Card title={`Invited Participants (${event.participants.length})`} desc="KYB verification, EMD status and technical compliance score">
      <Table head={["Vendor Name", "Location", "Tech Score", "EMD Status", "Terms Acceptance", "Risk Tier", "Status"]}>
        {event.participants.map((p) => (
          <tr key={p.id}>
            <td className="py-3">
              <div className="font-bold text-foreground">{p.name}</div>
              <div className="text-[11px] font-mono text-muted-foreground">{p.id}</div>
            </td>
            <td className="py-3 text-xs">{p.city}</td>
            <td className="py-3 font-bold text-[color:var(--navy)]">{p.score} / 100</td>
            <td className="py-3">
              <Pill tone={p.emd === "confirmed" ? "good" : p.emd === "pending" ? "warn" : "bad"}>
                {p.emd.toUpperCase()}
              </Pill>
            </td>
            <td className="py-3">
              {p.termsAccepted ? (
                <span className="text-xs text-[color:var(--success)] font-semibold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Accepted v2.1
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </td>
            <td className="py-3">
              <Pill tone={p.risk === "low" ? "good" : p.risk === "medium" ? "warn" : "bad"}>
                {p.risk.toUpperCase()}
              </Pill>
            </td>
            <td className="py-3">
              <span className="text-xs font-semibold text-foreground capitalize">{p.qualification}</span>
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function RFxBuilder({ event }: { event: AuctionEvent }) {
  const questions = event.rfxQuestions ?? [
    { id: "Q1", section: "Statutory & Tax", title: "Active GSTIN and zero-litigation certificate attached?", type: "boolean", mandatory: true, weight: 30 },
    { id: "Q2", section: "Technical Capabilities", title: "Certified technicians & lifting equipment count", type: "number", mandatory: true, weight: 40 },
    { id: "Q3", section: "Safety & ISO", title: "ISO 9001 / ISO 14001 certificates", type: "file", mandatory: true, weight: 30 },
  ];

  return (
    <div className="space-y-6">
      <Card title="Technical RFx Questionnaire & Weighting" desc="Technical pre-qualification questions scored by evaluation committee">
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="flex items-center justify-between rounded-xl border border-border p-4 bg-muted/20">
              <div>
                <span className="rounded bg-[color:var(--navy)]/10 px-2 py-0.5 text-[10px] font-bold text-[color:var(--navy)] mr-2">
                  {q.section}
                </span>
                <span className="font-semibold text-foreground text-sm">{q.title}</span>
                <div className="mt-1 text-xs text-muted-foreground">
                  Type: <strong className="capitalize">{q.type}</strong> • {q.mandatory ? "Mandatory" : "Optional"}
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-[color:var(--navy)]">{q.weight}% Weight</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {event.rfxResponses && (
        <Card title="Committee Technical Scoring Matrix" desc="Evaluator responses and qualification outcomes">
          <Table head={["Participant", "Technical Score", "Outcome", "Evaluator Note"]}>
            {event.rfxResponses.map((res) => (
              <tr key={res.participantId}>
                <td className="py-3 font-bold text-foreground">{res.participantName}</td>
                <td className="py-3 font-mono font-bold text-base text-[color:var(--navy)]">{res.totalScore} / 100</td>
                <td className="py-3">
                  <Pill tone={res.status === "shortlisted" ? "good" : "bad"}>
                    {res.status.toUpperCase()}
                  </Pill>
                </td>
                <td className="py-3 text-xs text-muted-foreground max-w-xs">{res.evaluatorNote}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}

function Clarifications({ event }: { event: AuctionEvent }) {
  const [newQuestion, setNewQuestion] = useState("");
  const clarifications = event.clarifications ?? [];

  return (
    <div className="space-y-6">
      <Card title="Pre-Bid Clarifications & Official Addenda" desc="All price-impacting clarifications are published as public addenda">
        <div className="space-y-4">
          {clarifications.map((c) => (
            <div key={c.id} className="rounded-xl border border-border p-4 bg-muted/20">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[color:var(--navy)]">{c.category} • Asked by {c.askedBy}</span>
                <Pill tone={c.status === "published_addendum" ? "good" : "warn"}>
                  {c.status.replace("_", " ").toUpperCase()}
                </Pill>
              </div>
              <p className="font-semibold text-foreground text-sm">{c.question}</p>
              {c.answer && (
                <div className="mt-2.5 rounded-lg bg-card p-3 border border-border text-xs">
                  <span className="font-bold text-[color:var(--success)]">Official Response ({c.answeredBy}):</span>
                  <p className="mt-1 text-muted-foreground">{c.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Inspection({ event }: { event: AuctionEvent }) {
  const slots = event.inspectionSlots ?? [];

  return (
    <div className="space-y-6">
      <Card title="Physical Site Inspection Schedule & Visitor Pass Logs" desc="Plant yard visit windows and security gate passes">
        {slots.length > 0 ? (
          <div className="space-y-4">
            {slots.map((s) => (
              <div key={s.id} className="rounded-xl border border-border p-4 bg-card">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div>
                    <span className="font-display font-bold text-foreground">{s.facility}</span>
                    <p className="text-xs text-muted-foreground">{s.date} • {s.slot}</p>
                  </div>
                  <span className="rounded bg-muted px-2.5 py-1 text-xs font-bold">
                    {s.bookedCount} / {s.capacity} Slots Booked
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {s.visitors.map((v, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-lg">
                      <div>
                        <strong className="text-foreground">{v.participant}</strong> — Visitor: {v.visitorName} (Vehicle: {v.vehicleNo})
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] bg-background px-2 py-0.5 rounded border">{v.gatePassId}</span>
                        <Pill tone="good">CHECKED IN</Pill>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No physical inspection slots requested for this lot.</p>
        )}
      </Card>
    </div>
  );
}

function Monitor({ event }: { event: AuctionEvent }) {
  useTick(1000);
  const isReverse = event.direction === "reverse";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={isReverse ? "Current L1 Price" : "Current Highest H1 Bid"}
          value={inr(event.value)}
          delta={isReverse ? "-11.2% Savings" : "+10.8% Uplift"}
          hint="Verified bids only"
        />
        <Kpi label="Total Bids Logged" value={String(event.bids.length)} hint="Overtime anti-sniping active" />
        <Kpi label="Active Room Participants" value={String(event.participants.length)} hint="Latency: 18ms" />
        <Kpi label="Time Left" value={timeLeft(event.endAt)} hint="Auto extends +3m on bid" />
      </div>

      {isReverse && event.landedCost && (
        <Card title="Reverse Landed Cost Breakdown (L1 Bidder)" desc="Evaluated landed total including logistics, handling and taxes">
          <div className="grid gap-3 sm:grid-cols-4 text-xs">
            <div className="bg-muted/40 p-3 rounded-lg">
              <span className="text-muted-foreground">Base Unit Price</span>
              <p className="font-bold text-sm text-foreground">{inr(event.landedCost.basePrice)}</p>
            </div>
            <div className="bg-muted/40 p-3 rounded-lg">
              <span className="text-muted-foreground">Freight & Fleet Lane</span>
              <p className="font-bold text-sm text-foreground">₹{event.landedCost.freightPerUnit} / unit</p>
            </div>
            <div className="bg-muted/40 p-3 rounded-lg">
              <span className="text-muted-foreground">Applicable GST (18%)</span>
              <p className="font-bold text-sm text-foreground">{inr(Math.round(event.landedCost.basePrice * 0.18))}</p>
            </div>
            <div className="bg-[color:var(--navy)]/10 p-3 rounded-lg border border-[color:var(--navy)]/20">
              <span className="text-[color:var(--navy)] font-semibold">Total Landed Cost</span>
              <p className="font-bold text-base text-[color:var(--navy)]">{inr(event.landedCost.totalLandedCost)}</p>
            </div>
          </div>
        </Card>
      )}

      <Card title="Live Stream Bidding Activity Log" desc="Masked audit trail of real-time incoming bids">
        <Table head={["Rank", "Masked Participant Alias", "Bid Value (INR)", "Timestamp", "Delta vs Baseline"]}>
          {event.bids.map((b) => (
            <tr key={b.at} className="hover:bg-muted/20">
              <td className="py-3 font-bold font-mono">
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${b.rank === 1 ? "bg-[color:var(--success)] text-white" : "bg-muted"}`}>
                  #{b.rank}
                </span>
              </td>
              <td className="py-3 font-semibold">{b.alias}</td>
              <td className="py-3 font-mono font-bold text-base text-foreground">{inr(b.amount)}</td>
              <td className="py-3 text-xs text-muted-foreground">{fmtDate(b.at)}</td>
              <td className="py-3 text-xs font-semibold text-[color:var(--success)]">
                {isReverse ? `-${inr(event.baseline - b.amount)} below budget` : `+${inr(b.amount - event.baseline)} above reserve`}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

function Evaluation({ event }: { event: AuctionEvent }) {
  const isReverse = event.direction === "reverse";

  return (
    <div className="space-y-6">
      <Card title="Post-Auction Decision Pack" desc="Commercial evaluation ready for multi-tier executive approval">
        <div className="grid gap-4 sm:grid-cols-3 rounded-xl bg-muted/40 p-4 mb-4">
          <div>
            <span className="text-xs text-muted-foreground">Winning Bidder</span>
            <p className="font-bold text-base text-foreground">{event.participants[0]?.name ?? "Meridian Metals"}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Winning Award Value</span>
            <p className="font-bold text-base text-[color:var(--navy)]">{inr(event.value)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Commercial Benefit</span>
            <p className="font-bold text-base text-[color:var(--success)]">
              {isReverse ? `₹3.20 Cr Savings (8.4%)` : `₹9.20 L Realisation Uplift (+10.8%)`}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4 bg-card">
          <h4 className="font-display text-sm font-bold mb-2">Committee Recommendations:</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The event demonstrated healthy competition with {event.participants.length} verified participants and {event.bids.length} bids. 
            Winning offer complies with all technical qualification criteria and statutory undertakings. Immediate award approval recommended.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Award({ event }: { event: AuctionEvent }) {
  const s = settlement(event);
  const fallback = FALLBACK_OFFERS.find((f) => f.eventId === event.id);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Award Contract & Settlement Ledger" desc="Commercial breakdown including GST, TCS and EMD credit">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Winning Contract Value (H1/L1)</span>
              <span className="font-mono font-bold">{inr(s.winningAmount)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="font-mono font-bold">{inr(s.gst)}</span>
            </div>
            {s.tcs > 0 && (
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">TCS (1%)</span>
                <span className="font-mono font-bold">{inr(s.tcs)}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-border font-bold">
              <span>Gross Contract Total</span>
              <span className="font-mono text-base text-[color:var(--navy)]">{inr(s.grandTotal)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border text-[color:var(--success)]">
              <span>Less: EMD Adjusted</span>
              <span className="font-mono font-bold">- {inr(s.emdAdjusted)}</span>
            </div>
            <div className="flex justify-between py-2 text-base font-bold bg-muted/40 p-3 rounded-lg">
              <span>Net Balance Payable</span>
              <span className="font-mono text-[color:var(--auction)]">{inr(s.balancePayable)}</span>
            </div>
          </div>
        </Card>

        {fallback && (
          <Card title="H2 / L2 Fallback Acquisition Matrix" desc="Contingency acquisition plan if winner defaults within 48h">
            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="flex justify-between font-bold">
                  <span>H2 Fallback Bidder: {fallback.h2Vendor}</span>
                  <span className="font-mono">{inr(fallback.h2Amount)}</span>
                </div>
                <p className="text-muted-foreground mt-1">Price Delta vs Winner: ₹{fallback.priceDelta.toLocaleString("en-IN")}</p>
              </div>

              <div className="rounded-lg bg-muted/40 p-3">
                <div className="flex justify-between font-bold">
                  <span>H3 Fallback Bidder: {fallback.h3Vendor}</span>
                  <span className="font-mono">{inr(fallback.h3Amount)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => alert("Fallback workflow is standby and will trigger if H1 fails balance settlement.")}
                  className="w-full rounded-lg bg-muted py-2 font-semibold text-xs text-foreground hover:bg-muted/80"
                >
                  Configure Fallback Policy
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Audit({ event }: { event: AuctionEvent }) {
  return (
    <Card title="Immutable Audit Trail" desc="SOC2 compliant chronological ledger of all platform actions">
      <div className="space-y-3">
        {event.audit.map((a, i) => (
          <div key={i} className="flex items-center justify-between text-xs p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[color:var(--success)]" />
              <div>
                <span className="font-bold text-foreground">{a.action}</span>
                <span className="text-muted-foreground ml-2">by {a.actor}</span>
              </div>
            </div>
            <span className="font-mono text-muted-foreground">{fmtDate(a.at)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
