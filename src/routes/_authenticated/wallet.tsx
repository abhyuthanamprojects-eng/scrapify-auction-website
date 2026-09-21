import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Download, Wallet as WalletIcon, Lock, RefreshCcw, Plus, Loader2, Upload } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VendorStatusBanner } from "@/components/vendor-status-banner";
import { api } from "@/lib/api-client";
import { formatINR } from "@/lib/auction-data";
import { EMD_LABEL } from "@/lib/customer-flow";
import { useCallback, useRef, useState } from "react";

const PRESET_AMOUNTS = [1000, 5000, 10000, 25000];

export const Route = createFileRoute("/_authenticated/wallet")({
  loader: async () => {
    const [wallet, emd, txns, config] = await Promise.all([
      api.getWallet().catch(() => ({ data: { balance_inr: 0 } })),
      api.getEmd().catch(() => ({ data: [] })),
      api.getWalletTransactions().catch(() => ({ data: [] })),
      api.getPlatformConfig().catch(() => ({})),
    ]);
    return {
      wallet: wallet.data ?? wallet,
      emdRows: Array.isArray(emd.data) ? emd.data : [],
      txns: Array.isArray(txns.data) ? txns.data : [],
      bankDetails: (config as any)?.registration_bank_details ?? {},
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
  const { wallet, emdRows, txns, bankDetails } = Route.useLoaderData() as {
    wallet: Record<string, any>;
    emdRows: Record<string, any>[];
    txns: Record<string, any>[];
    bankDetails: Record<string, string>;
  };
  const router = useRouter();
  const blocked = emdRows
    .filter((row) => ["confirmed", "held", "locked"].includes(String(row.status ?? row.state)))
    .reduce((s, row) => s + Number(row.amount_inr ?? row.amount ?? 0), 0);
  const credits = txns
    .filter((t) => String(t.type ?? t.kind) === "credit")
    .reduce((s, t) => s + Number(t.amount_inr ?? t.amount ?? 0), 0);

  const [showAddMoney, setShowAddMoney] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <VendorStatusBanner />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              Wallet &amp; EMD ledger
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every EMD hold, release and refund mirrored from finance.
            </p>
          </div>
          {
            <button
              onClick={() => setShowAddMoney(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Add Money
            </button>
          }
        </div>

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

      {showAddMoney && (
        <AddMoneyModal
          bankDetails={bankDetails}
          onClose={() => setShowAddMoney(false)}
          onSuccess={() => {
            setShowAddMoney(false);
            router.invalidate();
          }}
        />
      )}
    </div>
  );
}

function AddMoneyModal({ bankDetails, onClose, onSuccess }: { bankDetails: Record<string, string>; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);

  const numericAmount = parseFloat(amount) || 0;

  const handlePay = useCallback(async () => {
    if (numericAmount < 1) {
      setError("Enter an amount of at least ₹1");
      return;
    }
    setError("");
    setBusy(true);

    try {
      if (!proof) throw new Error("Upload the bank-transfer proof first");
      const form = new FormData();
      form.append("purpose", "wallet_topup");
      form.append("amount", String(numericAmount));
      form.append("proof", proof);
      if (transactionId.trim()) form.append("transaction_id", transactionId.trim());
      await api.requestManualPayment(form);
      setSuccess("Proof submitted. Wallet credit will be added after admin verification.");
      setBusy(false);
      setTimeout(() => onSuccess(), 1800);
    } catch (e: any) {
      setError(e?.message || "Could not initiate payment. Try again.");
      setBusy(false);
    }
  }, [numericAmount, onSuccess]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current && !busy) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
        <h3 className="font-display text-xl font-bold text-foreground">Add Money to Wallet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Transfer the amount to the bank account below and upload the payment proof. Admin verification is required.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-sm">
          <div className="font-semibold">{bankDetails.bank_name}</div>
          <div>{bankDetails.account_name}</div>
          <div>A/C: {bankDetails.account_number} · IFSC: {bankDetails.ifsc}</div>
          <div>{bankDetails.branch}</div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-foreground">Amount (₹)</label>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(""); setSuccess(""); }}
            placeholder="Enter amount"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-lg font-display font-bold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:border-[color:var(--auction)] focus:outline-none focus:ring-1 focus:ring-[color:var(--auction)]"
            disabled={busy}
            autoFocus
          />
        </div>

        <input className="mt-4 block w-full text-sm" type="file" accept="image/*,.pdf" onChange={(e) => setProof(e.target.files?.[0] ?? null)} disabled={busy} />
        <input className="mt-3 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm" placeholder="Transaction ID (optional)" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} disabled={busy} />

        <div className="mt-3 flex flex-wrap gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              onClick={() => { setAmount(String(preset)); setError(""); setSuccess(""); }}
              disabled={busy}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                numericAmount === preset
                  ? "border-[color:var(--auction)] bg-[color:var(--auction)]/10 text-[color:var(--auction)]"
                  : "border-border text-muted-foreground hover:border-[color:var(--auction)] hover:text-foreground"
              }`}
            >
              {formatINR(preset)}
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm font-medium text-emerald-600">{success}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={busy || numericAmount < 1}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--auction)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletIcon className="h-4 w-4" />}
            {busy ? "Submitting…" : <><Upload className="h-4 w-4" /> Submit proof</>}
          </button>
        </div>
      </div>
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
