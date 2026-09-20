import { ShieldCheck } from "lucide-react";

export function KycRequired({ feature }: { feature: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-[color:var(--gold-soft)]/20 bg-gradient-to-br from-[color:var(--auction)]/[.06] to-[color:var(--gold-soft)]/[.06]">
          <ShieldCheck className="h-11 w-11 text-[color:var(--auction)]/60" />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[color:var(--auction)]/50">
          Verification Required
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
          Complete Your KYC
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your profile is under review. {feature} will be available after an administrator approves your KYC.
        </p>
        <div className="mt-8 inline-flex cursor-not-allowed items-center gap-2.5 rounded-full border border-border bg-muted px-7 py-3.5 text-sm font-bold text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Your profile is under review
        </div>
      </div>
    </div>
  );
}

export function PendingReviewWorkspace({ companyName }: { companyName: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-[color:var(--gold-soft)]/30 bg-card p-6 shadow-sm sm:p-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[color:var(--gold-soft)]/20 bg-[color:var(--auction)]/[.06]">
          <ShieldCheck className="h-10 w-10 text-[color:var(--auction)]/70" />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[color:var(--auction)]/60">Verification pending</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">Your profile is under review</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {companyName} is being reviewed by the Scrapify verification team. Please be patient while we verify every submitted detail. This normally takes 24–48 hours, and our team will contact you if anything else is required.
        </p>
        <div className="mt-8 inline-flex cursor-not-allowed items-center rounded-full border border-border bg-muted px-7 py-3.5 text-sm font-bold text-muted-foreground">
          Your profile is under review
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          You can continue browsing the marketplace and open your profile and documents. Bidding, orders, and other protected actions will unlock automatically after approval.
        </p>
      </div>
    </div>
  );
}
