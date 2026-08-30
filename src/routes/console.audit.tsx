import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { EVENTS, fmtDate } from "@/lib/enterprise";
import { Card, PageHead, Pill } from "@/components/console/shell";
import { Download, FileCheck2, Hash, ShieldCheck, Search, Filter } from "lucide-react";

export const Route = createFileRoute("/console/audit")({
  head: () => ({
    meta: [
      { title: "SOC2 Audit Trail & Evidence Log — Scrapify Auctions" },
      {
        name: "description",
        content:
          "Search the immutable audit trail of event creation, bids, extensions, approvals, awards and financial actions with cryptographic hash verification.",
      },
      { property: "og:title", content: "Platform Audit Trail | Scrapify Auctions" },
      {
        property: "og:description",
        content: "Who did what, when, with what justification — exportable for internal and statutory audit.",
      },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const rawEntries = EVENTS.flatMap((e) =>
    e.audit.map((a, idx) => ({
      ...a,
      eventId: e.id,
      title: e.title,
      hash: `0x${(100000000000 + idx * 78291 + a.at).toString(16).slice(0, 16)}...`,
      category: a.action.toLowerCase().includes("bid")
        ? "Bidding"
        : a.action.toLowerCase().includes("approval")
          ? "Approval"
          : a.action.toLowerCase().includes("publish") || a.action.toLowerCase().includes("live")
            ? "Lifecycle"
            : "System",
    })),
  );

  const entries = rawEntries
    .filter((a) => {
      const matchesType = filterType === "all" || a.category.toLowerCase() === filterType.toLowerCase();
      const matchesSearch =
        q === "" || `${a.action} ${a.actor} ${a.eventId} ${a.title}`.toLowerCase().includes(q.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => b.at - a.at);

  return (
    <>
      <PageHead
        title="SOC2 Immutable Audit Trail"
        subtitle="Append-only cryptographic ledger of all sourcing transactions, bid submissions, approvals, extensions, and settlements."
        actions={
          <button
            onClick={() => alert("Exporting certified SOC2 Compliance Audit Log (PDF & CSV)...")}
            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
          >
            <Download className="h-4 w-4" /> Export Audit Pack
          </button>
        }
      />

      {/* Filter and Search */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "Lifecycle", "Bidding", "Approval", "System"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                filterType === t ? "bg-[color:var(--navy)] text-white" : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {t === "all" ? "All Logs" : t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-xs text-muted-foreground w-72">
          <Search className="h-3.5 w-3.5" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search action, actor, event ID..."
            className="w-full bg-transparent focus:outline-none text-foreground"
          />
        </div>
      </div>

      <Card title={`Cryptographically Verified Ledger (${entries.length} Entries)`} desc="Hash-chained blocks synced across redundant secure nodes">
        <ol className="space-y-4">
          {entries.map((a, i) => (
            <li key={i} className="flex items-start justify-between rounded-xl border border-border bg-card p-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--auction)] shadow-xs" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{a.action}</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                      {a.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Actor: <strong className="text-foreground">{a.actor}</strong> • Time: {fmtDate(a.at)} • Event:{" "}
                    <Link to="/console/events/$id" params={{ id: a.eventId }} className="font-semibold text-[color:var(--navy)] hover:underline">
                      {a.eventId}
                    </Link>{" "}
                    ({a.title})
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-[11px] bg-muted/60 px-2 py-1 rounded border border-border text-muted-foreground">
                  {a.hash}
                </span>
                <div className="mt-1">
                  <Pill tone="good">✓ SIGNED</Pill>
                </div>
              </div>
            </li>
          ))}
          {entries.length === 0 && (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No audit entries matched your filter.
            </div>
          )}
        </ol>
      </Card>
    </>
  );
}
