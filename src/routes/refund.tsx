import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — Scrapify Auctions" },
      {
        name: "description",
        content:
          "How EMD refunds, auction cancellations, forfeiture and payment reversals work on Scrapify Auctions, including timelines and how to raise a request.",
      },
    ],
  }),
  component: RefundPage,
});

const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    heading: "Overview",
    body: (
      <>
        <p>
          This Refund &amp; Cancellation Policy explains when money held on the Scrapify Auctions
          platform is returned, retained or forfeited. It covers Earnest Money Deposits (EMD), auction
          cancellations, and payments made against an award.
        </p>
        <p>
          Scrapify Auctions is a B2B marketplace facilitating transactions between registered
          businesses. Material sold through the Platform is sold on an{" "}
          <strong>"as-is, where-is"</strong> basis and is <strong>not returnable</strong> once lifted.
          This policy therefore deals primarily with deposits and payments rather than with the return
          of goods.
        </p>
      </>
    ),
  },
  {
    id: "emd-refunds",
    heading: "EMD Refunds",
    body: (
      <>
        <p>
          An Earnest Money Deposit is a refundable security amount required before you can bid. What
          happens to it depends on the outcome of the auction:
        </p>
        <ul>
          <li>
            <strong>Unsuccessful bidders</strong> — the EMD is queued for refund as soon as the auction
            result is finalised, and is credited within <strong>7 working days</strong> to the bank
            account on your verified profile.
          </li>
          <li>
            <strong>Winning bidder</strong> — the EMD is retained and adjusted against the final
            payment. It is not refunded separately.
          </li>
          <li>
            <strong>Second-ranked bidder</strong> — where a fallback mechanism applies to the auction,
            the runner-up's EMD may be held until the winning bidder completes payment, in case the
            award passes to them. It is released for refund once the winner pays.
          </li>
          <li>
            <strong>Auction cancelled or annulled</strong> — all EMD is released in full, with no
            deduction.
          </li>
        </ul>
        <p>
          Refunds are always made to the same verified bank account from which settlement details were
          confirmed. We do not refund to a third-party account.
        </p>
      </>
    ),
  },
  {
    id: "forfeiture",
    heading: "When EMD Is Forfeited",
    body: (
      <>
        <p>The EMD of a winning bidder is forfeited where the bidder:</p>
        <ul>
          <li>Fails to make full payment within the period stated on the auction</li>
          <li>Withdraws or refuses the award after the auction closes</li>
          <li>Fails to lift the material within the stipulated lifting period without agreed extension</li>
          <li>Is found to have provided false verification information or to have breached bidding conduct rules</li>
          <li>Cannot produce a regulatory authorisation required to take delivery of the category</li>
        </ul>
        <p>
          Forfeiture is notified in writing with the reason. Where only part of the obligation has
          failed, we may at our discretion forfeit a proportionate amount rather than the whole.
        </p>
        <p>
          Forfeiture of EMD does not by itself discharge the bidder from any further liability the
          Seller may have for loss caused by the default.
        </p>
      </>
    ),
  },
  {
    id: "cancellation",
    heading: "Auction Cancellation",
    body: (
      <>
        <p><strong>Cancellation by the Seller</strong></p>
        <p>
          A Seller may withdraw an auction before it goes live. Once bidding has opened, an auction may
          be withdrawn only with platform approval and for a substantive reason — for example, the
          material is no longer available, or a material error in the listing is discovered. All EMD is
          released in full where this occurs.
        </p>
        <p className="pt-2"><strong>Cancellation by Scrapify Auctions</strong></p>
        <p>We may cancel or annul an auction where:</p>
        <ul>
          <li>Bid manipulation, collusion or other prohibited conduct is detected</li>
          <li>A technical fault materially affected the conduct or outcome of the auction</li>
          <li>The listing is found to be non-compliant with applicable law</li>
          <li>The minimum number of qualified participants was not met, where that condition applies</li>
        </ul>
        <p>
          In each case all EMD is released in full and no cancellation charge is levied on
          participants.
        </p>
        <p className="pt-2"><strong>Reserve price not met</strong></p>
        <p>
          Where the highest bid does not meet the Seller's reserve, no award is issued. This is not a
          cancellation — the auction concludes without a winner and all EMD is released in full.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    heading: "Payment Refunds",
    body: (
      <>
        <p>
          Payments made against an award are refundable only in limited circumstances:
        </p>
        <ul>
          <li>
            <strong>Seller default</strong> — the Seller cannot deliver the awarded material, or the
            material is materially different from the listing in a way established through the dispute
            process. The full amount paid is refunded.
          </li>
          <li>
            <strong>Duplicate or excess payment</strong> — any amount received over the sum due is
            returned in full.
          </li>
          <li>
            <strong>Award cancelled by the Platform</strong> — where we annul an award for reasons not
            attributable to the Buyer, the full amount paid is refunded.
          </li>
        </ul>
        <p>
          Payment refunds are processed within <strong>10 working days</strong> of the refund being
          approved. Taxes already remitted (GST, TCS) are adjusted in accordance with applicable tax
          law, which may require a credit note rather than an immediate cash reversal.
        </p>
        <p>
          A Buyer who has lifted material cannot claim a refund on grounds of quality, quantity or
          grade where the inspection window was available and not used.
        </p>
      </>
    ),
  },
  {
    id: "timelines",
    heading: "Refund Timelines",
    body: (
      <>
        <div className="overflow-x-auto">
          <table className="mt-1 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-semibold text-foreground">Scenario</th>
                <th className="py-2 font-semibold text-foreground">Timeline</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 pr-4">EMD — unsuccessful bidder</td>
                <td className="py-2">7 working days from result finalisation</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4">EMD — runner-up released</td>
                <td className="py-2">7 working days from winner's payment</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4">EMD — auction cancelled</td>
                <td className="py-2">5 working days from cancellation</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4">Duplicate or excess payment</td>
                <td className="py-2">7 working days from verification</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Payment refund (approved dispute)</td>
                <td className="py-2">10 working days from approval</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="pt-2">
          Timelines run from the trigger event to the date we initiate the transfer. Credit to your
          account depends on your bank and may take a further 2–3 working days.
        </p>
      </>
    ),
  },
  {
    id: "how-to-request",
    heading: "How to Request a Refund",
    body: (
      <>
        <p>
          Eligible EMD refunds are queued <strong>automatically</strong> when an auction result is
          finalised — you do not need to request them. You can track status under Wallet in the app or
          web console.
        </p>
        <p>If a refund is overdue, or you need to raise one that is not automatic:</p>
        <ul>
          <li>Write to <a href="mailto:finance@scrapifyauctions.com">finance@scrapifyauctions.com</a> from your registered email</li>
          <li>Include your registered entity name, the auction code, and the amount</li>
          <li>Attach the payment reference or UTR where the request concerns a payment rather than EMD</li>
        </ul>
        <p>
          We acknowledge within 48 hours and confirm the outcome, with reasons if a request is
          declined.
        </p>
      </>
    ),
  },
  {
    id: "deductions",
    heading: "Charges & Deductions",
    body: (
      <>
        <p>
          EMD refunds are made in full. We do not levy a processing or platform charge on the return of
          an EMD.
        </p>
        <p>
          Where a refund arises from a Buyer's own default, any documented direct cost incurred by the
          Seller or the Platform — for example bank charges on a reversed transfer — may be deducted,
          and will be itemised in the refund advice.
        </p>
      </>
    ),
  },
  {
    id: "disputes",
    heading: "Disputed Refunds",
    body: (
      <>
        <p>
          Where you disagree with a forfeiture or a declined refund, raise a dispute through the
          Platform within <strong>15 days</strong> of the decision. Disputes are reviewed by the
          settlement team independently of the operations team that issued the decision.
        </p>
        <p>
          If the outcome remains unsatisfactory, the matter may be escalated to our Grievance Officer
          and thereafter resolved under the arbitration provisions in our{" "}
          <a href="/terms">Terms &amp; Conditions</a>.
        </p>
      </>
    ),
  },
];

function RefundPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      intro="When EMD and payments are refunded, retained or forfeited on Scrapify Auctions — including cancellation scenarios, timelines and how to raise a request."
      updated="15 September 2026"
      sections={SECTIONS}
      footer={
        <>
          <p className="font-semibold text-foreground">Refund queries</p>
          <p className="mt-1">
            Email <a href="mailto:finance@scrapifyauctions.com">finance@scrapifyauctions.com</a> with
            your entity name, auction code and amount. Escalations:{" "}
            <a href="mailto:grievance@scrapifyauctions.com">grievance@scrapifyauctions.com</a>.
          </p>
        </>
      }
    />
  );
}
