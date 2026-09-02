import { createFileRoute } from "@tanstack/react-router";
import { settlement, cr, inr, fmtDate } from "@/lib/enterprise";
import { api } from "@/lib/api-client";
import { loadEvents } from "@/lib/enterprise-api";
import { Card, Kpi, PageHead, Pill, Table } from "@/components/console/shell";

export const Route = createFileRoute("/console/finance")({
  head: () => ({
    meta: [
      { title: "Finance & EMD — Settlement, Tax and Security Deposits" },
      {
        name: "description",
        content:
          "Track EMD holds, forfeitures and refunds, invoice ageing and GST/TCS settlement across every awarded sourcing event.",
      },
      { property: "og:title", content: "Finance & EMD Control" },
      {
        property: "og:description",
        content: "Deposit lifecycle, payment deadlines and tax computation in one finance module.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => Promise.all([api.getAdminFinanceSummary(), loadEvents()]),
  component: Finance,
});

function Finance() {
  const [financeResponse, awarded] = Route.useLoaderData();
  const summary = financeResponse?.summary ?? {};
  const transactions = Array.isArray(financeResponse?.recent_transactions)
    ? financeResponse.recent_transactions
    : [];
  const held = Number(summary.total_locked_emd_inr ?? 0);
  const receivable = Number(summary.outstanding_balance_inr ?? 0);
  const overdue = 0;
  const forfeited = Number(summary.emd_forfeited_inr ?? 0);
  const invoices = transactions.filter((t: any) =>
    String(t.type ?? "")
      .toLowerCase()
      .includes("payment"),
  );
  const emdLedger = transactions.filter((t: any) =>
    String(t.type ?? "")
      .toLowerCase()
      .includes("emd"),
  );

  return (
    <>
      <PageHead
        title="Finance & EMD"
        subtitle="Deposit lifecycle, balance payments with GST and TCS, deadlines, breaches and recovery cases."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="EMD held" value={cr(held)} hint="Across live and published events" />
        <Kpi label="Receivable" value={cr(receivable)} hint="Awaiting or part paid" />
        <Kpi label="Overdue" value={cr(overdue)} hint="Escalated to recovery" />
        <Kpi label="Forfeited YTD" value={cr(forfeited)} hint="Winner default cases" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Invoice & payment tracking">
          <Table head={["Invoice", "Party", "Amount", "Due", "Status"]}>
            {invoices.map((i: any) => (
              <tr key={i.id}>
                <td className="py-3 pr-4">
                  <span className="font-semibold">{i.id}</span>
                  <div className="text-xs text-muted-foreground">
                    {i.note ?? "Payment transaction"}
                  </div>
                </td>
                <td className="py-3 pr-4">{i.user ?? "—"}</td>
                <td className="py-3 pr-4 font-semibold">{cr(Number(i.amount_inr ?? 0))}</td>
                <td className="py-3 pr-4 text-xs text-muted-foreground">
                  {fmtDate(Date.parse(i.at ?? "") || 0)}
                </td>
                <td className="py-3">
                  <Pill tone="good">recorded</Pill>
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="EMD / security ledger">
          <Table head={["Ref", "Party", "Event", "Amount", "State"]}>
            {emdLedger.map((r: any) => (
              <tr key={r.id}>
                <td className="py-3 pr-4 font-semibold">{r.id}</td>
                <td className="py-3 pr-4">{r.user ?? "—"}</td>
                <td className="py-3 pr-4 text-xs text-muted-foreground">
                  {r.note ?? "EMD transaction"}
                </td>
                <td className="py-3 pr-4 font-semibold">{inr(Number(r.amount_inr ?? 0))}</td>
                <td className="py-3">
                  <Pill
                    tone={
                      r.state === "released" || r.state === "applied"
                        ? "good"
                        : r.state === "forfeited"
                          ? "bad"
                          : "warn"
                    }
                  >
                    recorded
                  </Pill>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <Card
        title="Settlement computation"
        desc="GST 18% and TCS 1% on award value; EMD applied to balance"
        className="mt-4"
      >
        <Table
          head={["Event", "Award value", "GST", "TCS", "Total payable", "EMD applied", "Balance"]}
        >
          {awarded.map((e) => {
            const s = settlement(e.value, e.emdAmount);
            return (
              <tr key={e.id}>
                <td className="py-3 pr-4">
                  <span className="font-semibold">{e.id}</span>
                  <div className="text-xs text-muted-foreground">{e.title}</div>
                </td>
                <td className="py-3 pr-4">{inr(s.value)}</td>
                <td className="py-3 pr-4">{inr(s.gst)}</td>
                <td className="py-3 pr-4">{inr(s.tcs)}</td>
                <td className="py-3 pr-4 font-semibold">{inr(s.total)}</td>
                <td className="py-3 pr-4">{inr(s.emd)}</td>
                <td className="py-3 font-semibold">{inr(s.balance)}</td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
