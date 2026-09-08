import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: () => <LegalPage title="Terms of use" />,
});

function LegalPage({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-semibold text-[color:var(--auction)]">
          ← Marketplace
        </Link>
        <h1 className="mt-8 font-display text-4xl font-bold">{title}</h1>
        <p className="mt-4 text-muted-foreground">
          This policy page is maintained by Scrapify Auctions. Please contact support for the
          current applicable terms and commercial conditions.
        </p>
      </div>
    </main>
  );
}
