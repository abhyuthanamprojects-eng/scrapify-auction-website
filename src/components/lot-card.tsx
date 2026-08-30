import { Link } from "@tanstack/react-router";
import { Clock, Users, MapPin, ArrowDownLeft, Heart, FileText, CalendarClock } from "lucide-react";
import type { Lot } from "@/lib/mock-lots";
import { formatINR, timeLeft } from "@/lib/mock-lots";
import { useTick } from "@/hooks/use-tick";
import { toggleInterested } from "@/lib/registration-store";
import { useInterested } from "@/hooks/use-registration";

export function LotCard({ lot, onDetails }: { lot: Lot; onDetails?: (lot: Lot) => void }) {
  useTick(1000);
  const t = timeLeft(lot.endsAt);
  const isLive = lot.status === "live";
  const isReverse = lot.auctionType === "reverse";
  const interestedIds = useInterested();
  const isInterested = interestedIds.includes(lot.id);

  // Derive a plausible start time from endsAt (mock only): 7 days before end
  const startsAt = lot.endsAt - 7 * 24 * 60 * 60 * 1000;
  const fmt = (ms: number) =>
    new Date(ms).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <Link
      to="/lots/$id"
      params={{ id: lot.id }}
      className="group card-soft block overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={lot.image}
          alt={lot.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              <span className="live-dot" /> Live
            </span>
          )}
          {isReverse && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--accent-blue)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              <ArrowDownLeft className="h-3 w-3" /> Reverse
            </span>
          )}
        </div>
        <div
          className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${
            t.urgent ? "bg-[color:var(--auction)]" : "bg-black/60 backdrop-blur"
          }`}
        >
          <Clock className="h-3 w-3" /> {t.label}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5">{lot.category}</span>
          <span>{lot.id}</span>
        </div>
        <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-semibold text-foreground">
          {lot.title}
        </h3>

        <div className="mt-2 flex flex-col gap-0.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            <span>Start: <span className="text-foreground/80">{fmt(startsAt)}</span></span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            <span>End: <span className="text-foreground/80">{fmt(lot.endsAt)}</span></span>
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {isReverse ? "Current L1" : "Highest bid"}
            </div>
            <div className="font-display text-xl font-extrabold text-[color:var(--navy)]">
              {formatINR(lot.currentBid)}
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center justify-end gap-1">
              <Users className="h-3 w-3" /> {lot.bidders} bidders
            </div>
            <div className="mt-1 flex items-center justify-end gap-1">
              <MapPin className="h-3 w-3" /> {lot.location}
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={stop(() => toggleInterested(lot.id))}
            aria-pressed={isInterested}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              isInterested
                ? "border-[color:var(--auction)] bg-[color:var(--auction)]/10 text-[color:var(--auction)]"
                : "border-border bg-card text-foreground hover:border-[color:var(--auction)]/60"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isInterested ? "fill-current" : ""}`} />
            {isInterested ? "Interested" : "Not interested"}
          </button>
          <button
            type="button"
            onClick={stop(() => onDetails?.(lot))}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-[color:var(--navy)]/40"
          >
            <FileText className="h-3.5 w-3.5" />
            Catalogue
          </button>
        </div>
      </div>
    </Link>
  );
}