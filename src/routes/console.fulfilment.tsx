import { createFileRoute } from "@tanstack/react-router";
import { cr, fmtDate } from "@/lib/enterprise";
import { api } from "@/lib/api-client";
import { Card, PageHead, Pill, Table } from "@/components/console/shell";

export const Route = createFileRoute("/console/fulfilment")({
  head: () => ({
    meta: [
      { title: "Fulfilment — Award Letters, Orders, Lifting & Closure" },
      {
        name: "description",
        content:
          "Track award letters, purchase and sale orders, lifting schedules, gate passes, delivery milestones and closure certificates.",
      },
      { property: "og:title", content: "Fulfilment & Delivery Tracking" },
      {
        property: "og:description",
        content: "From award letter to closure certificate with chain of custody at each step.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => api.getAdminFulfilments({ per_page: "100" }),
  component: Fulfilment,
});

const STAGES = [
  "award_letter",
  "order",
  "scheduled",
  "in_progress",
  "delivered",
  "closed",
] as const;
const STAGE_LABEL: Record<(typeof STAGES)[number], string> = {
  award_letter: "Award letter",
  order: "Order issued",
  scheduled: "Scheduled",
  in_progress: "In progress",
  delivered: "Delivered",
  closed: "Closed",
};

function Fulfilment() {
  const response = Route.useLoaderData() as any;
  const fulfilments = (Array.isArray(response?.data) ? response.data : []).map((row: any) => ({
    id: String(row.id ?? row.order_id ?? "ORDER"),
    eventId: String(row.auction_id ?? "—"),
    party: String(row.vendor_name ?? "—"),
    stage: (row.status === "closed"
      ? "closed"
      : row.pickup_status
        ? "scheduled"
        : "order") as (typeof STAGES)[number],
    value: Number(row.total_amount_inr ?? row.winning_amount_inr ?? 0),
  }));
  return (
    <>
      <PageHead
        title="Fulfilment"
        subtitle="Award letter, order, lifting or mobilisation schedule, gate pass, chain of custody and closure certificate."
      />

      <div className="space-y-4">
        {fulfilments.map((f) => {
          const idx = STAGES.indexOf(f.stage);
          return (
            <Card
              key={f.id}
              title={`${f.id} · ${e?.title ?? f.eventId}`}
              desc={`${f.party} · value ${cr(f.value)}`}
              actions={
                <Pill tone={f.stage === "closed" ? "good" : "warn"}>{STAGE_LABEL[f.stage]}</Pill>
              }
            >
              <ol className="flex flex-wrap gap-2">
                {STAGES.map((s, i) => (
                  <li
                    key={s}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      i < idx
                        ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
                        : i === idx
                          ? "bg-[color:var(--auction)] text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STAGE_LABEL[s]}
                  </li>
                ))}
              </ol>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Next action</p>
                  <p className="mt-1 text-sm font-semibold">{f.nextAction}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Due</p>
                  <p className="mt-1 text-sm font-semibold">{fmtDate(f.dueAt)}</p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <button className="rounded-full border border-border px-3.5 py-2 text-xs font-semibold hover:bg-muted">
                    Download award letter
                  </button>
                  <button className="rounded-full border border-border px-3.5 py-2 text-xs font-semibold hover:bg-muted">
                    Generate gate pass
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card title="Documents & chain of custody" className="mt-4">
        <Table head={["Document", "Event", "Issued to", "Issued", "Status"]}>
          {[
            [
              "Award letter AL-341",
              "FWD-2026-0341",
              "Meridian Metals Pvt Ltd",
              "Today",
              "Acknowledged",
            ],
            ["Sale order SO-1187", "JAP-2026-0031", "Workforce First", "12 days ago", "Signed"],
            ["Work order WO-556", "RFP-2026-0077", "Aegis Facility Services", "Pending", "Draft"],
            [
              "Gate pass GP-8892",
              "FWD-2026-0341",
              "Meridian Metals Pvt Ltd",
              "Blocked",
              "Awaiting payment",
            ],
            [
              "Closure certificate CC-204",
              "JAP-2026-0031",
              "Workforce First",
              "Pending",
              "Not due",
            ],
          ].map((r) => (
            <tr key={r[0]}>
              <td className="py-3 pr-4 font-semibold">{r[0]}</td>
              <td className="py-3 pr-4 text-xs text-muted-foreground">{r[1]}</td>
              <td className="py-3 pr-4">{r[2]}</td>
              <td className="py-3 pr-4 text-xs text-muted-foreground">{r[3]}</td>
              <td className="py-3">
                <Pill tone={r[4] === "Signed" || r[4] === "Acknowledged" ? "good" : "warn"}>
                  {r[4]}
                </Pill>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
