import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { VendorStatusBanner } from "@/components/vendor-status-banner";
import { useAuth } from "@/hooks/use-auth";
import { useFlow } from "@/hooks/use-flow";
import { getLot, formatINR } from "@/lib/mock-lots";
import { EMD_LABEL } from "@/lib/customer-flow";
import { Gavel, Wallet, ClipboardList, Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Buyer dashboard — Scrapify Auction" },
      {
        name: "description",
        content: "Your active bids, wallet balance, and won lots.",
      },
      { property: "og:title", content: "Buyer dashboard — Scrapify Auction" },
      { property: "og:description", content: "Bidding, wallet and lifted lots." },
    ],
  }),
  component: BuyerDashboard,
});

function BuyerDashboard() {
  const { loading, primaryRole, user } = useAuth();
  const flow = useFlow();
  const [tab, setTab] = useState<"registered" | "live" | "won" | "watch">("registered");

  const parts = Object.values(flow.participation);
  const emdBlocked = parts
    .filter((p) => p.emd === "confirmed")
    .reduce((s2, p) => s2 + (getLot(p.lotId)?.emd ?? 0), 0);
  const activeBids = Object.keys(flow.myBids).length;
  const wonIds = Object.keys(flow.payments);

  const ids =
    tab === "watch"
      ? flow.watch
      : tab === "won"
        ? wonIds
        : tab === "live"
          ? parts.filter((p) => getLot(p.lotId)?.status === "live").map((p) => p.lotId)
          : parts.map((p) => p.lotId);

  if (loading) return <FullPageLoading />;
  if (primaryRole === "seller") return <Navigate to="/seller" />;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <VendorStatusBanner />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Buyer console
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground">
              Hello {user?.user_metadata?.full_name || user?.email}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your active bids, EMD deposits and won lots.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-full bg-[color:var(--auction)] px-5 py-2 text-sm font-semibold text-white"
          >
            Browse live lots
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <Stat icon={Gavel} label="Active bids" value={String(activeBids)} />
          <Stat icon={Wallet} label="EMD blocked" value={formatINR(emdBlocked)} />
          <Stat icon={ClipboardList} label="Won lots" value={String(wonIds.length)} />
        </div>

        <div className="mt-10 inline-flex flex-wrap rounded-full border border-border bg-card p-1">
          {([
            ["registered", "Registered"],
            ["live", "Live now"],
            ["won", "Won / Awarded"],
            ["watch", "Watchlist"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === k
                  ? "bg-[color:var(--navy)] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {ids.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Heart className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing here yet. Register for an auction to see it listed.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ids.map((id) => {
              const lot = getLot(id);
              if (!lot) return null;
              const p = flow.participation[id];
              return (
                <div key={id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {lot.id} · {lot.status}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold text-foreground">
                    {lot.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    EMD {formatINR(lot.emd)} · {EMD_LABEL[p?.emd ?? "not_paid"]}
                  </p>
                  {flow.myBids[id] && (
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      My bid {formatINR(flow.myBids[id])}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <Link
                      to="/lots/$id"
                      params={{ id }}
                      className="rounded-full border border-border px-3 py-1.5 hover:border-[color:var(--auction)]"
                    >
                      Lot details
                    </Link>
                    {lot.status === "live" && (
                      <Link
                        to="/live/$id"
                        params={{ id }}
                        className="rounded-full bg-[color:var(--auction)] px-3 py-1.5 text-white"
                      >
                        Bidding room
                      </Link>
                    )}
                    <Link
                      to="/results/$id"
                      params={{ id }}
                      className="rounded-full border border-border px-3 py-1.5 hover:border-[color:var(--auction)]"
                    >
                      Result
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <Icon className="h-5 w-5 text-[color:var(--auction)]" />
      <div className="mt-3 font-display text-3xl font-extrabold text-foreground">
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function FullPageLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
      Loading…
    </div>
  );
}