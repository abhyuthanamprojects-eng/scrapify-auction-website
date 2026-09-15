import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

export type LegalSection = {
  id: string;
  heading: string;
  body: ReactNode;
};

/**
 * Mobile opens these same URLs in an in-app browser with `?embed=1`, which
 * drops the marketplace chrome so the document sits on its own.
 *
 * Resolved after mount, not during render: the server has no `window`, and
 * deciding during render would bake the server's answer into the hydrated tree.
 */
export function useIsEmbedded(): boolean {
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    setEmbedded(new URLSearchParams(window.location.search).get("embed") === "1");
  }, []);
  return embedded;
}

export function LegalPage({
  title,
  intro,
  updated,
  sections,
  footer,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
  footer?: ReactNode;
}) {
  const embed = useIsEmbedded();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-[color:var(--navy)] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          {!embed && (
            <Link
              to="/"
              className="text-sm font-semibold text-white/70 transition-colors hover:text-white"
            >
              ← Marketplace
            </Link>
          )}
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">{intro}</p>
          <p className="mt-4 text-xs uppercase tracking-widest text-white/50">
            Last updated {updated}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <nav aria-label="On this page" className="mb-10 rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            On this page
          </p>
          <ol className="mt-3 space-y-1.5">
            {sections.map((s, i) => (
              <li key={s.id} className="text-sm">
                <a
                  href={`#${s.id}`}
                  className="text-[color:var(--auction)] hover:underline"
                >
                  {i + 1}. {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-6">
              <h2 className="font-display text-xl font-bold tracking-tight">
                <span className="mr-2 text-[color:var(--auction)]">{i + 1}.</span>
                {s.heading}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-[color:var(--auction)] [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-1.5">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        {footer && (
          <div className="mt-12 rounded-xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
            {footer}
          </div>
        )}

        {!embed && (
          <footer className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground">Terms &amp; Conditions</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/refund" className="hover:text-foreground">Refund Policy</Link>
            <Link to="/help" className="hover:text-foreground">Help &amp; Support</Link>
            <span className="ml-auto">© {new Date().getFullYear()} Scrapify Auctions</span>
          </footer>
        )}
      </div>
    </main>
  );
}
