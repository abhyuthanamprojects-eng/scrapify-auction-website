import { Link, useNavigate } from "@tanstack/react-router";
import { Gavel, Search, Bell, LogOut, LayoutDashboard, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFlow } from "@/hooks/use-flow";
import { api } from "@/lib/api-client";

export function SiteHeader() {
  const { user, primaryRole, loading } = useAuth();
  const flow = useFlow();
  const unread = flow.notices.filter((n) => !n.read).length;
  const navigate = useNavigate();

  const signOut = async () => {
    await api.logout();
    window.dispatchEvent(new CustomEvent("scrapify:auth"));
    navigate({ to: "/", replace: true });
  };

  const dashHref = primaryRole === "seller" || primaryRole === "admin" ? "/seller" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-[color:var(--navy)] text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--auction)]">
            <Gavel className="h-5 w-5" />
          </span>
          Scrapify<span className="text-[color:var(--gold-soft)]">Auctions</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { to: "/", label: "Marketplace" },
            { to: "/console", label: "Enterprise Console" },
            { to: "/portal", label: "Vendor Portal" },
            { to: "/console/events", label: "Events & RFx" },
            { to: "/console/reports", label: "Analytics" },
          ].map((n, i) => (
            <Link
              key={i}
              to={n.to}
              className="rounded-md px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/70 lg:flex">
            <Search className="h-4 w-4" />
            <input
              placeholder="Search lots, categories, sellers"
              className="w-56 bg-transparent placeholder:text-white/50 focus:outline-none"
            />
          </div>
          {user && (
            <Link
              to="/wallet"
              aria-label="Wallet"
              className="grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10"
            >
              <Wallet className="h-4 w-4" />
            </Link>
          )}
          <Link
            to={user ? "/notifications" : "/register"}
            aria-label="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--auction)] px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
          {loading ? null : user ? (
            <>
              <Link
                to={dashHref}
                className="hidden items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/90 hover:bg-white/5 sm:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4" />
                {primaryRole === "seller" || primaryRole === "admin" ? "Seller console" : "My dashboard"}
              </Link>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="hidden rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/90 hover:bg-white/5 sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[color:var(--auction)] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_20px_-10px_rgba(249,115,22,0.9)] transition-colors hover:brightness-110"
              >
                Register to bid
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
