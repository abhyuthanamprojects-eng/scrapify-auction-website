import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Gavel,
  Users,
  ShieldCheck,
  Timer,
  TriangleAlert,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getLot, formatINR, type Lot } from "@/lib/mock-lots";
import { useTick } from "@/hooks/use-tick";
import { useFlow, useHydrated } from "@/hooks/use-flow";
import { useRegistration } from "@/hooks/use-registration";
import {
  endNow,
  extendAuction,
  lotType,
  maskedAlias,
  placeBid,
  subLots,
  notify,
} from "@/lib/customer-flow";

export const Route = createFileRoute("/live/$id")({
  loader: ({ params }) => {
    const lot = getLot(params.id);
    if (!lot) throw notFound();
    return { lot };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Bidding room unavailable — Scrapify Live Auction" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { lot } = loaderData;
    const desc = `Live bidding room for ${lot.title} — masked bidders, server-synced countdown and minimum-increment validation.`;
    return {
      meta: [
        { title: `Live room · ${lot.title} — Scrapify Live Auction` },
        { name: "description", content: desc },
        { property: "og:title", content: `Live room · ${lot.title}` },
        { property: "og:description", content: desc },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: LiveRoom,
  notFoundComponent: () => (
    <Shell>
      <h1 className="font-display text-3xl font-bold">Bidding room not found</h1>
      <BackLink />
    </Shell>
  ),
});

function LiveRoom() {
  const { lot } = Route.useLoaderData() as { lot: Lot };
  const navigate = useNavigate();
  useTick(1000);
  const hydrated = useHydrated();
  const flow = useFlow();
  const { state } = useRegistration();

  const participation = flow.participation[lot.id];
  const emdConfirmed = participation?.emd === "confirmed";
  const approved = state.vendorStatus === "approved";
  const extended = flow.extendedBy[lot.id] ?? 0;
  const closed = flow.endedNow.includes(lot.id);
  const endsAt = lot.endsAt + extended * 60_000;
  const remaining = Math.max(0, endsAt - Date.now());
  const over = closed || remaining === 0;

  const isReverse = lot.auctionType === "reverse";
  const myBid = flow.myBids[lot.id];
  const current = myBid
    ? isReverse
      ? Math.min(myBid, lot.currentBid)
      : Math.max(myBid, lot.currentBid)
    : lot.currentBid;

  const [subLot, setSubLot] = useState("1");
  const [amount, setAmount] = useState(
    isReverse ? lot.currentBid - lot.increment : lot.currentBid + lot.increment,
  );
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  const parts = subLots(lot);
  const perSubLot = lotType(lot) === "Lot-wise";

  const board = useMemo(() => {
    const rows = lot.history.map((h, i) => ({
      alias: maskedAlias(i),
      amount: h.amount,
      at: h.at,
      mine: false,
    }));
    if (myBid) rows.unshift({ alias: "You", amount: myBid, at: "just now", mine: true });
    return rows.sort((a, b) => (isReverse ? a.amount - b.amount : b.amount - a.amount));
  }, [lot.history, myBid, isReverse]);

  const myRank = myBid ? board.findIndex((r) => r.mine) + 1 : null;

  const validate = () => {
    const min = isReverse ? current - lot.increment : current + lot.increment;
    if (isReverse ? amount > min : amount < min) {
      setError(
        `Minimum ${isReverse ? "reduction" : "increment"} is ${formatINR(lot.increment)} — bid ${
          isReverse ? "at or below" : "at or above"
        } ${formatINR(min)}.`,
      );
      return false;
    }
    setError("");
    return true;
  };

  if (!approved || !emdConfirmed) {
    return (
      <Shell>
        <div className="card-soft mx-auto max-w-lg p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-[color:var(--auction)]" />
          <h1 className="mt-3 font-display text-2xl font-extrabold">
            Bidding room locked
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {!approved
              ? "Only approved vendors can participate. Complete registration and wait for admin approval."
              : "Only EMD-confirmed vendors enter the live room. Register for this auction and pay the EMD."}
          </p>
          <Link
            to="/lots/$id"
            params={{ id: lot.id }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            {approved ? "Register & pay EMD" : "Go to registration"}
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <SiteHeader />

      {extended > 0 && !over && (
        <div className="border-b border-amber-500/40 bg-amber-500/10">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 text-sm text-amber-900 sm:px-6">
            <Timer className="h-4 w-4" />
            Auction extended by {extended} minutes by the auctioneer (anti-sniping).
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link
          to="/lots/$id"
          params={{ id: lot.id }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to lot
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="card-soft overflow-hidden">
            <div className="bg-[color:var(--navy)] p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/70">
                    {lot.id} · {isReverse ? "Reverse auction" : "Forward auction"} ·{" "}
                    {lotType(lot)}
                  </div>
                  <h1 className="mt-1 font-display text-2xl font-extrabold">
                    {lot.title}
                  </h1>
                </div>
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                    over ? "bg-white/10" : "bg-[color:var(--auction)]"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  {over ? "Closed" : hydrated ? fmtRemaining(remaining) : "—"}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                <Metric label={isReverse ? "Current L1" : "Live price"} value={formatINR(current)} />
                <Metric label="My rank" value={myRank ? `#${myRank}` : "—"} />
                <Metric label="Bidders" value={String(lot.bidders)} />
              </div>
              <p className="mt-3 text-xs text-white/50">
                Countdown is synced to server time. Bidder identities are masked.
              </p>
            </div>
          </div>

          <div className="mt-6 card-soft p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Live bid board</h2>
              <span className="text-xs text-muted-foreground">Aliases only</span>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {board.length === 0 && (
                <li className="py-4 text-sm text-muted-foreground">No bids yet.</li>
              )}
              {board.map((r, i) => (
                <li
                  key={i}
                  className={`flex items-center justify-between py-3 text-sm ${
                    r.mine ? "font-semibold text-[color:var(--auction)]" : ""
                  }`}
                >
                  <span className="w-10 text-muted-foreground">#{i + 1}</span>
                  <span className="flex-1">{r.alias}</span>
                  <span className="font-display font-bold">{formatINR(r.amount)}</span>
                  <span className="w-20 text-right text-xs text-muted-foreground">
                    {r.at}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 card-soft p-6 text-xs text-muted-foreground">
            <div className="font-semibold uppercase tracking-wider">
              Auctioneer simulation (demo)
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => extendAuction(lot, 5)}
                className="rounded-full border border-border bg-card px-4 py-1.5 font-semibold text-foreground hover:border-[color:var(--auction)]"
              >
                Extend +5 min
              </button>
              <button
                onClick={() => endNow(lot)}
                className="rounded-full border border-border bg-card px-4 py-1.5 font-semibold text-foreground hover:border-destructive"
              >
                End now
              </button>
              <button
                onClick={() =>
                  notify("You were outbid", `Another bidder leads on ${lot.id}.`, "warn")
                }
                className="rounded-full border border-border bg-card px-4 py-1.5 font-semibold text-foreground hover:border-[color:var(--accent-blue)]"
              >
                Send outbid alert
              </button>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-soft p-6">
            {over ? (
              <div className="text-center">
                <TriangleAlert className="mx-auto h-7 w-7 text-[color:var(--auction)]" />
                <h2 className="mt-2 font-display text-xl font-extrabold">
                  Auction closed
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bidding has ended. The result is available now.
                </p>
                <button
                  onClick={() => navigate({ to: "/results/$id", params: { id: lot.id } })}
                  className="mt-4 w-full rounded-full bg-[color:var(--auction)] px-5 py-3 font-display font-bold text-white"
                >
                  View result
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-lg font-bold">Place your bid</h2>
                {perSubLot && (
                  <div className="mt-3">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Sub-lot
                    </label>
                    <select
                      value={subLot}
                      onChange={(e) => setSubLot(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    >
                      {parts.map((p) => (
                        <option key={p.no} value={p.no}>
                          Sub-lot {p.no} · {p.quantity} · start {formatINR(p.startPrice)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mt-3 flex items-stretch overflow-hidden rounded-xl border border-border">
                  <button
                    onClick={() => setAmount((a) => a - lot.increment)}
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
                    onClick={() => setAmount((a) => a + lot.increment)}
                    className="px-4 text-lg font-bold text-muted-foreground hover:bg-muted"
                  >
                    +
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 5].map((m) => (
                    <button
                      key={m}
                      onClick={() =>
                        setAmount(
                          isReverse
                            ? current - lot.increment * m
                            : current + lot.increment * m,
                        )
                      }
                      className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold hover:border-[color:var(--auction)] hover:text-[color:var(--auction)]"
                    >
                      {isReverse ? "−" : "+"}
                      {formatINR(lot.increment * m)}
                    </button>
                  ))}
                </div>

                {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

                <button
                  onClick={() => validate() && setConfirm(true)}
                  className="mt-4 w-full rounded-full bg-[color:var(--auction)] px-6 py-3.5 font-display text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.7)] hover:brightness-110"
                >
                  <span className="inline-flex items-center gap-2">
                    <Gavel className="h-4 w-4" /> Review bid
                  </span>
                </button>

                <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Minimum {isReverse ? "reduction" : "increment"}{" "}
                  {formatINR(lot.increment)}. Reserve status:{" "}
                  {current >= lot.reserve ? "reserve met" : "reserve not met"}.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-lg font-extrabold">Confirm your bid</h3>
              <button onClick={() => setConfirm(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              You are bidding <b className="text-foreground">{formatINR(amount)}</b> on{" "}
              {lot.id}
              {perSubLot ? ` (sub-lot ${subLot})` : ""}. Bids are binding and cannot be
              withdrawn.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirm(false)}
                className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  placeBid(lot, amount);
                  notify("Bid placed", `${formatINR(amount)} on ${lot.id}.`, "success");
                  setConfirm(false);
                }}
                className="flex-1 rounded-full bg-[color:var(--auction)] py-2.5 text-sm font-bold text-white"
              >
                Confirm bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-xl font-extrabold">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-white/60">{label}</div>
    </div>
  );
}

function fmtRemaining(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${String(s).padStart(2, "0")}s`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">{children}</div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white"
    >
      <ArrowLeft className="h-4 w-4" /> Back to marketplace
    </Link>
  );
}
