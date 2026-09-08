import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({ component: ContactPage });
function ContactPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-semibold text-[color:var(--auction)]">
          ← Marketplace
        </Link>
        <h1 className="mt-8 font-display text-4xl font-bold">Contact Scrapify</h1>
        <p className="mt-4 text-muted-foreground">
          For account, auction or verification support, contact the Scrapify operations team through
          your authenticated workspace or email support@scrapifyauctions.com.
        </p>
      </div>
    </main>
  );
}
