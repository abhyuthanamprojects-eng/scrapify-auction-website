import { Link } from "@tanstack/react-router";

/** One list so the header menu, the site footer and the legal pages agree. */
export const LEGAL_LINKS = [
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/refund", label: "Refund Policy" },
  { to: "/help", label: "Help & Support" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[color:var(--navy)] text-white/70">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:px-6">
        <div className="font-display text-white">
          © {new Date().getFullYear()} Scrapify Auction
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {LEGAL_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
