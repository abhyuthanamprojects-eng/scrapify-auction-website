import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Bell, LogOut, LayoutDashboard, Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";

export function SiteHeader() {
  const { user, primaryRole, loading } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const signOut = async () => {
    await api.logout();
    window.dispatchEvent(new CustomEvent("scrapify:auth"));
    navigate({ to: "/", replace: true });
  };

  const dashHref = primaryRole === "seller" ? "/console" : "/portal";
  const nav = user
    ? primaryRole === "seller"
      ? [{ to: "/", label: "Marketplace" }, { to: "/console", label: "Seller workspace" }, { to: "/console/events", label: "My auctions" }]
      : [{ to: "/", label: "Marketplace" }, { to: "/portal", label: "Buyer workspace" }, { to: "/my-bids", label: "My bids" }]
    : [{ to: "/", label: "Marketplace" }];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-[color:var(--navy)] text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white">
            <img src="/scrapify-auction-app-icon.png" alt="Scrapify Auctions" className="h-full w-full object-contain" />
          </span>
          Scrapify<span className="text-[color:var(--gold-soft)]">Auctions</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
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
          {user && <Link to="/notifications" aria-label="Notifications" className="grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10"><Bell className="h-4 w-4" /></Link>}
          {loading ? null : user ? (
            <>
              <Link
                to={dashHref}
                className="hidden items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/90 hover:bg-white/5 sm:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4" />
                {primaryRole === "seller" ? "Seller workspace" : "Buyer workspace"}
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
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="border-t border-white/10 px-4 py-3 md:hidden">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white">
              {item.label}
            </Link>
          ))}
          {!user && <><Link to="/terms" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10">Terms</Link><Link to="/privacy" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10">Privacy</Link><Link to="/contact" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10">Contact</Link></>}
        </nav>
      )}
    </header>
  );
}
