import { Link } from "@tanstack/react-router";
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
          Complete your KYC &amp; business verification to access {feature}.
        </p>
        <Link
          to="/portal/profile"
          className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-[color:var(--navy)] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[color:var(--navy)]/20 transition hover:brightness-110"
        >
          <ShieldCheck className="h-4 w-4" />
          Start Verification
        </Link>
      </div>
    </div>
  );
}
