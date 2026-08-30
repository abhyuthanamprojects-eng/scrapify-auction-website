import { Link, useLocation } from "@tanstack/react-router";
import { Home, Gavel, Wallet, Bell, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFlow } from "@/hooks/use-flow";

/**
 * App-style bottom tab bar for phones. Hidden from md upwards, where the
 * header navigation takes over.
 */
export function MobileTabBar() {
  const { user } = useAuth();
  const flow = useFlow();
  const unread = flow.notices.filter((n) => !n.read).length;
  const { pathname } = useLocation();

  const tabs = user
    ? [
        { to: "/", label: "Market", Icon: Home },
        { to: "/dashboard", label: "My bids", Icon: Gavel },
        { to: "/wallet", label: "Wallet", Icon: Wallet },
        { to: "/notifications", label: "Alerts", Icon: Bell, badge: unread },
      ]
    : [
        { to: "/", label: "Market", Icon: Home },
        { to: "/register", label: "Register", Icon: UserPlus },
        { to: "/auth", label: "Sign in", Icon: Gavel },
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch">
        {tabs.map(({ to, label, Icon, badge }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  active ? "text-[color:var(--auction)]" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
                {badge ? (
                  <span className="absolute right-1/2 top-1.5 translate-x-4 rounded-full bg-[color:var(--auction)] px-1 text-[10px] font-bold leading-4 text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
