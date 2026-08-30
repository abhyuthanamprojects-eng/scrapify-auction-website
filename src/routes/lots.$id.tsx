import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  Users,
  MapPin,
  Scale,
  Factory,
  Share2,
  Info,
  ArrowDownLeft,
  Heart,
  FileText,
  CalendarClock,
  Layers,
  Gavel,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getLot, formatINR, timeLeft, type Lot } from "@/lib/mock-lots";
import { useTick } from "@/hooks/use-tick";
import { useRegistration } from "@/hooks/use-registration";
import { useFlow } from "@/hooks/use-flow";
import { VendorStatusBanner } from "@/components/vendor-status-banner";
import {
  EMD_LABEL,
  confirmEmd,
  documents,
  emdPercent,
  inspection,
  lotType,
  payEmd,
  registerForAuction,
  startsAt,
  subLots,
  terms,
  toggleWatch,
} from "@/lib/customer-flow";

export const Route = createFileRoute("/lots/$id")({
  loader: ({ params }) => {
    const lot = getLot(params.id);
    if (!lot) throw notFound();
    return { lot };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Lot not found — Scrapify Auction" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { lot } = loaderData;
    const desc = `${lot.title} • ${lot.weight} • ${lot.location}. Current ${
      lot.auctionType === "reverse" ? "L1" : "highest bid"
    } ${formatINR(lot.currentBid)} on Scrapify Auction.`;
    return {
      meta: [
        { title: `${lot.title} — Scrapify Auction` },
        { name: "description", content: desc },
        { property: "og:title", content: `${lot.title} — Scrapify Auction` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: LotDetail,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Lot not found</h1>
        <p className="mt-2 text-muted-foreground">
          This auction may have ended or been withdrawn.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to marketplace
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen bg-background p-12 text-center">
      <p className="text-destructive">{error.message}</p>
      <button onClick={reset} className="mt-4 underline">Retry</button>
    </div>
  ),
});

function LotDetail() {
  const { lot } = Route.useLoaderData() as { lot: Lot };
  useTick(1000);
  const t = timeLeft(lot.endsAt);
  const [amount, setAmount] = useState(lot.currentBid + lot.increment);
  const isReverse = lot.auctionType === "reverse";
  const { state } = useRegistration();
  const approved = state.approved;
  const pending = state.paymentSubmitted && !approved;
  const flow = useFlow();
  const part = flow.participation[lot.id];
  const emdStatus = part?.emd ?? "not_paid";
  const emdOk = emdStatus === "confirmed";
  const canBid = approved && emdOk && lot.status === "live";
  const watching = flow.watch.includes(lot.id);
  const [emdRef, setEmdRef] = useState("");
  const fmt = (ms: number) =>
    new Date(ms).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background pb-32">
      <SiteHeader />
      <VendorStatusBanner />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to marketplace
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: image + facts */}
        <div>
          <div className="card-soft overflow-hidden">
            <div className="relative aspect-[4/3] bg-muted">
              <img
                src={lot.image}
                alt={lot.title}
                className="h-full w-full object-cover"
                width={1024}
                height={768}
              />
              <div className="absolute left-4 top-4 flex items-center gap-2">
                {lot.status === "live" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
                    <span className="live-dot" /> Live now
                  </span>
                )}
                {isReverse && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--accent-blue)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
                    <ArrowDownLeft className="h-3.5 w-3.5" /> Reverse
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5">{lot.category}</span>
              <span>{lot.id}</span>
              <span>·</span>
              <span>{lot.condition}</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
              {lot.title}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{lot.description}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Fact icon={Scale} label="Weight" value={lot.weight} />
            <Fact icon={MapPin} label="Pickup" value={lot.location} />
            <Fact icon={Factory} label="Seller" value={lot.seller} />
            <Fact icon={Users} label="Bidders" value={String(lot.bidders)} />
          </div>

          {/* Schedule */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Fact icon={CalendarClock} label="Starts" value={fmt(startsAt(lot))} />
            <Fact icon={CalendarClock} label="Ends" value={fmt(lot.endsAt)} />
            <Fact icon={Layers} label="Auction type" value={`${lotType(lot)} · ${isReverse ? "Reverse" : "Forward"}`} />
          </div>

          {/* Sub-lots */}
          <div className="mt-8 card-soft overflow-hidden">
            <div className="border-b border-border px-5 py-3">
              <h2 className="font-display text-lg font-bold">Lot breakdown</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2">Sub-lot</th>
                  <th className="px-5 py-2">Material</th>
                  <th className="px-5 py-2">Qty</th>
                  <th className="px-5 py-2">Base price</th>
                </tr>
              </thead>
              <tbody>
                {subLots(lot).map((sl) => (
                  <tr key={sl.no} className="border-t border-border">
                    <td className="px-5 py-2.5 font-medium">{sl.no}</td>
                    <td className="px-5 py-2.5">{sl.description}</td>
                    <td className="px-5 py-2.5">{sl.quantity}</td>
                    <td className="px-5 py-2.5 font-display font-bold">
                      {formatINR(sl.startPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Inspection */}
          <div className="mt-8 card-soft p-6">
            <h2 className="font-display text-lg font-bold">Inspection</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {Object.entries(inspection(lot)).map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border p-3 text-sm">
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Terms & documents */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="card-soft p-6">
              <h2 className="font-display text-lg font-bold">Terms &amp; conditions</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {terms(lot).map((t2) => (
                  <li key={t2} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--auction)]" />
                    {t2}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-soft p-6">
              <h2 className="font-display text-lg font-bold">Documents</h2>
              <ul className="mt-3 space-y-2">
                {documents(lot).map((d) => (
                  <li key={d.name}>
                    <button className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-sm hover:border-[color:var(--auction)]">
                      <span className="flex items-center gap-2 font-medium">
                        <FileText className="h-4 w-4 text-[color:var(--accent-blue)]" />
                        {d.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{d.size}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bid history */}
          <div className="mt-8 card-soft p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Bid history</h2>
              <span className="text-xs text-muted-foreground">
                Bidder identities masked
              </span>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {lot.history.length === 0 && (
                <li className="py-4 text-sm text-muted-foreground">
                  No bids yet — be the first once the auction opens.
                </li>
              )}
              {lot.history.map((h: Lot["history"][number], i: number) => (
                <li
                  key={i}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="font-medium text-foreground">{h.bidder}</span>
                  <span className="font-display font-bold text-[color:var(--navy)]">
                    {formatINR(h.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">{h.at}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: bid panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-soft overflow-hidden">
            <div className="bg-[color:var(--navy)] p-6 text-white">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/70">
                <span>{isReverse ? "Current L1" : "Highest bid"}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                    t.urgent ? "bg-[color:var(--auction)]" : "bg-white/10"
                  }`}
                >
                  <Clock className="h-3 w-3" /> {t.label}
                </span>
              </div>
              <div className="mt-2 font-display text-4xl font-extrabold">
                {formatINR(lot.currentBid)}
              </div>
              <div className="mt-1 text-sm text-white/70">
                Reserve {formatINR(lot.reserve)} · Increment {formatINR(lot.increment)}
              </div>
            </div>

            <div className="p-6">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your bid amount
              </label>
              <div className="mt-2 flex items-stretch overflow-hidden rounded-xl border border-border">
                <button
                  onClick={() => setAmount((a: number) => Math.max(lot.increment, a - lot.increment))}
                  className="px-4 text-lg font-bold text-muted-foreground hover:bg-muted"
                >
                  −
                </button>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-transparent text-center font-display text-xl font-bold focus:outline-none"
                />
                <button
                  onClick={() => setAmount((a: number) => a + lot.increment)}
                  className="px-4 text-lg font-bold text-muted-foreground hover:bg-muted"
                >
                  +
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[lot.increment, lot.increment * 2, lot.increment * 5].map((step) => (
                  <button
                    key={step}
                    onClick={() => setAmount((a: number) => a + step)}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground hover:border-[color:var(--auction)] hover:text-[color:var(--auction)]"
                  >
                    +{formatINR(step)}
                  </button>
                ))}
              </div>

              {canBid ? (
                <Link
                  to="/live/$id"
                  params={{ id: lot.id }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--auction)] px-6 py-3.5 font-display text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.7)] transition-transform hover:brightness-110 active:scale-[0.99]"
                >
                  <Gavel className="h-4 w-4" /> Enter bidding room
                </Link>
              ) : (
                <button
                  disabled
                  title={
                    !approved
                      ? "Complete registration and KYC approval to bid"
                      : !emdOk
                        ? "Pay and get EMD confirmed to bid"
                        : "Auction is not live"
                  }
                  className="mt-4 w-full cursor-not-allowed rounded-full bg-[color:var(--auction)] px-6 py-3.5 font-display text-base font-bold text-white opacity-50"
                >
                  Bidding locked
                </button>
              )}

              {!approved && (
                <Link
                  to="/register"
                  className="mt-2 block w-full rounded-full border border-[color:var(--auction)]/50 bg-[color:var(--auction)]/5 px-4 py-2 text-center text-xs font-semibold text-[color:var(--auction)] hover:bg-[color:var(--auction)]/10"
                >
                  {pending ? "Verification pending — view status" : "Register to unlock bidding"}
                </Link>
              )}

              {/* EMD participation */}
              <div className="mt-4 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--auction)]" /> EMD
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                    {EMD_LABEL[emdStatus]}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <b className="text-foreground">{formatINR(lot.emd)}</b> ({emdPercent(lot)}%
                  of base) refundable deposit. Auto-released if you do not win.
                </p>

                {approved && emdStatus === "not_paid" && !part && (
                  <button
                    onClick={() => registerForAuction(lot)}
                    className="mt-3 w-full rounded-full bg-[color:var(--navy)] py-2.5 text-sm font-bold text-white"
                  >
                    Register for this auction
                  </button>
                )}

                {approved && part && emdStatus === "not_paid" && (
                  <div className="mt-3 space-y-2">
                    <input
                      value={emdRef}
                      onChange={(e) => setEmdRef(e.target.value)}
                      placeholder="Payment reference (NEFT / UPI / gateway)"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                    <button
                      disabled={!emdRef.trim()}
                      onClick={() => payEmd(lot, "neft", emdRef.trim())}
                      className="w-full rounded-full bg-[color:var(--auction)] py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Pay EMD {formatINR(lot.emd)}
                    </button>
                  </div>
                )}

                {emdStatus === "pending" && (
                  <button
                    onClick={() => confirmEmd(lot)}
                    className="mt-3 w-full rounded-full border border-border py-2 text-xs font-semibold hover:border-emerald-600"
                  >
                    Simulate finance confirmation
                  </button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => toggleWatch(lot.id)}
                  className={`inline-flex items-center justify-center gap-2 rounded-full border py-2 text-sm ${
                    watching
                      ? "border-[color:var(--auction)] text-[color:var(--auction)]"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${watching ? "fill-current" : ""}`} />
                  {watching ? "Watching" : "Watch"}
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-2 text-sm text-muted-foreground hover:text-foreground">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>

              {lot.status === "ended" && (
                <Link
                  to="/results/$id"
                  params={{ id: lot.id }}
                  className="mt-3 block w-full rounded-full border border-border py-2 text-center text-sm font-semibold hover:border-[color:var(--auction)]"
                >
                  View result &amp; payment
                </Link>
              )}
            </div>
          </div>

          <div className="mt-4 card-soft flex items-start gap-3 p-4 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent-blue)]" />
            <span>
              Bidding is unlocked after KYC approval. Public view shows masked history —
              register to see full activity and place bids.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="card-soft p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}