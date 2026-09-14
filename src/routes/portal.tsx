import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Gavel, ShieldCheck, Store, PackageCheck, FileText, Award, UserCircle } from "lucide-react";
import { requireRole } from "@/lib/route-guards";
import { PendingReviewWorkspace } from "@/components/kyc-required";

export const Route = createFileRoute("/portal")({
  ssr: false,
  beforeLoad: ({ location }) => requireRole(location, ["buyer"]),
  component: PortalLayout,
});

function PortalLayout() {
  const { pathname } = useLocation();
  const { user } = Route.useRouteContext();

  const VENDOR_NAV = [
    { to: "/portal", label: "My Invitations & Bids", exact: true },
    { to: "/portal/orders", label: "My Orders & Gate Passes" },
    { to: "/portal/documents", label: "My Documents" },
    { to: "/portal/performance", label: "My Scorecard" },
    { to: "/portal/profile", label: "My Profile" },
  ];

  const companyName = user?.vendor?.company_name || user?.organization?.name || user?.name || user?.email || "Vendor Workspace";
  const isVerified = user?.vendor?.status === "approved";

  if (!isVerified) {
    return <PendingReviewWorkspace companyName={companyName} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-[color:var(--navy)] text-white shadow-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3.5 sm:px-6">
          <Link to="/portal" className="flex items-center gap-2 font-display text-sm font-bold">
            <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-white shadow-sm">
              <img src="/scrapify-auction-app-icon.png" alt="Scrapify Portal" className="h-full w-full object-contain" />
            </span>
            <span>
            Scrapify<span className="text-[color:var(--gold-soft)]">Buyer</span>
            <span className="block text-[9px] font-medium tracking-wider uppercase text-white/50">
                Buyer Workspace
              </span>
            </span>
          </Link>

          <span className="ml-auto hidden items-center gap-1.5 text-xs text-white/80 sm:flex bg-white/10 px-3 py-1 rounded-full">
            <ShieldCheck className={`h-3.5 w-3.5 ${isVerified ? "text-[color:var(--success)]" : "text-[color:var(--gold-soft)]"}`} />
            {companyName} {isVerified ? "• Verified" : "• Verification pending"}
          </span>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            <Store className="h-3.5 w-3.5" />
            Marketplace
          </Link>
        </div>

        <nav className="mx-auto flex max-w-[1400px] gap-1 px-4 pb-2.5 sm:px-6 overflow-x-auto">
          {VENDOR_NAV.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  active ? "bg-white/20 text-white shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
