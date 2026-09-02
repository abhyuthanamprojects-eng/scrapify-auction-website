import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  FileText,
  Truck,
  XCircle,
  CircleDollarSign,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getLot, formatINR, type Lot } from "@/lib/auction-data";
import { useFlow } from "@/hooks/use-flow";
import {
  EMD_LABEL,
  payableSummary,
  scheduleLifting,
  submitPayment,
} from "@/lib/customer-flow";

export const Route = createFileRoute("/results/$id")({
  loader: async ({ params }) => {
    const lot = await getLot(params.id).catch(() => null);
    if (!lot) throw notFound();
    return { lot };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Result unavailable — Scrapify Auction" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { lot } = loaderData;
    const desc = `Auction result, award letter and payable summary (GST 18%, TCS 1%, less EMD) for ${lot.title}.`;
    return {
      meta: [
        { title: `Result · ${lot.title} — Scrapify Auction` },
        { name: "description", content: desc },
        { property: "og:title", content: `Result · ${lot.title}` },
        { property: "og:description", content: desc },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: ResultPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Result not found</h1>
        <Link to="/" className="mt-6 inline-block underline">
          Back to marketplace
        </Link>
      </div>
    </div>
  ),
});

function ResultPage() {
  const { lot } = Route.useLoaderData() as { lot: Lot };
  const flow = useFlow();
  const myBid = flow.myBids[lot.id];
  const participation = flow.participation[lot.id];
  const emdHeld = participation?.emd === "confirmed" ? lot.emd : 0;
  const payment = flow.payments[lot.id];

  const isReverse = lot.auctionType === "reverse";
  const leads = myBid
    ? isReverse
      ? myBid <= lot.currentBid
      : myBid >= lot.currentBid
    : false;
  const reserveMet = (myBid ?? lot.currentBid) >= lot.reserve;
  const outcome: "won" | "lost" | "reserve" = !myBid
    ? "lost"
    : !reserveMet
      ? "reserve"
      : leads
        ? "won"
        : "lost";

  const sum = payableSummary(myBid ?? lot.currentBid, emdHeld);
  const [ref, setRef] = useState("");
  const [slot, setSlot] = useState("");

  return (
    <div className="min-h-screen bg-background pb-24">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Link
          to="/lots/$id"
          params={{ id: lot.id }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to lot
        </Link>

        <div
          className={`mt-6 card-soft p-6 ${
            outcome === "won" ? "border-emerald-500/40" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            {outcome === "won" ? (
              <BadgeCheck className="h-8 w-8 text-emerald-600" />
            ) : (
              <XCircle className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                {outcome === "won"
                  ? "You won this auction"
                  : outcome === "reserve"
                    ? "Reserve not met"
                    : "You did not win"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {lot.id} · {lot.title}
              </p>
            </div>
          </div>
        </div>

        {outcome === "won" ? (
          <>
            <section className="mt-6 card-soft p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Payable summary</h2>
                <button className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-[color:var(--auction)]">
                  <Download className="h-3.5 w-3.5" /> Award letter (PDF)
                </button>
              </div>
              <dl className="mt-4 overflow-hidden rounded-xl border border-border text-sm">
                <Money label="H1 value" value={sum.h1} />
                <Money label="GST @ 18%" value={sum.gst} />
                <Money label="TCS @ 1% (on value + GST)" value={sum.tcs} />
                <Money label="Total" value={sum.total} strong />
                <Money label="Less EMD held" value={-sum.emdHeld} />
                <Money label="Balance payable" value={sum.balance} strong />
              </dl>
            </section>

            <section className="mt-6 card-soft p-6">
              <h2 className="font-display text-lg font-bold">Balance payment</h2>
              {payment ? (
                <p className="mt-2 text-sm text-emerald-700">
                  Payment reference <b>{payment.reference}</b> submitted — awaiting
                  finance confirmation.
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder="NEFT / RTGS / gateway reference"
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  />
                  <button
                    disabled={!ref.trim()}
                    onClick={() => submitPayment(lot, ref.trim())}
                    className="rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Submit payment
                  </button>
                </div>
              )}
            </section>

            <section className="mt-6 card-soft p-6">
              <h2 className="font-display text-lg font-bold">Lifting &amp; gate pass</h2>
              {payment?.lifting ? (
                <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800">
                    <Truck className="h-4 w-4" /> Pickup scheduled · {payment.lifting}
                  </div>
                  <p className="mt-1 text-emerald-800/80">
                    Delivery status: In progress. Show the gate pass at {lot.location}.
                  </p>
                  <button className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-600/40 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                    <FileText className="h-3.5 w-3.5" /> Download gate pass
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="datetime-local"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  />
                  <button
                    disabled={!slot || !payment}
                    title={!payment ? "Submit the balance payment first" : undefined}
                    onClick={() =>
                      scheduleLifting(lot, new Date(slot).toLocaleString("en-IN"))
                    }
                    className="rounded-full bg-[color:var(--navy)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Schedule lifting
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="mt-6 card-soft p-6">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-[color:var(--accent-blue)]" />
              <h2 className="font-display text-lg font-bold">EMD refund tracker</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Your EMD of {formatINR(lot.emd)} is released automatically since you did not
              win.
            </p>
            <ol className="mt-4 space-y-3">
              {(["confirmed", "refund_initiated", "refunded"] as const).map((s, i) => {
                const order = ["confirmed", "refund_initiated", "refunded"];
                const at = order.indexOf(participation?.emd ?? "not_paid");
                const done = at >= i;
                return (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                        done
                          ? "bg-emerald-600 text-white"
                          : "border border-border text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={done ? "font-semibold text-foreground" : "text-muted-foreground"}>
                      {s === "confirmed" ? "EMD Held" : EMD_LABEL[s]}
                    </span>
                  </li>
                );
              })}
            </ol>
            {participation && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-border px-3 py-1.5 font-semibold text-muted-foreground">
                  Refund status is updated by finance
                </span>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Money({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b border-border px-4 py-2.5 last:border-0 ${
        strong ? "bg-muted font-bold" : ""
      }`}
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-display text-foreground">
        {value < 0 ? "− " + formatINR(Math.abs(value)) : formatINR(value)}
      </dd>
    </div>
  );
}
