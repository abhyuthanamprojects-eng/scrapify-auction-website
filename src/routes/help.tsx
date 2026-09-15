import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Support — Scrapify Auctions" },
      {
        name: "description",
        content:
          "Get help with registration, business verification, auction templates, EMD, bidding, payment and lifting on Scrapify Auctions.",
      },
    ],
  }),
  component: HelpPage,
});

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-border bg-card px-4 py-3 [&_p]:mt-2">
      <summary className="cursor-pointer list-none font-semibold text-foreground marker:content-none">
        <span className="mr-2 inline-block text-[color:var(--auction)] transition-transform group-open:rotate-90">
          ›
        </span>
        {q}
      </summary>
      <div className="pl-5 text-sm leading-relaxed text-muted-foreground">{a}</div>
    </details>
  );
}

const SECTIONS: LegalSection[] = [
  {
    id: "contact",
    heading: "Contact Us",
    body: (
      <>
        <p>Our support team operates Monday to Saturday, 9:30 AM – 6:30 PM IST.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              General support
            </p>
            <p className="mt-1">
              <a href="mailto:support@scrapifyauctions.com">support@scrapifyauctions.com</a>
            </p>
            <p className="mt-1 text-xs">Response within 1 working day</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Live auction help
            </p>
            <p className="mt-1">
              <a href="tel:+918000000000">+91 80000 00000</a>
            </p>
            <p className="mt-1 text-xs">Priority line during a live auction</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Verification &amp; KYC
            </p>
            <p className="mt-1">
              <a href="mailto:kyc@scrapifyauctions.com">kyc@scrapifyauctions.com</a>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Payments &amp; refunds
            </p>
            <p className="mt-1">
              <a href="mailto:finance@scrapifyauctions.com">finance@scrapifyauctions.com</a>
            </p>
          </div>
        </div>
        <p className="pt-2">
          Signed-in users can raise a tracked ticket from the Support section of the app or web
          console, which is the fastest route for auction-specific issues.
        </p>
      </>
    ),
  },
  {
    id: "getting-started",
    heading: "Getting Started",
    body: (
      <div className="space-y-2">
        <Faq
          q="How do I register?"
          a={
            <>
              <p>
                Register with your mobile number and verify it with the OTP we send. You then complete
                your business profile — entity name, GSTIN, PAN, address and bank details — and upload
                supporting documents.
              </p>
              <p>
                Registration is free. Verification usually completes within 1–2 working days, after
                which you can bid or list.
              </p>
            </>
          }
        />
        <Faq
          q="Why does my account say verification pending?"
          a={
            <p>
              Your details are being checked against GSTIN and PAN records and your documents reviewed.
              You can browse auctions while pending, but bidding and listing unlock only after
              approval. If something fails validation we email you with the specific reason.
            </p>
          }
        />
        <Faq
          q="Can I act as both buyer and seller?"
          a={
            <p>
              Yes. A verified entity can list material and bid on other auctions from the same account.
              You cannot bid on your own auction.
            </p>
          }
        />
      </div>
    ),
  },
  {
    id: "selling",
    heading: "Listing & Auction Templates",
    body: (
      <div className="space-y-2">
        <Faq
          q="How do I create an auction?"
          a={
            <p>
              Open Create Auction, choose your category and subcategory, then work through the wizard —
              identification, item data, inspection, pricing and schedule. Your auction is submitted for
              approval, and goes live on the schedule you set once approved.
            </p>
          }
        />
        <Faq
          q="What is the Excel template and where do I get it?"
          a={
            <>
              <p>
                Each category has its own Excel template defining the columns we expect for that
                material — for example brand, model and functional status for e-waste, or grade and
                purity for non-ferrous.
              </p>
              <p>
                Once you select a category in the Create Auction wizard, a Download Template button
                appears. Fill in one row per item, then upload the completed file in the same step.
              </p>
            </>
          }
        />
        <Faq
          q="My template upload was rejected. Why?"
          a={
            <>
              <p>Uploads are validated row by row. The most common causes are:</p>
              <ul className="ml-4 mt-1 list-disc space-y-1">
                <li>Column headers were edited or reordered — leave row 1 exactly as downloaded</li>
                <li>A required field is blank (item name, quantity, unit, reference value)</li>
                <li>A numeric field contains text, or a unit is outside the allowed list</li>
                <li>The file was saved in a format other than .xlsx</li>
              </ul>
              <p>
                The error message names the row and column, so you can correct just those cells and
                re-upload.
              </p>
            </>
          }
        />
        <Faq
          q="Can I add items without a template?"
          a={
            <p>
              For categories that allow manual entry, yes — you can add lots one at a time in the
              wizard. The template is faster for more than a handful of items and is required for some
              categories.
            </p>
          }
        />
      </div>
    ),
  },
  {
    id: "buying",
    heading: "EMD, Bidding & Winning",
    body: (
      <div className="space-y-2">
        <Faq
          q="What is EMD and why do I need it?"
          a={
            <p>
              Earnest Money Deposit is a refundable security amount that confirms you are a serious
              bidder. It must be deposited before you can place a bid. If you do not win, it is
              refunded — ordinarily within 7 working days of the result being finalised. If you win, it
              is adjusted against your payment.
            </p>
          }
        />
        <Faq
          q="Why was my bid rejected?"
          a={
            <>
              <p>Usually one of:</p>
              <ul className="ml-4 mt-1 list-disc space-y-1">
                <li>The bid was below the current highest plus the minimum increment</li>
                <li>Someone outbid you between loading the page and submitting</li>
                <li>Your EMD is not yet confirmed, or verification is still pending</li>
                <li>The auction or the current slot had already closed</li>
              </ul>
              <p>The message shown at the time names the exact minimum you need to bid.</p>
            </>
          }
        />
        <Faq
          q="What is a proxy bid?"
          a={
            <p>
              A proxy bid lets you set a maximum. The system bids on your behalf in minimum increments
              only as far as needed to keep you in front, up to that maximum. You can cancel or change
              it at any time while the auction is live.
            </p>
          }
        />
        <Faq
          q="I placed the highest bid — when do I know I have won?"
          a={
            <p>
              When the auction closes, the result is finalised and the award is issued to the top
              bidder. You are notified in the app and by email, and the award appears in your Awards
              section with the payment deadline.
            </p>
          }
        />
        <Faq
          q="Why is my EMD still held even though I did not win?"
          a={
            <p>
              The runner-up's EMD may be retained briefly in case the winning bidder does not complete
              payment and the award passes to the next-ranked bidder. Once the winner completes payment,
              it is released for refund.
            </p>
          }
        />
      </div>
    ),
  },
  {
    id: "after",
    heading: "Payment, Lifting & Disputes",
    body: (
      <div className="space-y-2">
        <Faq
          q="How long do I have to pay?"
          a={
            <p>
              Ordinarily 7 working days from award confirmation, unless the auction states otherwise.
              GST and TCS apply over the bid amount, and your EMD is adjusted against the total. Missing
              the deadline forfeits the EMD and cancels the award.
            </p>
          }
        />
        <Faq
          q="How long do I have to lift the material?"
          a={
            <p>
              Ordinarily 15 days from payment confirmation. Transport, labour, permits and e-way bills
              are the buyer's responsibility. Delay beyond the agreed window may attract ground rent
              from the seller.
            </p>
          }
        />
        <Faq
          q="The material does not match the listing. What can I do?"
          a={
            <p>
              Raise a dispute from the order within the window stated on the auction, attaching
              photographs and weighment records. Note that material is sold as-is, where-is, and claims
              on quality or quantity are difficult to sustain where the inspection window was not used —
              so inspect before bidding wherever possible.
            </p>
          }
        />
        <Faq
          q="When will my EMD refund arrive?"
          a={
            <p>
              Refunds are queued once the result is finalised and are typically credited within 7
              working days to the bank account on your profile. If it has been longer, write to finance
              with your auction code.
            </p>
          }
        />
      </div>
    ),
  },
  {
    id: "account",
    heading: "Account & Technical",
    body: (
      <div className="space-y-2">
        <Faq
          q="I am not receiving the OTP."
          a={
            <p>
              Check that the number on your profile is correct and has signal, and look in your spam
              folder if using email OTP. Wait for the resend timer rather than requesting repeatedly, as
              rapid repeat requests are rate-limited. If it still does not arrive, contact support with
              the number you are trying.
            </p>
          }
        />
        <Faq
          q="How do I change my registered mobile number or bank details?"
          a={
            <p>
              Bank details and registered contact details affect settlement and verification, so changes
              are made through support rather than self-service. Write to kyc@scrapifyauctions.com from
              your registered email with the supporting document.
            </p>
          }
        />
        <Faq
          q="How do I delete my account?"
          a={
            <p>
              Write to privacy@scrapifyauctions.com from your registered email. We remove your profile
              and credentials. Concluded transaction records are retained where statute requires, as
              described in our Privacy Policy.
            </p>
          }
        />
        <Faq
          q="The app is slow or a screen will not load."
          a={
            <p>
              Confirm you are on the latest version from the Play Store or App Store, check your
              connection, and force-close and reopen the app. If it persists, send us your device model,
              OS version and app version with a screenshot.
            </p>
          }
        />
      </div>
    ),
  },
  {
    id: "grievance",
    heading: "Grievance Redressal",
    body: (
      <>
        <p>
          In accordance with applicable Indian law, complaints that are not resolved through normal
          support may be escalated to our Grievance Officer.
        </p>
        <p>
          <strong>Grievance Officer</strong>
          <br />
          Scrapify Auctions
          <br />
          Email: <a href="mailto:grievance@scrapifyauctions.com">grievance@scrapifyauctions.com</a>
        </p>
        <p>
          We acknowledge every grievance within 48 hours and aim to resolve it within 30 days. Please
          include your registered entity name, auction code where relevant, and a description of the
          issue.
        </p>
      </>
    ),
  },
];

function HelpPage() {
  return (
    <LegalPage
      title="Help & Support"
      intro="Answers to common questions about registration, templates, EMD, bidding, payment and lifting — and how to reach a human when you need one."
      updated="15 September 2026"
      sections={SECTIONS}
      footer={
        <>
          <p className="font-semibold text-foreground">Still stuck?</p>
          <p className="mt-1">
            Email <a href="mailto:support@scrapifyauctions.com">support@scrapifyauctions.com</a> with
            your entity name and the auction code, and we will pick it up from there.
          </p>
        </>
      }
    />
  );
}
