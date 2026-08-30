import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Wallet as WalletIcon, Lock, RefreshCcw } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VendorStatusBanner } from "@/components/vendor-status-banner";
import { useFlow } from "@/hooks/use-flow";
import { getLot, formatINR } from "@/lib/mock-lots";
import { EMD_LABEL } from "@/lib/customer-flow";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet & EMD ledger — Scrapify Auction" },
      {
        name: "description",
        content:
          "Track your wallet balance, EMD blocked per auction, refunds, transactions and invoices.",
      },
      { property: "og:title", content: "Wallet & EMD ledger — Scrapify Auction" },
      {
        property: "og:description",
        content: "Balance, blocked EMD, refunds and downloadable statements.",
      },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const flow = useFlow();
  const rows = Object.values(flow.participation);
  const blocked = rows
    .filter((p) => p.emd === "confirmed")
    .reduce((s, p) => s + (getLot(p.lotId)?.emd ?? 0), 0);
  const credits = flow.txns
    .filter((t) => t.kind === "credit")
    .reduce((s, t) => s + t.amount, 0);
  const debits = flow.txns
    .filter((t) => t.kind === "debit")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <VendorStatusBanner />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          Wallet &amp; EMD ledger
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every EMD hold, release and refund mirrored from finance.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <Card icon={WalletIcon} label="Available balance" value={formatINR(Math.max(0, credits - debits))} />
          <Card icon={Lock} label="EMD blocked" value={formatINR(blocked)} />
          <Card icon={RefreshCcw} label="Refunds credited" value={formatINR(credits)} />
        </div>

        <div className="mt-10 card-soft overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="font-display text-lg font-bold">EMD by auction</h2>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-[color:var(--auction)]">
              <Download className="h-3.5 w-3.5" /> Statement (PDF)
            </button>
          </div>
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No auction participation yet.{" "}
              <Link to="/" className="underline">
                Browse auctions
              </Link>
              .
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2">Auction</th>
                  <th className="px-5 py-2">EMD</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2">Reference</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const lot = getLot(p.lotId);
                  return (
                    <tr key={p.lotId} className="border-t border-border">
                      <td className="px-5 py-3">
                        <Link
                          to="/lots/$id"
                          params={{ id: p.lotId }}
                          className="font-medium hover:underline"
                        >
                          {p.lotId}
                        </Link>
                        <div className="text-xs text-muted-foreground">{lot?.title}</div>
                      </td>
                      <td className="px-5 py-3 font-display font-bold">
                        {formatINR(lot?.emd ?? 0)}
                      </td>
                      <td className="px-5 py-3">{EMD_LABEL[p.emd]}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {p.reference ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-8 card-soft overflow-hidden">
          <div className="border-b border-border px-5 py-3">
            <h2 className="font-display text-lg font-bold">Transaction history</h2>
          </div>
          {flow.txns.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {flow.txns.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <div className="font-medium text-foreground">{t.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.at).toLocaleString("en-IN")} · {t.kind}
                    </div>
                  </div>
                  <span
                    className={`font-display font-bold ${
                      t.kind === "credit" ? "text-emerald-600" : "text-foreground"
                    }`}
                  >
                    {t.kind === "credit" ? "+" : "−"}
                    {formatINR(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="card-soft p-6">
      <Icon className="h-5 w-5 text-[color:var(--auction)]" />
      <div className="mt-3 font-display text-3xl font-extrabold text-foreground">
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
