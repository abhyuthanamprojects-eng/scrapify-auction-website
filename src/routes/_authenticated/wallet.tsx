import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Wallet as WalletIcon, Lock, RefreshCcw } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VendorStatusBanner } from "@/components/vendor-status-banner";
import { api } from "@/lib/api-client";
import { formatINR } from "@/lib/auction-data";
import { EMD_LABEL } from "@/lib/customer-flow";

export const Route = createFileRoute("/_authenticated/wallet")({
  loader: async () => {
    const [wallet, emd, txns] = await Promise.all([
      api.getWallet().catch(() => ({ data: { balance_inr: 0 } })),
      api.getEmd().catch(() => ({ data: [] })),
      api.getWalletTransactions().catch(() => ({ data: [] })),
    ]);
    return {
      wallet: wallet.data ?? wallet,
      emdRows: Array.isArray(emd.data) ? emd.data : [],
      txns: Array.isArray(txns.data) ? txns.data : [],
    };
  },
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
  const { wallet, emdRows, txns } = Route.useLoaderData() as {
    wallet: Record<string, any>;
    emdRows: Record<string, any>[];
    txns: Record<string, any>[];
  };
  const blocked = emdRows
    .filter((row) => ["confirmed", "held", "locked"].includes(String(row.status ?? row.state)))
    .reduce((s, row) => s + Number(row.amount_inr ?? row.amount ?? 0), 0);
  const credits = txns
    .filter((t) => String(t.type ?? t.kind) === "credit")
    .reduce((s, t) => s + Number(t.amount_inr ?? t.amount ?? 0), 0);

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
          <Card icon={WalletIcon} label="Available balance" value={formatINR(Number(wallet.balance_inr ?? wallet.balance ?? 0))} />
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
          {emdRows.length === 0 ? (
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
                {emdRows.map((p) => {
                  const lot = p.auction ?? {};
                  const lotId = String(p.auction_code ?? lot.code ?? "");
                  return (
                    <tr key={String(p.id ?? lotId)} className="border-t border-border">
                      <td className="px-5 py-3">
                        <Link
                          to="/lots/$id"
                          params={{ id: lotId }}
                          className="font-medium hover:underline"
                        >
                          {lotId}
                        </Link>
                        <div className="text-xs text-muted-foreground">{String(lot.title ?? "")}</div>
                      </td>
                      <td className="px-5 py-3 font-display font-bold">
                        {formatINR(Number(p.amount_inr ?? p.amount ?? 0))}
                      </td>
                      <td className="px-5 py-3">{EMD_LABEL[(p.status ?? p.state) as keyof typeof EMD_LABEL] ?? String(p.status ?? p.state ?? "Pending")}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {p.reference ?? p.payment_reference ?? "—"}
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
          {txns.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {txns.map((t) => (
                <li key={String(t.id)} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <div className="font-medium text-foreground">{String(t.label ?? t.description ?? "Wallet transaction")}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(String(t.at ?? t.created_at ?? Date.now())).toLocaleString("en-IN")} · {String(t.type ?? t.kind ?? "")}
                    </div>
                  </div>
                  <span
                    className={`font-display font-bold ${
                      String(t.type ?? t.kind) === "credit" ? "text-emerald-600" : "text-foreground"
                    }`}
                  >
                    {String(t.type ?? t.kind) === "credit" ? "+" : "-"}
                    {formatINR(Number(t.amount_inr ?? t.amount ?? 0))}
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
