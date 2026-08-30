import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Gavel, Link2Off, TimerOff } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { LOTS, formatINR } from "@/lib/mock-lots";
import { lotType } from "@/lib/customer-flow";

/** Token links issued by the auctioneer: /join/<lotId>-<view|bid>[-expired|-revoked] */
export const Route = createFileRoute("/join/$token")({
  head: () => ({
    meta: [
      { title: "Auction invite — Scrapify Auction" },
      {
        name: "description",
        content:
          "Open a shared auction access link. View-only or bid access, subject to expiry and revocation.",
      },
      { property: "og:title", content: "Auction invite — Scrapify Auction" },
      { property: "og:description", content: "Shared auction access link." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JoinToken,
});

function JoinToken() {
  const { token } = Route.useParams();
  const parts = token.split("-");
  const flag = parts[parts.length - 1];
  const state =
    flag === "expired" ? "Expired" : flag === "revoked" ? "Revoked" : "Active";
  const access = token.includes("bid") ? "Can Bid" : "View Only";
  const lot = LOTS.find((l) => token.toUpperCase().includes(l.id)) ?? LOTS[0];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="card-soft p-8">
          {state !== "Active" ? (
            <div className="text-center">
              {state === "Expired" ? (
                <TimerOff className="mx-auto h-8 w-8 text-destructive" />
              ) : (
                <Link2Off className="mx-auto h-8 w-8 text-destructive" />
              )}
              <h1 className="mt-3 font-display text-2xl font-extrabold">
                This invite link is {state.toLowerCase()}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask the auctioneer for a fresh link, or register as a bidder for full
                access.
              </p>
              <Link
                to="/register"
                className="mt-6 inline-block rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Register to bid
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">
                  Token · {state}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--auction)]/10 px-2 py-0.5 text-[color:var(--auction)]">
                  {access === "Can Bid" ? (
                    <Gavel className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  {access}
                </span>
              </div>
              <h1 className="mt-3 font-display text-2xl font-extrabold text-foreground">
                {lot.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {lot.id} · {lotType(lot)} · {lot.location} · Starting price{" "}
                {formatINR(lot.reserve)}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                {access === "Can Bid"
                  ? "This link grants bidding access to this auction only, without full registration. EMD terms still apply."
                  : "This link is watch-only. You can follow the live price and countdown, but the bid box stays hidden."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/lots/$id"
                  params={{ id: lot.id }}
                  className="rounded-full bg-[color:var(--navy)] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Open auction
                </Link>
                {access === "Can Bid" && (
                  <Link
                    to="/live/$id"
                    params={{ id: lot.id }}
                    className="rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Enter bidding room
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
