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
  // Customer-scoped endpoints only: /admin/* rejects public (website) tokens with 403.
  loader: async () =>
    Promise.all([
      api.getEmd().catch(() => null),
      api.getWalletTransactions({ per_page: "50" }).catch(() => null),
      api.getOrders().catch(() => null),
      loadEvents(),
    ]),
  component: Finance,
});

function Finance() {
  const [emdResponse, txResponse, ordersResponse, awarded] = Route.useLoaderData();
  const list = (r: any): any[] => (Array.isArray(r?.data) ? r.data : []);
  const emdRows = list(emdResponse);
  const transactions = list(txResponse);
  const orders = list(ordersResponse);
  const sumBy = (rows: any[], key: string) =>
    rows.reduce((acc, r) => acc + Math.abs(Number(r?.[key] ?? 0)), 0);
  const held = sumBy(
    emdRows.filter((r) => ["locked", "held", "verified"].includes(String(r.status))),
    "amount_inr",
  );
  const unpaid = orders.filter((o) => !["paid", "closed", "cancelled"].includes(String(o.status)));
  const receivable = sumBy(unpaid, "balance_due_inr");
  const now = Date.now();
  const overdue = sumBy(
    unpaid.filter((o) => o.payment_due_at && Date.parse(o.payment_due_at) < now),
    "balance_due_inr",
  );
  const forfeited = sumBy(
    emdRows.filter((r) => String(r.status) === "forfeited"),
    "amount_inr",
  );
  const invoices = transactions.filter((t: any) =>
    String(t.type ?? "")
      .toLowerCase()
      .includes("payment"),
  );
  const emdLedger = emdRows.map((r: any) => ({
    id: r.reference ?? r.id,
    user: r.vendor_name,
    note: r.auction_id,
    amount_inr: r.amount_inr,
    state: String(r.status ?? ""),
  }));

  return (
    <>
      <PageHead
        title="Finance & EMD"
        subtitle="Deposit lifecycle, balance payments with GST and TCS, deadlines, breaches and recovery cases."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="EMD held" value={cr(held)} hint="Your locked deposits" />
        <Kpi label="Receivable" value={cr(receivable)} hint="Awaiting or part paid" />
        <Kpi label="Overdue" value={cr(overdue)} hint="Past payment due date" />
        <Kpi label="Forfeited" value={cr(forfeited)} hint="Deposits forfeited" />
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
                    {r.state || "recorded"}
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
