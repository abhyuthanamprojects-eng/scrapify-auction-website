import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { approvalTriggers, cr, fmtDate, FORMAT_LABEL } from "@/lib/enterprise";
import { loadEvents } from "@/lib/enterprise-api";
import { Card, PageHead, Pill, Table } from "@/components/console/shell";

export const Route = createFileRoute("/console/approvals")({
  head: () => ({
    meta: [
      { title: "Approval Queue — Award & Governance Decisions" },
      {
        name: "description",
        content:
          "Review award recommendations with value thresholds, variance, participation risk and vendor risk on a single decision screen.",
      },
      { property: "og:title", content: "Approval Queue" },
      {
        property: "og:description",
        content:
          "L1/L2/L3 approvers act on award recommendations with full context and audit capture.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => loadEvents({ status: "approval" }),
  component: Approvals,
});

function Approvals() {
  const queue = Route.useLoaderData().filter(
    (e) => e.approvals.some((a) => a.status === "pending") || e.state === "approval",
  );
  const [decided, setDecided] = useState<Record<string, "approved" | "rejected" | "returned">>({});
  const [note, setNote] = useState<Record<string, string>>({});

  return (
    <>
      <PageHead
        title="Approval queue"
        subtitle="Every recommendation carries its trigger reasons, commercial variance and vendor risk. Decisions are irreversible and audited."
      />

      <div className="space-y-4">
        {queue.map((e) => {
          const state = decided[e.id];
          const variance = e.value ? ((e.value - e.baseline) / e.baseline) * 100 : 0;
          return (
            <Card
              key={e.id}
              title={`${e.id} · ${e.title}`}
              desc={`${FORMAT_LABEL[e.format]} · ${e.category} · owner ${e.owner}`}
              actions={
                <Pill tone={state === "approved" ? "good" : state === "rejected" ? "bad" : "warn"}>
                  {state ?? "Pending decision"}
                </Pill>
              }
            >
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <dl className="grid gap-4 sm:grid-cols-4">
                    {[
                      [e.direction === "forward" ? "Reserve" : "Target", cr(e.baseline)],
                      ["Recommended", e.value ? cr(e.value) : "—"],
                      ["Variance", `${variance.toFixed(1)}%`],
                      [
                        "Participants",
                        `${e.participants.filter((p) => p.accepted).length} accepted`,
                      ],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs uppercase text-muted-foreground">{k}</dt>
                        <dd className="mt-1 font-display text-sm font-bold">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  <h3 className="mt-5 font-display text-sm font-bold">Why approval is required</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {approvalTriggers(e).map((t) => (
                      <li key={t}>
                        <Pill tone="warn">{t}</Pill>
                      </li>
                    ))}
                  </ul>

                  <textarea
                    value={note[e.id] ?? ""}
                    onChange={(ev) => setNote((n) => ({ ...n, [e.id]: ev.target.value }))}
                    rows={2}
                    placeholder="Decision note (recorded in the audit trail)"
                    className="mt-4 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setDecided((d) => ({ ...d, [e.id]: "approved" }))}
                      className="rounded-full bg-[color:var(--success)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setDecided((d) => ({ ...d, [e.id]: "returned" }))}
                      className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      Return for clarification
                    </button>
                    <button
                      onClick={() => setDecided((d) => ({ ...d, [e.id]: "rejected" }))}
                      className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground"
                    >
                      Reject
                    </button>
                    <Link
                      to="/console/events/$id"
                      params={{ id: e.id }}
                      className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      Open workspace
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl bg-muted p-4">
                  <h3 className="font-display text-sm font-bold">Approval chain</h3>
                  <ol className="mt-3 space-y-3 text-sm">
                    {e.approvals.map((a) => (
                      <li key={a.level} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {a.level} · {a.role}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.approver}
                            {a.at ? ` · ${fmtDate(a.at)}` : ""}
                          </p>
                        </div>
                        <Pill
                          tone={
                            a.status === "approved"
                              ? "good"
                              : a.status === "rejected"
                                ? "bad"
                                : a.status === "pending"
                                  ? "warn"
                                  : "muted"
                          }
                        >
                          {a.status.replace("_", " ")}
                        </Pill>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card
        title="Approval matrix"
        desc="Thresholds that route a recommendation to each level"
        className="mt-4"
      >
        <Table head={["Trigger", "L1", "L2", "L3", "SLA"]}>
          {[
            ["Value up to ₹50 L", "Category Manager", "—", "—", "24 h"],
            ["₹50 L – ₹5 Cr", "Category Manager", "Finance Controller", "—", "24 h"],
            ["Above ₹5 Cr", "Category Manager", "Finance Controller", "CPO", "48 h"],
            [
              "Award below reserve / above target",
              "Category Manager",
              "Finance Controller",
              "CPO",
              "24 h",
            ],
            [
              "Single or fewer than 3 bidders",
              "Category Manager",
              "Finance Controller",
              "—",
              "24 h",
            ],
            ["Non-best-offer award", "Category Manager", "Finance Controller", "CPO", "48 h"],
            ["High-risk vendor", "Compliance", "Finance Controller", "CPO", "48 h"],
            [
              "Cancellation after bids received",
              "Category Manager",
              "Finance Controller",
              "CPO",
              "24 h",
            ],
          ].map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`py-3 pr-4 ${i === 0 ? "font-semibold" : "text-muted-foreground"}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
