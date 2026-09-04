import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Gavel,
  CheckCircle2,
  PackageCheck,
  Wallet,
  Truck,
  MessageSquareWarning,
  Users,
  BarChart3,
  Building2,
  ScrollText,
  Plus,
  Bell,
  Search,
  ShieldCheck,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { STATE_LABEL, type EventState } from "@/lib/enterprise";
import { api } from "@/lib/api-client";

const NAV = [
  { to: "/console", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { to: "/console/events", label: "Sourcing events", Icon: Gavel },
  { to: "/console/approvals", label: "Approvals & Decision Pack", Icon: CheckCircle2 },
  { to: "/console/orders", label: "Orders & Contracts", Icon: PackageCheck },
  { to: "/console/finance", label: "Finance & EMD Escrow", Icon: Wallet },
  { to: "/console/fulfilment", label: "Fulfilment & Gate Passes", Icon: Truck },
  { to: "/console/disputes", label: "Disputes & Claims", Icon: MessageSquareWarning },
  { to: "/console/vendors", label: "Vendor Directory", Icon: Users },
  { to: "/console/reports", label: "Reports & Analytics", Icon: BarChart3 },
  { to: "/console/organisation", label: "Organisation & Approval Matrix", Icon: Building2 },
  { to: "/console/audit", label: "SOC2 Audit Trail", Icon: ScrollText },
];

export function ConsoleShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ type: string; id: string; title: string; link: string }>
  >([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      return;
    }
    let active = true;
    Promise.all([
      api.getAuctions({ search: query, per_page: "5" }),
      api.getOrders({ search: query, per_page: "5" }),
      api.getVendors({ search: query, per_page: "5" }),
    ])
      .then(([events, orders, vendors]) => {
        if (!active) return;
        const rows = (response: any) => (Array.isArray(response?.data) ? response.data : []);
        setSearchResults(
          [
            ...rows(events).map((e: any) => ({
              type: "Event",
              id: String(e.code ?? e.id),
              title: String(e.title ?? e.code),
              link: `/console/events/${e.code ?? e.id}`,
            })),
            ...rows(orders).map((o: any) => ({
              type: "Order",
              id: String(o.code ?? o.id),
              title: String(o.title ?? o.order_number ?? o.code),
              link: "/console/orders",
            })),
            ...rows(vendors).map((v: any) => ({
              type: "Vendor",
              id: String(v.code ?? v.id),
              title: String(v.company_name ?? v.name ?? v.code),
              link: "/console/vendors",
            })),
          ].slice(0, 6),
        );
      })
      .catch(() => {
        if (active) setSearchResults([]);
      });
    return () => {
      active = false;
    };
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1600px]">
        {/* Left Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-[color:var(--navy)] text-white lg:flex">
          <Link
            to="/console"
            className="flex items-center gap-2 px-5 py-5 font-display text-base font-bold"
          >
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white shadow-md">
              <img src="/scrapify-auction-app-icon.png" alt="Scrapify Source" className="h-full w-full object-contain" />
            </span>
            <span>
              Scrapify<span className="text-[color:var(--gold-soft)]">Source</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                Enterprise Sourcing Portal
              </span>
            </span>
          </Link>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
            {NAV.map(({ to, label, Icon, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-white/10 font-semibold text-white shadow-sm"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 px-5 py-4 text-xs text-white/60">
            <div className="flex items-center gap-2 text-white/80 font-medium">
              <ShieldCheck className="h-4 w-4 text-[color:var(--success)]" />
              SOC2 & ISO 27001 Active
            </div>
            <p className="mt-1 text-[11px] text-white/50">
              All auction bids & awards are cryptographically signed.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/80"
            >
              <Search className="h-4 w-4" />
              <span className="w-40 text-left sm:w-64">Search events, vendors, orders...</span>
              <kbd className="hidden rounded bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline-block">
                ⌘K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <Link
                to="/console/events/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--auction)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
              >
                <Plus className="h-4 w-4" />
                Create event
              </Link>

              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifications"
                  className="relative grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--auction)] px-1 text-[10px] font-bold text-white">
                    3
                  </span>
                </button>

                {/* Notifications Flyout */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <span className="font-display text-sm font-bold">Actionable Notices</span>
                      <span className="text-[11px] text-[color:var(--auction)] font-semibold">
                        3 Unread
                      </span>
                    </div>
                    <div className="mt-3 space-y-2.5 text-xs">
                      <div className="rounded-lg bg-muted/60 p-2.5">
                        <div className="font-semibold text-foreground">Award Approval Required</div>
                        <p className="text-muted-foreground mt-0.5">
                          FWD-2026-0341 closed at ₹94.20 L (H1). Awaiting CPO sign-off.
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-2.5">
                        <div className="font-semibold text-foreground">Anti-Sniping Triggered</div>
                        <p className="text-muted-foreground mt-0.5">
                          REV-2026-0118 extended by 5 mins due to T-3m bid.
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-2.5">
                        <div className="font-semibold text-foreground">Gate Pass Generated</div>
                        <p className="text-muted-foreground mt-0.5">
                          Vehicle MH-04-AB-1290 checked in at Plot 48 plant yard.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Pill */}
              <div className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm sm:flex bg-muted/30">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--navy)] text-[11px] font-bold text-white">
                  BP
                </span>
                <span className="font-medium text-xs">R. Iyer</span>
                <span className="text-[11px] text-muted-foreground">Admin & Event Owner</span>
              </div>
            </div>
          </header>

          {/* Global Search Dialog Modal */}
          {searchOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-4 shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sourcing events, orders, contracts, vendors..."
                    className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
                  />
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-1">
                  {searchResults.length > 0 ? (
                    searchResults.map((r, i) => (
                      <Link
                        key={i}
                        to={r.link}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between rounded-lg p-2.5 text-sm hover:bg-muted transition-colors"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--auction)] bg-[color:var(--auction)]/10 px-2 py-0.5 rounded mr-2">
                            {r.type}
                          </span>
                          <span className="font-semibold text-foreground">{r.title}</span>
                          <span className="block text-xs text-muted-foreground ml-1">{r.id}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))
                  ) : searchQuery.trim() ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No matches found for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      Type to search across all Scrapify enterprise lots, vendors, and fulfilment
                      orders.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <main className="px-4 py-6 pb-24 sm:px-6 lg:pb-10">{children}</main>

          {/* Bottom Mobile Tab Bar */}
          <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur lg:hidden">
            {NAV.slice(0, 5).map(({ to, label, Icon, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                    active ? "text-[color:var(--auction)] font-bold" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label.split(" ")[0]}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

export function PageHead({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  desc,
  actions,
  children,
  className = "",
}: {
  title?: string;
  desc?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
          <div>
            {title && <h2 className="font-display text-sm font-bold">{title}</h2>}
            {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Kpi({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {delta && <span className="font-semibold text-[color:var(--success)]">{delta} </span>}
        {hint}
      </p>
    </div>
  );
}

const STATE_STYLE: Record<EventState, string> = {
  draft: "bg-muted text-muted-foreground",
  validated: "bg-secondary text-secondary-foreground",
  published: "bg-[color:var(--accent-blue)]/12 text-[color:var(--accent-blue)]",
  invited: "bg-[color:var(--accent-blue)]/12 text-[color:var(--accent-blue)]",
  live: "bg-[color:var(--auction)]/15 text-[color:var(--auction)]",
  paused: "bg-[color:var(--gold-soft)]/25 text-[color:var(--auction)]",
  closed: "bg-muted text-muted-foreground",
  evaluation: "bg-[color:var(--accent-blue)]/12 text-[color:var(--accent-blue)]",
  approval: "bg-[color:var(--gold-soft)]/25 text-[color:var(--auction)]",
  awarded: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
  cancelled: "bg-destructive/12 text-destructive",
};

export function StateBadge({ state }: { state: EventState }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATE_STYLE[state]}`}
    >
      {state === "live" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {STATE_LABEL[state]}
    </span>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "good" | "warn" | "bad";
}) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    good: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
    warn: "bg-[color:var(--gold-soft)]/25 text-[color:var(--auction)]",
    bad: "bg-destructive/12 text-destructive",
  } as const;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            {head.map((h) => (
              <th key={h} className="pb-2.5 pr-4 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}
