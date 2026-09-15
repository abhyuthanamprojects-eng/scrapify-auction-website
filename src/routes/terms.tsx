import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Scrapify Auctions" },
      {
        name: "description",
        content:
          "The agreement governing use of the Scrapify Auctions B2B industrial scrap marketplace — registration, bidding, EMD, payment, lifting and dispute resolution.",
      },
    ],
  }),
  component: TermsPage,
});

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    heading: "Acceptance of Terms",
    body: (
      <>
        <p>
          These Terms &amp; Conditions ("Terms") govern your access to and use of the Scrapify
          Auctions platform, including our website, mobile applications and related services
          (collectively, the "Platform"). By registering an account, placing a bid, listing material
          or otherwise using the Platform, you agree to be bound by these Terms.
        </p>
        <p>
          The Platform is intended solely for business-to-business (B2B) transactions between
          registered commercial entities. It is not available to individual consumers. By using the
          Platform you represent that you are authorised to act on behalf of the business entity you
          register.
        </p>
        <p>
          If you do not agree with these Terms, you must not use the Platform.
        </p>
      </>
    ),
  },
  {
    id: "definitions",
    heading: "Definitions",
    body: (
      <ul>
        <li><strong>Seller</strong> — a registered entity listing scrap, surplus material or assets for auction.</li>
        <li><strong>Buyer</strong> — a registered entity participating in an auction with the intent to purchase.</li>
        <li><strong>Auction</strong> — a time-bound bidding event, whether forward (highest bid wins) or reverse (lowest bid wins).</li>
        <li><strong>Lot</strong> — an individual line item within an auction, sold as a unit.</li>
        <li><strong>EMD</strong> — Earnest Money Deposit, a refundable security amount required to participate.</li>
        <li><strong>Award</strong> — the Platform's confirmation that a Buyer has won a Lot or Auction.</li>
        <li><strong>Lifting</strong> — physical collection and removal of purchased material from the Seller's premises.</li>
      </ul>
    ),
  },
  {
    id: "registration",
    heading: "Registration & Business Verification",
    body: (
      <>
        <p>
          Access to bidding and listing requires a verified business account. During registration you
          must provide accurate and complete information, including:
        </p>
        <ul>
          <li>Registered business name and constitution</li>
          <li>GSTIN and PAN</li>
          <li>Bank account details for settlement and refunds</li>
          <li>Authorised signatory details and contact information</li>
          <li>Any category-specific licences (for example, CPCB/SPCB authorisation for e-waste)</li>
        </ul>
        <p>
          Scrapify Auctions verifies these details before enabling participation. We may request
          additional documentation, and we may suspend or reject an account where verification fails,
          information is found to be false, or required licences have lapsed.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for
          all activity conducted under your account. Notify us immediately of any unauthorised use.
        </p>
      </>
    ),
  },
  {
    id: "emd",
    heading: "Earnest Money Deposit (EMD)",
    body: (
      <>
        <p>
          Participation in an auction requires an EMD, the amount of which is specified on each
          auction listing. The EMD must be deposited and confirmed before any bid can be placed.
        </p>
        <ul>
          <li>The EMD of unsuccessful bidders is queued for refund once the auction result is finalised, and is typically returned within <strong>7 working days</strong>.</li>
          <li>The EMD of the winning bidder is retained and adjusted against the final payment.</li>
          <li>Where a fallback mechanism applies, the EMD of the second-ranked bidder may be retained until the winning bidder completes payment, in case the award passes to the runner-up.</li>
          <li>The EMD is <strong>forfeited</strong> if the winning bidder fails to complete payment or lifting within the stipulated period, or withdraws after the award.</li>
        </ul>
        <p>
          EMD is a security deposit, not a payment for goods, and does not by itself create any right
          to the auctioned material.
        </p>
      </>
    ),
  },
  {
    id: "bidding",
    heading: "Bidding & Auction Conduct",
    body: (
      <>
        <p>
          Bids are binding offers. Once placed, a bid cannot be withdrawn or reduced. Each bid must
          meet or exceed the minimum increment published on the auction.
        </p>
        <ul>
          <li>Auctions run within defined time slots. Where a continuation slot is configured, bidding may extend beyond the initially scheduled end.</li>
          <li>A Seller may not bid on their own auction, directly or through a related entity.</li>
          <li>Bid rigging, collusion, price manipulation, use of automated tooling not provided by the Platform, or any coordinated conduct between bidders is strictly prohibited.</li>
          <li>Scrapify Auctions may cancel a bid, disqualify a participant, or void an auction where such conduct is suspected.</li>
        </ul>
        <p>
          The Platform records the server-side timestamp of each bid, and that record is
          authoritative in determining bid order and the outcome of the auction.
        </p>
      </>
    ),
  },
  {
    id: "inspection",
    heading: "Inspection & Condition of Material",
    body: (
      <>
        <p>
          All material is sold on an <strong>"as-is, where-is"</strong> basis. Quantities, grades,
          weights and specifications stated in a listing are indicative and may vary within customary
          tolerances for the category.
        </p>
        <p>
          Buyers are strongly advised to inspect material during the inspection window published on
          the auction. Where a Buyer chooses not to inspect, no claim regarding quality, quantity,
          grade, moisture, contamination or composition will be entertained after the auction closes.
        </p>
        <p>
          Category-specific conditions — including purity testing for non-ferrous metals, moisture
          allowances for paper, and functional status for e-waste and IT assets — are published on the
          relevant auction and form part of the contract for that auction.
        </p>
      </>
    ),
  },
  {
    id: "payment",
    heading: "Payment Terms",
    body: (
      <>
        <p>
          The winning bidder must make full payment within the period stated on the auction, which is
          ordinarily <strong>7 working days</strong> from the date of award confirmation.
        </p>
        <ul>
          <li>Payment is made by NEFT/RTGS to the designated account, or through the payment methods offered on the Platform.</li>
          <li>GST and TCS are charged over and above the bid amount at the rates applicable on the date of invoice.</li>
          <li>The EMD already held is adjusted against the amount payable.</li>
          <li>Failure to pay within the stipulated period results in forfeiture of the EMD and cancellation of the award, and the Lot may be offered to the next-ranked bidder or re-listed.</li>
        </ul>
      </>
    ),
  },
  {
    id: "lifting",
    heading: "Lifting, Transport & Title",
    body: (
      <>
        <p>
          Material must be lifted within the period stated on the auction, ordinarily{" "}
          <strong>15 days</strong> from payment confirmation.
        </p>
        <ul>
          <li>All loading, transportation and unloading costs are borne by the Buyer.</li>
          <li>The Buyer must arrange all vehicles, labour, equipment, permits and e-way bills required for lifting.</li>
          <li>Delay beyond the agreed period may attract ground rent or demurrage as specified by the Seller.</li>
          <li>Risk in the material passes to the Buyer on commencement of loading. Title passes on receipt of full payment.</li>
        </ul>
        <p>
          The Buyer is responsible for compliance with all transport, weighment and documentation
          requirements applicable to the movement of the material.
        </p>
      </>
    ),
  },
  {
    id: "compliance",
    heading: "Regulatory Compliance",
    body: (
      <>
        <p>
          Both Buyers and Sellers must comply with all applicable central, state and local laws,
          including but not limited to:
        </p>
        <ul>
          <li>The Goods and Services Tax Act and rules made thereunder</li>
          <li>The E-Waste (Management) Rules, 2022</li>
          <li>The Plastic Waste Management Rules, 2016 (as amended)</li>
          <li>The Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016</li>
          <li>The Environment (Protection) Act, 1986 and CPCB/SPCB directions</li>
        </ul>
        <p>
          Buyers of regulated categories must hold and maintain valid authorisation, and must produce
          proof of such authorisation before lifting. Scrapify Auctions may withhold release of
          material where valid authorisation is not evidenced.
        </p>
      </>
    ),
  },
  {
    id: "platform-role",
    heading: "Role of Scrapify Auctions",
    body: (
      <>
        <p>
          Scrapify Auctions operates the Platform as a facilitator and marketplace. The contract for
          sale is formed <strong>directly between the Buyer and the Seller</strong>. We are not the
          seller, purchaser, importer, exporter, consignor or consignee of any material transacted on
          the Platform.
        </p>
        <p>
          We do not warrant the quality, quantity, grade, legal title or fitness for purpose of any
          material listed. Listing content, including descriptions, photographs and specifications, is
          supplied by the Seller and is the Seller's responsibility.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of Liability & Indemnity",
    body: (
      <>
        <p>
          To the maximum extent permitted by law, Scrapify Auctions shall not be liable for any
          indirect, incidental, special, consequential or punitive loss, including loss of profit,
          revenue, business or goodwill, arising out of or in connection with use of the Platform.
        </p>
        <p>
          Our aggregate liability in respect of any auction shall not exceed the platform fee actually
          received by us in respect of that auction.
        </p>
        <p>
          You agree to indemnify and hold harmless Scrapify Auctions, its directors, employees and
          agents against any claim, demand, penalty, loss or expense arising from your breach of these
          Terms, your breach of applicable law, or any dispute between you and another Platform user.
        </p>
      </>
    ),
  },
  {
    id: "suspension",
    heading: "Suspension & Termination",
    body: (
      <>
        <p>
          We may suspend or terminate an account, withhold an award, or restrict access to the
          Platform where we reasonably believe that a user has breached these Terms, provided false
          information, engaged in prohibited bidding conduct, failed to meet payment or lifting
          obligations, or failed to maintain required regulatory authorisation.
        </p>
        <p>
          Suspension does not relieve a user of obligations already incurred, including payment and
          lifting obligations in respect of a concluded auction.
        </p>
      </>
    ),
  },
  {
    id: "disputes",
    heading: "Dispute Resolution & Governing Law",
    body: (
      <>
        <p>
          Any dispute shall first be raised through the Platform's dispute process and pursued in good
          faith between the parties for a period of <strong>15 days</strong>.
        </p>
        <p>
          Where a dispute remains unresolved, it shall be referred to arbitration by a sole arbitrator
          under the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be the city
          in which the Seller's registered office is located, and proceedings shall be conducted in
          English.
        </p>
        <p>
          These Terms are governed by the laws of India, and subject to the arbitration clause above,
          the courts at the Seller's registered office shall have jurisdiction.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    heading: "Changes to These Terms",
    body: (
      <>
        <p>
          We may amend these Terms from time to time. Material changes will be notified through the
          Platform or by email. Continued use of the Platform after a change takes effect constitutes
          acceptance of the amended Terms.
        </p>
        <p>
          Auction-specific terms and conditions, including category-specific conditions, are published
          on each auction and prevail over these general Terms to the extent of any inconsistency for
          that auction.
        </p>
      </>
    ),
  },
];

function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="The agreement between you and Scrapify Auctions governing registration, bidding, payment, lifting and dispute resolution on our B2B industrial scrap marketplace."
      updated="15 September 2026"
      sections={SECTIONS}
      footer={
        <>
          <p className="font-semibold text-foreground">Questions about these Terms?</p>
          <p className="mt-1">
            Write to{" "}
            <a href="mailto:legal@scrapifyauctions.com">legal@scrapifyauctions.com</a> or visit our{" "}
            <a href="/help">Help &amp; Support</a> page.
          </p>
        </>
      }
    />
  );
}
