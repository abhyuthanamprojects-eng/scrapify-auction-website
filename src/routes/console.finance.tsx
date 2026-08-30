import { createFileRoute } from "@tanstack/react-router";
import { INVOICES, EMD_LEDGER, settlement, cr, inr, fmtDate, EVENTS } from "@/lib/enterprise";
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
  component: Finance,
});

function Finance() {
  const held = EMD_LEDGER.filter((r) => r.state === "held").reduce((s, r) => s + r.amount, 0);
  const receivable = INVOICES.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const overdue = INVOICES.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const forfeited = EMD_LEDGER.filter((r) => r.state === "forfeited").reduce((s, r) => s + r.amount, 0);
  const awarded = EVENTS.filter((e) => e.state === "awarded" || e.state === "evaluation");

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
            {INVOICES.map((i) => (
              <tr key={i.id}>
                <td className="py-3 pr-4">
                  <span className="font-semibold">{i.id}</span>
                  <div className="text-xs text-muted-foreground">{i.eventId}</div>
                </td>
                <td className="py-3 pr-4">{i.party}</td>
                <td className="py-3 pr-4 font-semibold">{cr(i.amount)}</td>
                <td className="py-3 pr-4 text-xs text-muted-foreground">{fmtDate(i.due)}</td>
                <td className="py-3">
                  <Pill tone={i.status === "paid" ? "good" : i.status === "overdue" ? "bad" : "warn"}>
                    {i.status.replace("_", " ")}
                  </Pill>
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="EMD / security ledger">
          <Table head={["Ref", "Party", "Event", "Amount", "State"]}>
            {EMD_LEDGER.map((r) => (
              <tr key={r.id}>
                <td className="py-3 pr-4 font-semibold">{r.id}</td>
                <td className="py-3 pr-4">{r.party}</td>
                <td className="py-3 pr-4 text-xs text-muted-foreground">{r.eventId}</td>
                <td className="py-3 pr-4 font-semibold">{inr(r.amount)}</td>
                <td className="py-3">
                  <Pill
                    tone={r.state === "released" || r.state === "applied" ? "good" : r.state === "forfeited" ? "bad" : "warn"}
                  >
                    {r.state}
                  </Pill>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <Card title="Settlement computation" desc="GST 18% and TCS 1% on award value; EMD applied to balance" className="mt-4">
        <Table head={["Event", "Award value", "GST", "TCS", "Total payable", "EMD applied", "Balance"]}>
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
