import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FORMAT_LABEL,
  cr,
  fmtDate,
  getEvent,
  inr,
  settlement,
  timeLeft,
  type AuctionEvent,
  type LineItem,
} from "@/lib/enterprise";
import { Card, PageHead, Pill, StateBadge, Table } from "@/components/console/shell";
import { useTick } from "@/hooks/use-tick";

export const Route = createFileRoute("/portal/events/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    const e = loaderData?.event;
    const title = e ? `${e.title} — Bidder Room` : "Bidder Room";
    const desc = e
      ? `Participate in ${e.id}: ${FORMAT_LABEL[e.format]} ${e.direction} event with terms, EMD, bid rules and full submission history.`
      : "Participate in a sourcing event.";
    return {
      meta: [
        { title: title.slice(0, 60) },
        { name: "description", content: desc.slice(0, 158) },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <Card title="This event could not be loaded">
      <p className="text-sm text-muted-foreground">
        Please go back to your invitations and try again.
      </p>
      <Link to="/portal" className="mt-4 inline-flex rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white">
        Back to invitations
      </Link>
    </Card>
  ),
  notFoundComponent: () => (
    <Card title="Event not found">
      <p className="text-sm text-muted-foreground">This event is no longer available to you.</p>
      <Link to="/portal" className="mt-4 inline-flex rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white">
        Back to invitations
      </Link>
    </Card>
  ),
  component: BidderRoom,
});

type Submission = { at: number; label: string; amount?: number };

function BidderRoom() {
  const { event } = Route.useLoaderData();
  useTick(1000);

  const me = event.participants[0];
  const [accepted, setAccepted] = useState(me?.accepted ?? false);
  const [terms, setTerms] = useState(me?.termsAccepted ?? false);
  const [emd, setEmd] = useState(!event.emdRequired || me?.emd === "confirmed");
  const [log, setLog] = useState<Submission[]>(
    event.bids
      .filter((b) => b.participantId === me?.id)
      .map((b) => ({ at: b.at, label: "Bid submitted", amount: b.amount })),
  );
  const [tab, setTab] = useState<"bid" | "lots" | "terms" | "negotiation" | "activity">("bid");

  const push = (s: Submission) => setLog((l) => [s, ...l]);
  const gateOk = accepted && terms && emd && me?.qualification !== "blocked";
  const closed = event.endAt <= Date.now() || !["live", "paused", "published", "invited"].includes(event.state);

  const myBest = log.find((l) => typeof l.amount === "number");
  const rank = useMemo(() => {
    if (!myBest?.amount) return null;
    const all = [...event.bids.map((b) => b.amount), myBest.amount];
    all.sort((a, b) => (event.direction === "forward" ? b - a : a - b));
    return all.indexOf(myBest.amount) + 1;
  }, [myBest, event]);

  return (
    <>
      <PageHead
        title={event.title}
        subtitle={`${event.id} · ${event.category} · ${FORMAT_LABEL[event.format]} · ${
          event.direction === "forward" ? "Forward — you are buying" : "Reverse — you are supplying"
        }`}
        actions={
          <div className="flex items-center gap-2">
            <StateBadge state={event.state} />
            <Link to="/portal" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
              All invitations
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Time remaining" value={timeLeft(event.endAt)} hint={`Closes ${fmtDate(event.endAt)}`} />
        <Stat
          label={event.direction === "forward" ? "Best bid in room" : "Best offer in room"}
          value={event.rankVisibility === "blind" ? "Sealed" : event.value ? cr(event.value) : "No bids yet"}
          hint={event.rankVisibility.replace("_", " ")}
        />
        <Stat label="My last submission" value={myBest?.amount ? cr(myBest.amount) : "None"} hint={rank ? `Indicative rank ${rank}` : "Not ranked yet"} />
        <Stat
          label={event.direction === "forward" ? "Reserve basis" : "Target budget"}
          value={cr(event.baseline)}
          hint={event.autoExtendMins ? `Auto-extend ${event.autoExtendMins} min` : "No auto-extension"}
        />
      </div>

      {!gateOk && (
        <div className="mt-5">
          <Card title="Before you can submit" desc="All three gates are enforced on every format.">
            <div className="space-y-3">
              <Gate
                ok={accepted}
                label="Accept the invitation"
                action="Accept invitation"
                onDo={() => {
                  setAccepted(true);
                  push({ at: Date.now(), label: "Invitation accepted" });
                }}
              />
              <Gate
                ok={terms}
                label="Accept terms & conditions"
                action="Read & accept terms"
                onDo={() => {
                  setTerms(true);
                  push({ at: Date.now(), label: "Terms accepted" });
                }}
              />
              <Gate
                ok={emd}
                label={
                  event.emdRequired
                    ? `Pay EMD / security of ${cr(event.emdAmount)}`
                    : "No EMD required for this event"
                }
                action="Pay EMD"
                onDo={() => {
                  setEmd(true);
                  push({ at: Date.now(), label: `EMD ${cr(event.emdAmount)} confirmed` });
                }}
              />
              {me?.qualification === "blocked" && (
                <p className="text-sm text-destructive">
                  Your category eligibility is on hold. Contact the event owner before bidding.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {(["bid", "lots", "terms", "negotiation", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
              tab === t ? "bg-[color:var(--navy)] text-white" : "border border-border hover:bg-muted"
            }`}
          >
            {t === "bid" ? "Submit" : t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === "bid" && (
          <FormatPanel event={event} disabled={!gateOk || closed} onSubmit={push} myBest={myBest?.amount} />
        )}

        {tab === "lots" && (
          <Card title="Lots & line items" desc="Specification, quantity and attributes as published.">
            <Table head={["#", "Description", "Qty", "Unit", "Basis price", "Attributes"]}>
              {event.lots.map((l) => (
                <tr key={l.no}>
                  <td className="py-2.5 pr-4">{l.no}</td>
                  <td className="py-2.5 pr-4 font-medium">{l.description}</td>
                  <td className="py-2.5 pr-4">{l.quantity}</td>
                  <td className="py-2.5 pr-4">{l.unit}</td>
                  <td className="py-2.5 pr-4">{inr(l.startPrice)}</td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                    {Object.entries(l.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        )}

        {tab === "terms" && (
          <>
            <Card title="Terms & conditions" desc="Acceptance is recorded against your submission.">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {event.terms.length ? (
                  event.terms.map((t) => (
                    <li key={t} className="flex gap-2">
                      <span className="text-[color:var(--auction)]">•</span>
                      {t}
                    </li>
                  ))
                ) : (
                  <li>No special terms published for this event.</li>
                )}
              </ul>
            </Card>
            <Card title="Money & settlement basis" desc="Indicative on your last submission.">
              {(() => {
                const s = settlement(myBest?.amount ?? event.baseline, event.emdRequired ? event.emdAmount : 0);
                return (
                  <div className="grid gap-4 sm:grid-cols-5">
                    <Stat label="Award value" value={cr(s.value)} />
                    <Stat label="GST 18%" value={cr(s.gst)} />
                    <Stat label="TCS 1%" value={cr(s.tcs)} />
                    <Stat label="EMD adjusted" value={cr(s.emd)} />
                    <Stat label="Balance payable" value={cr(s.balance)} />
                  </div>
                );
              })()}
            </Card>
          </>
        )}

        {tab === "negotiation" && <Negotiation event={event} onSubmit={push} disabled={!gateOk} />}

        {tab === "activity" && (
          <Card title="My activity trail" desc="Every action you take on this event is timestamped.">
            {log.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
            ) : (
              <ol className="space-y-3">
                {log.map((l, i) => (
                  <li key={`${l.at}-${i}`} className="flex flex-wrap items-baseline gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">{fmtDate(l.at)}</span>
                    <span className="font-medium">{l.label}</span>
                    {l.amount != null && <Pill tone="good">{cr(l.amount)}</Pill>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        )}
      </div>
    </>
  );
}

function FormatPanel({
  event,
  disabled,
  onSubmit,
  myBest,
}: {
  event: AuctionEvent;
  disabled: boolean;
  onSubmit: (s: Submission) => void;
  myBest?: number;
}) {
  switch (event.format) {
    case "sealed":
      return <SealedPanel event={event} disabled={disabled} onSubmit={onSubmit} />;
    case "dutch":
      return <DutchPanel event={event} disabled={disabled} onSubmit={onSubmit} />;
    case "japanese":
      return <JapanesePanel event={event} disabled={disabled} onSubmit={onSubmit} />;
    case "rfq":
      return <QuoteSheet event={event} disabled={disabled} onSubmit={onSubmit} />;
    case "rfi":
      return <RfiPanel event={event} disabled={disabled} onSubmit={onSubmit} />;
    case "rfp":
      return <RfpPanel event={event} disabled={disabled} onSubmit={onSubmit} />;
    case "bafo":
      return <EnglishPanel event={event} disabled={disabled} onSubmit={onSubmit} myBest={myBest} bafo />;
    case "negotiated":
      return <Negotiation event={event} disabled={disabled} onSubmit={onSubmit} />;
    default:
      return <EnglishPanel event={event} disabled={disabled} onSubmit={onSubmit} myBest={myBest} />;
  }
}

function EnglishPanel({
  event,
  disabled,
  onSubmit,
  myBest,
  bafo = false,
}: {
  event: AuctionEvent;
  disabled: boolean;
  onSubmit: (s: Submission) => void;
  myBest?: number;
  bafo?: boolean;
}) {
  const forward = event.direction === "forward";
  const step = event.incrementValue || Math.round(event.baseline * 0.01);
  const base = event.value || event.baseline;
  const required = forward ? base + step : base - step;
  const [amount, setAmount] = useState(required);
  const invalid = forward ? amount < required : amount > required;

  return (
    <Card
      title={bafo ? "Best & final offer" : forward ? "Place your bid" : "Improve your offer"}
      desc={
        bafo
          ? "One improved offer only. It cannot be revised once submitted."
          : forward
            ? `Minimum increment ${inr(step)} above the standing bid.`
            : `Minimum decrement ${inr(step)} below the standing offer.`
      }
      actions={<Pill tone={event.state === "live" ? "good" : "muted"}>{event.state === "live" ? "Room open" : "Room closed"}</Pill>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Standing price" value={cr(base)} />
        <Stat label={forward ? "Minimum next bid" : "Maximum next offer"} value={cr(required)} />
        <Stat label="My last submission" value={myBest ? cr(myBest) : "None"} />
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Amount (INR)</span>
          <input
            type="number"
            value={amount}
            step={step}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-56 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2">
          {[1, 2, 4].map((m) => (
            <button
              key={m}
              onClick={() => setAmount(forward ? base + step * m : base - step * m)}
              className="rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              {forward ? "+" : "−"}
              {inr(step * m)}
            </button>
          ))}
        </div>
        <button
          disabled={disabled || invalid}
          onClick={() => onSubmit({ at: Date.now(), label: bafo ? "Best & final offer submitted" : "Bid submitted", amount })}
          className="rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {bafo ? "Submit best & final" : "Submit bid"}
        </button>
      </div>
      {invalid && (
        <p className="mt-2 text-sm text-destructive">
          Amount breaks the {forward ? "increment" : "decrement"} rule — use {cr(required)} or better.
        </p>
      )}
      {disabled && <p className="mt-2 text-sm text-muted-foreground">Clear the gates above (and the room must be open) to submit.</p>}

      <div className="mt-6">
        <h3 className="mb-2 font-display text-sm font-bold">Room activity</h3>
        <Table head={["Bidder", "Amount", "Rank", "Time"]}>
          {event.bids.map((b, i) => (
            <tr key={`${b.participantId}-${i}`}>
              <td className="py-2.5 pr-4">{event.rankVisibility === "price_visible" ? b.alias : `Bidder ${b.alias.slice(-1)}`}</td>
              <td className="py-2.5 pr-4 font-semibold">
                {event.rankVisibility === "rank_only" && i > 0 ? "Masked" : cr(b.amount)}
              </td>
              <td className="py-2.5 pr-4">{b.rank}</td>
              <td className="py-2.5 pr-4 text-xs text-muted-foreground">{fmtDate(b.at)}</td>
            </tr>
          ))}
        </Table>
      </div>
    </Card>
  );
}

function SealedPanel({ event, disabled, onSubmit }: { event: AuctionEvent; disabled: boolean; onSubmit: (s: Submission) => void }) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(event.lots.map((l) => [l.no, l.startPrice])),
  );
  const [submitted, setSubmitted] = useState(false);
  const total = Object.values(values).reduce((a, b) => a + b, 0);

  return (
    <Card
      title="Sealed offer"
      desc="No price feedback is given before the deadline. You may revise until the event closes; the last valid offer counts."
      actions={<Pill tone={submitted ? "good" : "warn"}>{submitted ? "Offer sealed" : "Not submitted"}</Pill>}
    >
      <LotInputs lots={event.lots} values={values} setValues={setValues} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Stat label="Total offer" value={cr(total)} />
        <button
          disabled={disabled}
          onClick={() => {
            setSubmitted(true);
            onSubmit({ at: Date.now(), label: submitted ? "Sealed offer revised" : "Sealed offer submitted", amount: total });
          }}
          className="rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {submitted ? "Revise sealed offer" : "Submit sealed offer"}
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Offers are opened by the evaluation committee after {fmtDate(event.endAt)}. Neither you nor the buyer can see any
        price until then.
      </p>
    </Card>
  );
}

function DutchPanel({ event, disabled, onSubmit }: { event: AuctionEvent; disabled: boolean; onSubmit: (s: Submission) => void }) {
  const step = event.incrementValue || Math.round(event.baseline * 0.02);
  const [steps, setSteps] = useState(0);
  const [taken, setTaken] = useState(false);
  const forward = event.direction === "forward";
  const price = forward ? event.baseline - step * steps : event.baseline + step * steps;

  return (
    <Card
      title="Dutch clock"
      desc={forward ? "Price steps down automatically. First accept wins the lot." : "Price steps up automatically until a supplier accepts."}
      actions={<Pill tone={taken ? "good" : "warn"}>{taken ? "Accepted" : `Step ${steps + 1}`}</Pill>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Clock price now" value={cr(price)} />
        <Stat label="Step size" value={inr(step)} />
        <Stat label="Floor / ceiling" value={cr(forward ? event.baseline * 0.7 : event.baseline * 1.3)} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => setSteps((s) => s + 1)}
          disabled={taken}
          className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-40"
        >
          Advance clock (simulate)
        </button>
        <button
          disabled={disabled || taken}
          onClick={() => {
            setTaken(true);
            onSubmit({ at: Date.now(), label: "Accepted Dutch clock price", amount: price });
          }}
          className="rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Accept {cr(price)}
        </button>
      </div>
      {taken && <p className="mt-3 text-sm text-[color:var(--success)]">Acceptance recorded. The clock stops for you.</p>}
    </Card>
  );
}

function JapanesePanel({ event, disabled, onSubmit }: { event: AuctionEvent; disabled: boolean; onSubmit: (s: Submission) => void }) {
  const step = event.incrementValue || Math.round(event.baseline * 0.01);
  const forward = event.direction === "forward";
  const [level, setLevel] = useState(0);
  const [out, setOut] = useState(false);
  const [active, setActive] = useState(Math.max(event.participants.length, 3));
  const price = forward ? event.baseline + step * level : event.baseline - step * level;

  return (
    <Card
      title="Japanese clock"
      desc="At each level you either stay in at the announced price or drop out. Dropping out is final."
      actions={<Pill tone={out ? "bad" : "good"}>{out ? "Dropped out" : "Still in"}</Pill>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={`Level ${level + 1} price`} value={cr(price)} />
        <Stat label="Participants still in" value={String(out ? active - 1 : active)} />
        <Stat label="Level step" value={inr(step)} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          disabled={disabled || out}
          onClick={() => {
            setLevel((l) => l + 1);
            setActive((a) => Math.max(2, a - (Math.random() > 0.6 ? 1 : 0)));
            onSubmit({ at: Date.now(), label: `Stayed in at level ${level + 1}`, amount: price });
          }}
          className="rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Stay in at {cr(price)}
        </button>
        <button
          disabled={disabled || out}
          onClick={() => {
            setOut(true);
            onSubmit({ at: Date.now(), label: `Dropped out at level ${level + 1}`, amount: price });
          }}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-40"
        >
          Drop out
        </button>
      </div>
    </Card>
  );
}

function QuoteSheet({ event, disabled, onSubmit }: { event: AuctionEvent; disabled: boolean; onSubmit: (s: Submission) => void }) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(event.lots.map((l) => [l.no, l.startPrice])),
  );
  const [validity, setValidity] = useState("30");
  const total = Object.values(values).reduce((a, b) => a + b, 0);

  return (
    <Card title="Quote sheet (RFQ)" desc="Quote line by line. Rank feedback is shown once the buyer opens the round.">
      <LotInputs lots={event.lots} values={values} setValues={setValues} />
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Offer validity (days)</span>
          <input
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <Stat label="Quote total" value={cr(total)} />
        <div className="flex items-end">
          <button
            disabled={disabled}
            onClick={() => onSubmit({ at: Date.now(), label: `Quote submitted (valid ${validity} days)`, amount: total })}
            className="rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Submit quote
          </button>
        </div>
      </div>
    </Card>
  );
}

const RFI_QUESTIONS = [
  "Annual turnover for the last three financial years",
  "Comparable contracts executed in this category",
  "Manpower, plant and equipment available for this scope",
  "Statutory registrations and compliance certificates held",
  "Quality, safety and ESG certifications",
];

function RfiPanel({ disabled, onSubmit }: { event: AuctionEvent; disabled: boolean; onSubmit: (s: Submission) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const done = RFI_QUESTIONS.filter((q) => (answers[q] ?? "").trim().length > 0).length;

  return (
    <Card
      title="Information questionnaire (RFI)"
      desc="No pricing at this stage. Responses are used for prequalification only."
      actions={<Pill tone={done === RFI_QUESTIONS.length ? "good" : "warn"}>{done}/{RFI_QUESTIONS.length} answered</Pill>}
    >
      <div className="space-y-4">
        {RFI_QUESTIONS.map((q) => (
          <label key={q} className="block text-sm">
            <span className="mb-1 block font-medium">{q}</span>
            <textarea
              rows={2}
              value={answers[q] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q]: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        ))}
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Drag supporting documents here (GST, PAN, audited financials, certifications).
        </div>
        <button
          disabled={disabled || done < RFI_QUESTIONS.length}
          onClick={() => onSubmit({ at: Date.now(), label: "RFI response submitted" })}
          className="rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Submit response
        </button>
      </div>
    </Card>
  );
}

function RfpPanel({ event, disabled, onSubmit }: { event: AuctionEvent; disabled: boolean; onSubmit: (s: Submission) => void }) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(event.lots.map((l) => [l.no, l.startPrice])),
  );
  const [tech, setTech] = useState("");
  const [techSent, setTechSent] = useState(false);
  const [commSent, setCommSent] = useState(false);
  const total = Object.values(values).reduce((a, b) => a + b, 0);

  return (
    <>
      <Card
        title="Envelope 1 — technical"
        desc="Opened and scored first. The commercial envelope is only opened for technically qualified bidders."
        actions={<Pill tone={techSent ? "good" : "warn"}>{techSent ? "Sealed & submitted" : "Draft"}</Pill>}
      >
        <textarea
          rows={5}
          value={tech}
          onChange={(e) => setTech(e.target.value)}
          placeholder="Methodology, mobilisation plan, manpower deployment, SLA approach, transition plan…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Attach technical annexures, org chart and certifications.
        </div>
        <button
          disabled={disabled || tech.trim().length < 10}
          onClick={() => {
            setTechSent(true);
            onSubmit({ at: Date.now(), label: "Technical envelope submitted" });
          }}
          className="mt-4 rounded-full bg-[color:var(--navy)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Seal & submit technical
        </button>
      </Card>

      <Card
        title="Envelope 2 — commercial"
        desc="Priced line by line. Stays sealed until technical evaluation is complete."
        actions={<Pill tone={commSent ? "good" : "warn"}>{commSent ? "Sealed & submitted" : "Draft"}</Pill>}
      >
        <LotInputs lots={event.lots} values={values} setValues={setValues} />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Stat label="Commercial total" value={cr(total)} />
          <button
            disabled={disabled || !techSent}
            onClick={() => {
              setCommSent(true);
              onSubmit({ at: Date.now(), label: "Commercial envelope submitted", amount: total });
            }}
            className="rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Seal & submit commercial
          </button>
        </div>
        {!techSent && <p className="mt-2 text-sm text-muted-foreground">Submit the technical envelope first.</p>}
      </Card>
    </>
  );
}

function Negotiation({ event, disabled, onSubmit }: { event: AuctionEvent; disabled: boolean; onSubmit: (s: Submission) => void }) {
  const base = event.value || event.baseline;
  const [thread, setThread] = useState<{ from: "buyer" | "me"; text: string; amount?: number; at: number }[]>([
    {
      from: "buyer",
      text:
        event.direction === "forward"
          ? "We can conclude at this level if you improve by 1.5% and confirm lifting within 7 days."
          : "Please revisit your rate by 2% and confirm a 12-month price hold.",
      amount: event.direction === "forward" ? Math.round(base * 1.015) : Math.round(base * 0.98),
      at: Date.now() - 3600_000,
    },
  ]);
  const [amount, setAmount] = useState(base);
  const [note, setNote] = useState("");

  return (
    <Card title="Negotiation room" desc="Counteroffers, reasons and approvals are all recorded for audit.">
      <ol className="space-y-3">
        {thread.map((m, i) => (
          <li
            key={i}
            className={`rounded-lg border border-border p-4 text-sm ${m.from === "me" ? "bg-muted/50" : "bg-card"}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{m.from === "me" ? "You" : "Buyer — event owner"}</span>
              {m.amount != null && <Pill tone="good">{cr(m.amount)}</Pill>}
              <span className="text-xs text-muted-foreground">{fmtDate(m.at)}</span>
            </div>
            <p className="mt-1.5 text-muted-foreground">{m.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Counteroffer (INR)</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Reason / conditions</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Freight basis, payment terms, validity…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>
      <button
        disabled={disabled}
        onClick={() => {
          setThread((t) => [...t, { from: "me", text: note || "Counteroffer submitted.", amount, at: Date.now() }]);
          setNote("");
          onSubmit({ at: Date.now(), label: "Counteroffer sent", amount });
        }}
        className="mt-4 rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        Send counteroffer
      </button>
    </Card>
  );
}

function LotInputs({
  lots,
  values,
  setValues,
}: {
  lots: LineItem[];
  values: Record<string, number>;
  setValues: (f: (v: Record<string, number>) => Record<string, number>) => void;
}) {
  return (
    <Table head={["#", "Line item", "Qty", "Basis", "My price (INR)"]}>
      {lots.map((l) => (
        <tr key={l.no}>
          <td className="py-2.5 pr-4">{l.no}</td>
          <td className="py-2.5 pr-4 font-medium">{l.description}</td>
          <td className="py-2.5 pr-4">
            {l.quantity} {l.unit}
          </td>
          <td className="py-2.5 pr-4 text-muted-foreground">{inr(l.startPrice)}</td>
          <td className="py-2.5 pr-4">
            <input
              type="number"
              value={values[l.no] ?? 0}
              onChange={(e) => setValues((v) => ({ ...v, [l.no]: Number(e.target.value) }))}
              className="w-40 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            />
          </td>
        </tr>
      ))}
    </Table>
  );
}

function Gate({ ok, label, action, onDo }: { ok: boolean; label: string; action: string; onDo: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3.5">
      <span className="text-sm font-medium">
        {ok ? "✓ " : "• "}
        {label}
      </span>
      {ok ? (
        <Pill tone="good">Done</Pill>
      ) : (
        <button
          onClick={onDo}
          className="rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
