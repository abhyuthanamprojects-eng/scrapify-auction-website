import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });
function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-semibold text-[color:var(--auction)]">
          ← Marketplace
        </Link>
        <h1 className="mt-8 font-display text-4xl font-bold">Privacy policy</h1>
        <p className="mt-4 text-muted-foreground">
          Scrapify Auctions processes account, business verification and transaction data only for
          platform operation, compliance and support. Contact support for data-access or deletion
          requests.
        </p>
      </div>
    </main>
  );
}
