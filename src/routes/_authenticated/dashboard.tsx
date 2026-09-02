import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { VendorStatusBanner } from "@/components/vendor-status-banner";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { getAuctions, formatINR, type Lot } from "@/lib/auction-data";
import { EMD_LABEL } from "@/lib/customer-flow";
import { Gavel, Wallet, ClipboardList, Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: async () => {
    const [bids, emd, wallet, auctions] = await Promise.all([
      api.getMyBids().catch(() => ({ data: { active: [], won: [], lost: [] } })),
      api.getEmd().catch(() => ({ data: [] })),
      api.getWallet().catch(() => ({ data: { balance_inr: 0 } })),
      getAuctions({ per_page: "100" }).catch(() => []),
    ]);
    return {
      bids: bids.data ?? bids,
      emdRows: Array.isArray(emd.data) ? emd.data : [],
      wallet: wallet.data ?? wallet,
      auctions,
    };
  },
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
  const { bids, emdRows, auctions } = Route.useLoaderData() as {
    bids: { active?: any[]; won?: any[]; lost?: any[] };
    emdRows: any[];
    wallet: any;
    auctions: Lot[];
  };
  const [tab, setTab] = useState<"registered" | "live" | "won" | "watch">("registered");

  const activeBidRows = bids.active ?? [];
  const wonRows = bids.won ?? [];
  const registeredCodes = new Set([
    ...activeBidRows.map((bid) => String(bid.auction_code ?? bid.auction?.code ?? "")),
    ...emdRows.map((row) => String(row.auction_code ?? row.auction?.code ?? "")),
  ]);
  const lots =
    tab === "won"
      ? auctions.filter((lot) => wonRows.some((bid) => String(bid.auction_code ?? bid.auction?.code) === lot.id))
      : tab === "live"
        ? auctions.filter((lot) => registeredCodes.has(lot.id) && lot.status === "live")
        : tab === "watch"
          ? auctions.filter((lot) => Boolean((lot as any).interested))
          : auctions.filter((lot) => registeredCodes.has(lot.id));
  const emdBlocked = emdRows
    .filter((row) => ["confirmed", "held", "locked"].includes(String(row.status ?? row.state)))
    .reduce((s2, row) => s2 + Number(row.amount_inr ?? row.amount ?? 0), 0);

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
          <Stat icon={Gavel} label="Active bids" value={String(activeBidRows.length)} />
          <Stat icon={Wallet} label="EMD blocked" value={formatINR(emdBlocked)} />
          <Stat icon={ClipboardList} label="Won lots" value={String(wonRows.length)} />
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

        {lots.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Heart className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing here yet. Register for an auction to see it listed.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lots.map((lot) => {
              const emd = emdRows.find((row) => String(row.auction_code ?? row.auction?.code) === lot.id);
              const myBid = activeBidRows.find((bid) => String(bid.auction_code ?? bid.auction?.code) === lot.id);
              return (
                <div key={lot.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {lot.id} · {lot.status}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold text-foreground">
                    {lot.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    EMD {formatINR(lot.emd)} · {EMD_LABEL[(emd?.status ?? "not_paid") as keyof typeof EMD_LABEL] ?? String(emd?.status ?? "Not paid")}
                  </p>
                  {myBid && (
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      My bid {formatINR(Number(myBid.amount_inr ?? myBid.amount ?? 0))}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <Link
                      to="/lots/$id"
                      params={{ id: lot.id }}
                      className="rounded-full border border-border px-3 py-1.5 hover:border-[color:var(--auction)]"
                    >
                      Lot details
                    </Link>
                    {lot.status === "live" && (
                      <Link
                      to="/live/$id"
                        params={{ id: lot.id }}
                        className="rounded-full bg-[color:var(--auction)] px-3 py-1.5 text-white"
                      >
                        Bidding room
                      </Link>
                    )}
                    <Link
                      to="/results/$id"
                      params={{ id: lot.id }}
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
