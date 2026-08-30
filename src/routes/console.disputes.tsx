import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DISPUTES, EVENTS, fmtDate, type Dispute } from "@/lib/enterprise";
import { Card, Kpi, PageHead, Pill } from "@/components/console/shell";
import { AlertCircle, CheckCircle2, MessageSquare, Plus, Scale, ShieldAlert, UserCheck, X } from "lucide-react";

export const Route = createFileRoute("/console/disputes")({
  head: () => ({
    meta: [
      { title: "Disputes & Arbitration — Scrapify Auctions" },
      {
        name: "description",
        content:
          "Log, investigate and resolve quantity, quality, payment, SLA and process disputes with a full evidence and decision trail.",
      },
      { property: "og:title", content: "Disputes & Exceptions | Scrapify Auctions" },
      {
        property: "og:description",
        content: "Case management for auction process challenges and contract performance issues.",
      },
    ],
  }),
  component: DisputesPage,
});

function DisputesPage() {
  const [filter, setFilter] = useState<"all" | "open" | "under_review" | "resolved">("all");
  const [disputesList, setDisputesList] = useState<Dispute[]>(DISPUTES);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [actionType, setActionType] = useState<"evidence" | "committee" | "decision" | null>(null);
  const [modalText, setModalText] = useState("");
  const [newDisputeOpen, setNewDisputeOpen] = useState(false);
  const [newParty, setNewParty] = useState("Meridian Metals Pvt Ltd");
  const [newType, setNewType] = useState<Dispute["type"]>("quantity");
  const [newSeverity, setNewSeverity] = useState<Dispute["severity"]>("medium");
  const [newSummary, setNewSummary] = useState("");

  const rows = disputesList.filter((d) => filter === "all" || d.status === filter);

  const handleActionSubmit = () => {
    if (!selectedDispute || !actionType) return;
    if (actionType === "decision") {
      setDisputesList((prev) =>
        prev.map((d) => (d.id === selectedDispute.id ? { ...d, status: "resolved", summary: `${d.summary} [Resolved: ${modalText || "Arbitration completed"}]` } : d)),
      );
    } else if (actionType === "committee") {
      setDisputesList((prev) =>
        prev.map((d) => (d.id === selectedDispute.id ? { ...d, status: "under_review" } : d)),
      );
    }
    setActionType(null);
    setSelectedDispute(null);
    setModalText("");
  };

  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSummary.trim()) return;
    const newEntry: Dispute = {
      id: `DSP-${Math.floor(100 + Math.random() * 900)}`,
      eventId: "FWD-2026-0341",
      party: newParty,
      type: newType,
      severity: newSeverity,
      status: "open",
      opened: Date.now(),
      summary: newSummary,
    };
    setDisputesList([newEntry, ...disputesList]);
    setNewDisputeOpen(false);
    setNewSummary("");
  };

  return (
    <>
      <PageHead
        title="Commercial Claims & Dispute Arbitration"
        subtitle="Manage process protests, weight discrepancy claims, payment defaults, and SLA arbitration with full evidence trail."
        actions={
          <button
            onClick={() => setNewDisputeOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--auction)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Log Claim / Dispute
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Open Disputes" value={String(disputesList.filter((d) => d.status === "open").length)} hint="SLA 3 working days" />
        <Kpi label="Under Arbitration" value={String(disputesList.filter((d) => d.status === "under_review").length)} hint="Committee assigned" />
        <Kpi label="Resolved Cases" value={String(disputesList.filter((d) => d.status === "resolved").length)} delta="100% On-Time" hint="Outcome recorded" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "open", "under_review", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider capitalize transition-colors ${
              filter === f ? "bg-[color:var(--navy)] text-white shadow-sm" : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {rows.map((d) => {
          const e = EVENTS.find((x) => x.id === d.eventId);
          return (
            <Card
              key={d.id}
              title={`${d.id} · ${d.type.toUpperCase()} Dispute`}
              desc={`${d.party} · Event: ${e?.title ?? d.eventId} · Opened on ${fmtDate(d.opened)}`}
              actions={
                <div className="flex gap-2">
                  <Pill tone={d.severity === "high" ? "bad" : d.severity === "medium" ? "warn" : "muted"}>
                    {d.severity.toUpperCase()} SEVERITY
                  </Pill>
                  <Pill tone={d.status === "resolved" ? "good" : d.status === "open" ? "bad" : "warn"}>
                    {d.status.replace("_", " ").toUpperCase()}
                  </Pill>
                </div>
              }
            >
              <div className="rounded-lg bg-muted/30 p-3 text-sm text-foreground leading-relaxed border border-border">
                {d.summary}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedDispute(d);
                    setActionType("evidence");
                  }}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  Request Evidence
                </button>
                <button
                  onClick={() => {
                    setSelectedDispute(d);
                    setActionType("committee");
                  }}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  Assign Committee
                </button>
                {d.status !== "resolved" && (
                  <button
                    onClick={() => {
                      setSelectedDispute(d);
                      setActionType("decision");
                    }}
                    className="rounded-full bg-[color:var(--navy)] px-4 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                  >
                    Record Decision
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Action Modal */}
      {selectedDispute && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display text-base font-bold">
                {actionType === "evidence" && `Request Additional Evidence — ${selectedDispute.id}`}
                {actionType === "committee" && `Assign Arbitration Committee — ${selectedDispute.id}`}
                {actionType === "decision" && `Record Formal Resolution — ${selectedDispute.id}`}
              </h3>
              <button onClick={() => setActionType(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="my-4 text-xs space-y-3">
              <p className="text-muted-foreground">
                Case: <strong>{selectedDispute.summary}</strong>
              </p>
              <textarea
                value={modalText}
                onChange={(e) => setModalText(e.target.value)}
                placeholder={
                  actionType === "evidence"
                    ? "Specify required documents (e.g. Tare weighbridge ticket, photo inspection log)..."
                    : actionType === "committee"
                      ? "Assign 3 committee members (Legal, Finance, Sourcing lead)..."
                      : "Enter binding arbitration outcome and compensation/penalty settlement..."
                }
                rows={4}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                onClick={() => setActionType(null)}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleActionSubmit}
                className="rounded-full bg-[color:var(--navy)] px-5 py-1.5 text-xs font-semibold text-white hover:brightness-110"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Claim Modal */}
      {newDisputeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateDispute} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display text-base font-bold">Log Commercial Claim / Dispute</h3>
              <button type="button" onClick={() => setNewDisputeOpen(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="my-4 text-xs space-y-3">
              <div>
                <label className="font-semibold text-muted-foreground">Affected Vendor / Party</label>
                <input
                  value={newParty}
                  onChange={(e) => setNewParty(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground">Dispute Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                  >
                    <option value="quantity">Quantity Discrepancy</option>
                    <option value="quality">Quality Rejection</option>
                    <option value="payment">Payment Delay / Default</option>
                    <option value="sla">SLA / Delivery Delay</option>
                    <option value="process">Auction Process Protest</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Severity Level</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                  >
                    <option value="low">Low Severity</option>
                    <option value="medium">Medium Severity</option>
                    <option value="high">High Severity</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-muted-foreground">Claim Summary & Evidence Context</label>
                <textarea
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Detail the event ID, weighbridge ticket or payment breach..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setNewDisputeOpen(false)}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[color:var(--auction)] px-5 py-1.5 text-xs font-semibold text-white hover:brightness-110"
              >
                Submit Case
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
