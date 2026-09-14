import { Rocket } from "lucide-react";

export function ComingSoon({ feature }: { feature: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-[color:var(--accent-blue)]/10 bg-gradient-to-br from-[color:var(--accent-blue)]/[.06] to-[color:var(--auction)]/[.06]">
          <Rocket className="h-11 w-11 text-[color:var(--accent-blue)]/50" />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[color:var(--accent-blue)]/40">
          We&apos;re Still
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
          Cooking This Feature.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {feature} is coming soon. Stay tuned for updates.
        </p>
        <div className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-[color:var(--navy)] px-7 py-3.5 text-sm font-bold text-white">
          <Rocket className="h-4 w-4" />
          Coming Soon
        </div>
      </div>
    </div>
  );
}
