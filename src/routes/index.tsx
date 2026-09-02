import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Gavel, Truck, Scale, TrendingUp, Factory, Search, X, MapPin, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { LotCard } from "@/components/lot-card";
import { formatINR, getAuctions, getCategories, type Lot } from "@/lib/auction-data";
import { useRegistration } from "@/hooks/use-registration";
import heroImg from "@/assets/hero-scrapyard.jpg";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [lots, categories] = await Promise.all([getAuctions(), getCategories()]);
    return { lots, categories };
  },
  head: () => ({
    meta: [
      { title: "Scrapify Auctions — Multi-Category Auction & Sourcing Platform" },
      {
        name: "description",
        content:
          "Bid live on verified industrial assets, scrap, machinery, fleet contracts, facility management and IT hardware. KYC-secured, EMD-locked auctions.",
      },
      { property: "og:title", content: "Scrapify Auctions — Multi-Category Auction & Sourcing Platform" },
      {
        property: "og:description",
        content:
          "Forward & reverse auctions, RFx, and rate contracts for enterprise and PSU buyers and sellers.",
      },
    ],
  }),
  component: Marketplace,
});

type Segment = "live" | "upcoming" | "ended";

function Marketplace() {
  const { lots, categories } = Route.useLoaderData();
  const [segment, setSegment] = useState<Segment>("live");
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("All");
  const [detailsLot, setDetailsLot] = useState<Lot | null>(null);
  const { state } = useRegistration();
  const pending = state.paymentSubmitted && !state.approved;

  const locations = useMemo(
    () => ["All", ...Array.from(new Set(lots.map((l) => l.location).filter(Boolean)))],
    [lots],
  );

  const filtered = useMemo(() => {
    return lots.filter(
      (l) =>
        l.status === segment &&
        (category === "All" || l.category === category) &&
        (location === "All" || l.location === location) &&
        (query.trim() === "" ||
          l.title.toLowerCase().includes(query.toLowerCase()) ||
          l.id.toLowerCase().includes(query.toLowerCase()) ||
          l.seller.toLowerCase().includes(query.toLowerCase())),
    );
  }, [lots, segment, category, location, query]);

  const liveCount = lots.filter((l) => l.status === "live").length;
  const totalGmv = lots.reduce((s, l) => s + l.currentBid, 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {pending && (
        <div className="border-b border-amber-500/40 bg-amber-500/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm text-amber-900 sm:px-6">
            <span>
              <b>Verification Pending</b> — bidding stays locked until an admin approves
              your KYC.
            </span>
            <Link to="/register" className="font-semibold underline">
              Check status
            </Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-[color:var(--navy)] text-white">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt=""
            className="h-full w-full object-cover opacity-30"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--navy)] via-[color:var(--navy)]/85 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/80 backdrop-blur">
              <span className="live-dot" /> {liveCount} auctions live now
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Enterprise sourcing
              <br />
              &amp; auctions, <span className="text-[color:var(--auction)]">live</span> and
              transparent.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/70">
              Forward &amp; reverse auctions, RFx, and contracts for scrap, machinery, fleet
              logistics, facility management, and IT hardware. Verified sellers, EMD-locked bidding,
              and tamper-proof settlements.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/console"
                className="rounded-full bg-[color:var(--auction)] px-6 py-3 text-sm font-semibold shadow-[0_10px_30px_-10px_rgba(249,115,22,0.7)] transition-colors hover:brightness-110"
              >
                Open Enterprise Console
              </Link>
              <Link
                to="/portal"
                className="rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                Vendor Bidding Portal
              </Link>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <Stat label="Live now" value={String(liveCount)} />
              <Stat label="Cumulative bids" value={"₹" + (totalGmv / 100000).toFixed(1) + "L"} />
              <Stat label="Verified enterprises" value="240+" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-around gap-6 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          {[
            { icon: ShieldCheck, label: "Strict KYC & EMD" },
            { icon: Gavel, label: "Forward + reverse auctions" },
            { icon: Scale, label: "Weighbridge verified" },
            { icon: Truck, label: "End-to-end pickup" },
            { icon: Factory, label: "PSU & enterprise sellers" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <t.icon className="h-4 w-4 text-[color:var(--auction)]" />
              <span className="font-medium text-foreground/80">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Marketplace */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-foreground">
              Auction floor
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time inventory across ferrous, non-ferrous, e-waste and IT assets.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {(["live", "upcoming", "ended"] as Segment[]).map((s) => (
              <button
                key={s}
                onClick={() => setSegment(s)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  segment === s
                    ? "bg-[color:var(--navy)] text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "live" && <span className="live-dot mr-2 align-middle" />}
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Filter / search bar (web-only enhancement) */}
        <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, auction no. or seller"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All categories" : c}
              </option>
            ))}
          </select>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-full border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            {locations.map((l) => (
              <option key={l} value={l}>
                {l === "All" ? "All locations" : l}
              </option>
            ))}
          </select>
        </div>

        {/* Category chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? "border-[color:var(--auction)] bg-[color:var(--auction)]/10 text-[color:var(--auction)]"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid: 3 desktop / 2 tablet / 1 mobile */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lot) => (
            <LotCard key={lot.id} lot={lot} onDetails={setDetailsLot} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No {segment} auctions in this category right now.
            </p>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-extrabold text-foreground">
            How Scrapify works
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            One transparent lifecycle from lot creation to recycling certificate.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Verify", d: "KYC with GST, PAN, licence & bank proof. Approved once — bid on any lot." },
              { n: "02", t: "Lock EMD", d: "Refundable deposit locks from your wallet before your first bid on a lot." },
              { n: "03", t: "Bid live", d: "Forward or reverse rooms with auto-extension, quick bids and auto-bid caps." },
              { n: "04", t: "Lift & certify", d: "Pay balance, schedule pickup, weighbridge verify, download recycling certificate." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-background p-6">
                <div className="font-display text-3xl font-extrabold text-[color:var(--auction)]">
                  {s.n}
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                  {s.t}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-[color:var(--navy)] text-white/70">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:px-6">
          <div className="font-display text-white">
            © {new Date().getFullYear()} Scrapify Auction
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
      {detailsLot && (
        <CatalogueDrawer lot={detailsLot} onClose={() => setDetailsLot(null)} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-extrabold text-white">{value}</div>
      <div className="text-xs uppercase tracking-wider text-white/60">{label}</div>
    </div>
  );
}

function CatalogueDrawer({ lot, onClose }: { lot: Lot; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const startsAt = lot.startsAt;
  const fmt = (ms: number) =>
    new Date(ms).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        aria-label="Close catalogue"
        onClick={onClose}
        className="flex-1 bg-black/50 backdrop-blur-sm"
      />
      <aside className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Catalogue · {lot.id}
            </div>
            <div className="font-display text-lg font-extrabold text-foreground">
              {lot.title}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <img src={lot.image} alt={lot.title} className="h-64 w-full object-cover" />

        <div className="space-y-5 p-6">
          <p className="text-sm text-muted-foreground">{lot.description}</p>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Row label="Category" value={lot.category} />
            <Row label="Condition" value={lot.condition} />
            <Row label="Weight" value={lot.weight} />
            <Row label="Location" value={lot.location} icon={MapPin} />
            <Row label="Seller" value={lot.seller} />
            <Row
              label="Auction Type"
              value={lot.auctionType === "reverse" ? "Reverse" : "Forward"}
            />
            <Row label="Starts" value={fmt(startsAt)} icon={Clock} />
            <Row label="Ends" value={fmt(lot.endsAt)} icon={Clock} />
            <Row label="Reserve" value={formatINR(lot.reserve)} />
            <Row label="Increment" value={formatINR(lot.increment)} />
            <Row label="EMD" value={formatINR(lot.emd)} />
            <Row label={lot.auctionType === "reverse" ? "Current L1" : "Highest bid"} value={formatINR(lot.currentBid)} />
          </dl>

          <Link
            to="/lots/$id"
            params={{ id: lot.id }}
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.7)] hover:brightness-110"
          >
            Open full lot page
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value}
      </dd>
    </div>
  );
}
