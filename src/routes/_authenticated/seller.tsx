import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { Factory, PackagePlus, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/seller")({
  head: () => ({
    meta: [
      { title: "Seller console — Scrapify Auction" },
      {
        name: "description",
        content: "Manage your lots, auctions and payouts on Scrapify Auction.",
      },
      { property: "og:title", content: "Seller console — Scrapify Auction" },
      { property: "og:description", content: "List scrap, run auctions, get paid." },
    ],
  }),
  component: SellerDashboard,
});

function SellerDashboard() {
  const { loading, primaryRole, user } = useAuth();

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  if (primaryRole !== "seller" && primaryRole !== "admin")
    return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Seller console
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground">
              {user?.user_metadata?.full_name || user?.email}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              List new lots, monitor auctions and download payouts.
            </p>
          </div>
          <Link
            to="/seller"
            className="rounded-full bg-[color:var(--auction)] px-5 py-2 text-sm font-semibold text-white"
          >
            + New lot
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <Stat icon={PackagePlus} label="Draft lots" value="0" />
          <Stat icon={Factory} label="Live auctions" value="0" />
          <Stat icon={TrendingUp} label="Lifetime GMV" value="₹0" />
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            You haven't listed any lots yet. Publish one to start receiving bids.
          </p>
        </div>
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