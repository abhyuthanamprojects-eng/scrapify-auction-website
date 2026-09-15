import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Scrapify Auctions" },
      {
        name: "description",
        content:
          "How Scrapify Auctions collects, uses, stores and protects business and personal data across our website and mobile applications.",
      },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS: LegalSection[] = [
  {
    id: "scope",
    heading: "Scope of This Policy",
    body: (
      <>
        <p>
          This Privacy Policy explains how Scrapify Auctions ("we", "us") collects, uses, discloses
          and protects information when you use our website, our Android and iOS applications, and
          related services (collectively, the "Platform").
        </p>
        <p>
          Scrapify Auctions is a business-to-business marketplace. Most information we hold relates to
          business entities and to the individuals who act on their behalf in a professional capacity.
        </p>
      </>
    ),
  },
  {
    id: "data-collected",
    heading: "Information We Collect",
    body: (
      <>
        <p><strong>Information you provide directly</strong></p>
        <ul>
          <li><strong>Account details</strong> — name, email address, mobile number, password or OTP verification</li>
          <li><strong>Business details</strong> — registered entity name, constitution, address, operating locations</li>
          <li><strong>Statutory identifiers</strong> — GSTIN, PAN, and where applicable CIN and regulatory authorisation numbers</li>
          <li><strong>Financial details</strong> — bank account number, IFSC, account holder name, for settlement and refunds</li>
          <li><strong>Documents</strong> — verification certificates, licences and supporting files you upload</li>
          <li><strong>Auction content</strong> — listings, item data uploaded via templates, photographs, bids and clarifications</li>
        </ul>
        <p className="pt-2"><strong>Information collected automatically</strong></p>
        <ul>
          <li>Device identifiers, operating system and application version</li>
          <li>IP address and approximate region derived from it</li>
          <li>Usage data — pages and auctions viewed, features used, timestamps of actions</li>
          <li>Diagnostic and crash logs</li>
        </ul>
        <p className="pt-2"><strong>Permissions used by our mobile app</strong></p>
        <ul>
          <li><strong>Camera</strong> — to photograph verification documents and auction items. Images are captured only when you initiate the action.</li>
          <li><strong>Photo library</strong> — to select existing images for document or item upload.</li>
          <li><strong>File access</strong> — to select spreadsheet files when uploading auction item data.</li>
          <li><strong>Biometric</strong> — optional device-level authentication. Biometric data never leaves your device and is never transmitted to us.</li>
        </ul>
        <p>
          We do not collect precise geolocation, contacts, call logs, SMS, or health data.
        </p>
      </>
    ),
  },
  {
    id: "purpose",
    heading: "How We Use Information",
    body: (
      <>
        <p>We process information for the following purposes:</p>
        <ul>
          <li><strong>Operating the Platform</strong> — creating accounts, running auctions, recording bids, issuing awards and processing settlements</li>
          <li><strong>Verification and compliance</strong> — validating GSTIN, PAN and bank details, and meeting KYC/KYB and anti-fraud obligations</li>
          <li><strong>Communications</strong> — transactional notifications about auctions, bids, awards, payment deadlines and account status</li>
          <li><strong>Support</strong> — responding to queries, tickets and disputes</li>
          <li><strong>Safety and integrity</strong> — detecting bid manipulation, collusion and unauthorised access</li>
          <li><strong>Legal obligations</strong> — tax reporting, statutory record-keeping and responses to lawful requests</li>
          <li><strong>Improvement</strong> — aggregate, non-identifying analysis of how the Platform is used</li>
        </ul>
        <p>
          We do not sell personal information, and we do not use your data for third-party advertising.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    heading: "How We Share Information",
    body: (
      <>
        <p>We disclose information only as described below:</p>
        <ul>
          <li><strong>Counterparties</strong> — when an auction concludes, the Buyer and Seller are given the contact and business details necessary to complete the transaction, lifting and invoicing.</li>
          <li><strong>Verification providers</strong> — GSTIN, PAN and bank verification services, used solely to confirm the details you supply.</li>
          <li><strong>Payment and settlement partners</strong> — to process deposits, payments and refunds.</li>
          <li><strong>Infrastructure providers</strong> — cloud hosting, storage, email and SMS delivery, and crash reporting, acting on our instructions under contract.</li>
          <li><strong>Legal and regulatory</strong> — where disclosure is required by law, court order, or a lawful request from a government authority.</li>
          <li><strong>Corporate transactions</strong> — in connection with a merger, acquisition or transfer of assets, subject to equivalent protections.</li>
        </ul>
        <p>
          Bidder identities are not disclosed to other bidders during a live auction. Bids are shown to
          other participants on an anonymised basis.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    heading: "Data Retention",
    body: (
      <>
        <p>
          We retain information for as long as your account is active and thereafter for the period
          required to meet legal, tax, audit and dispute-resolution obligations.
        </p>
        <ul>
          <li><strong>Transaction and auction records</strong> — retained for at least 8 years, in line with statutory record-keeping requirements.</li>
          <li><strong>Verification documents</strong> — retained for the life of the account and for 8 years thereafter.</li>
          <li><strong>Diagnostic and crash logs</strong> — typically retained for 90 days.</li>
        </ul>
        <p>
          Where retention is no longer required, information is deleted or irreversibly anonymised.
        </p>
      </>
    ),
  },
  {
    id: "security",
    heading: "Security",
    body: (
      <>
        <p>
          We apply administrative, technical and physical safeguards appropriate to the sensitivity of
          the information we hold, including:
        </p>
        <ul>
          <li>Encryption of data in transit using TLS</li>
          <li>Encryption at rest for stored documents and databases</li>
          <li>Role-based access control, with access limited to personnel who require it</li>
          <li>Audit logging of privileged and administrative actions</li>
          <li>Token-based authentication with session isolation between the public and administrative surfaces</li>
        </ul>
        <p>
          No method of transmission or storage is completely secure. Where a breach is likely to result
          in significant risk to you, we will notify you and the relevant authority as required by law.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    heading: "Your Rights",
    body: (
      <>
        <p>Subject to applicable law and our retention obligations, you may:</p>
        <ul>
          <li><strong>Access</strong> the personal information we hold about you</li>
          <li><strong>Correct</strong> information that is inaccurate or incomplete</li>
          <li><strong>Request deletion</strong> of information no longer required for a lawful purpose</li>
          <li><strong>Withdraw consent</strong> where processing is based on consent</li>
          <li><strong>Object</strong> to particular processing, or request that it be restricted</li>
          <li><strong>Receive a copy</strong> of information you provided, in a portable format</li>
        </ul>
        <p>
          To exercise any of these rights, write to{" "}
          <a href="mailto:privacy@scrapifyauctions.com">privacy@scrapifyauctions.com</a>. We respond
          within 30 days. Note that we cannot delete records we are legally required to retain, such as
          concluded transaction records.
        </p>
        <p>
          <strong>Account deletion.</strong> You may request deletion of your account from the Platform
          or by writing to us. On deletion we remove your profile and login credentials; transaction
          records retained for statutory purposes are dissociated from your login where possible.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies & Local Storage",
    body: (
      <>
        <p>
          Our website uses cookies and browser local storage to keep you signed in, remember interface
          preferences, and maintain security tokens. These are strictly necessary for the Platform to
          function.
        </p>
        <p>
          We do not use advertising or cross-site tracking cookies. You can clear or block cookies in
          your browser settings, though doing so will prevent you from signing in.
        </p>
      </>
    ),
  },
  {
    id: "children",
    heading: "Children's Privacy",
    body: (
      <p>
        The Platform is a business marketplace intended solely for use by registered commercial
        entities acting through adults authorised to bind them. It is not directed at children, and we
        do not knowingly collect information from anyone under 18. If we learn that we have done so, we
        will delete that information.
      </p>
    ),
  },
  {
    id: "transfers",
    heading: "Data Location & Transfers",
    body: (
      <p>
        Information is primarily stored and processed on infrastructure located in India. Where a
        service provider processes data outside India, we require contractual safeguards that provide a
        comparable level of protection to that required under Indian law.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to This Policy",
    body: (
      <p>
        We may update this Policy to reflect changes in our practices or in the law. Material changes
        will be notified through the Platform or by email before they take effect. The "last updated"
        date above always reflects the current version.
      </p>
    ),
  },
];

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="How Scrapify Auctions collects, uses, shares and protects information across our website and mobile applications — and the rights you have over that information."
      updated="15 September 2026"
      sections={SECTIONS}
      footer={
        <>
          <p className="font-semibold text-foreground">Data protection contact</p>
          <p className="mt-1">
            Scrapify Auctions — Grievance &amp; Data Protection Officer
            <br />
            Email: <a href="mailto:privacy@scrapifyauctions.com">privacy@scrapifyauctions.com</a>
            <br />
            We acknowledge requests within 48 hours and respond within 30 days.
          </p>
        </>
      }
    />
  );
}
