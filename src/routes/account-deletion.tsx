import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/account-deletion")({
  head: () => ({
    meta: [
      { title: "Account Deletion — Scrapify Auctions" },
      { name: "description", content: "Request deletion of your Scrapify Auctions account and associated personal data." },
    ],
  }),
  component: AccountDeletionPage,
});

const SECTIONS: LegalSection[] = [
  {
    id: "steps",
    heading: "Delete your account",
    body: (
      <>
        <p>Scrapify Auctions account holders can request permanent account deletion from the signed-in product.</p>
        <ol>
          <li>On the website, sign in and open <strong>My Profile</strong>. On Android or iPhone, open the <strong>Profile</strong> tab.</li>
          <li>Select <strong>Delete account</strong>, review any outstanding auction, EMD, wallet, or settlement obligations, and confirm by typing <strong>DELETE</strong>.</li>
          <li>If an obligation prevents immediate deletion, resolve it or contact support using the registered email address.</li>
        </ol>
        <p>Deleting the account signs you out of all active sessions. You can also request deletion by emailing <a href="mailto:privacy@scrapifyauctions.com?subject=Scrapify%20Auctions%20account%20deletion%20request">privacy@scrapifyauctions.com</a> from your registered email. Include your registered mobile number and vendor code if available; never send a password or OTP.</p>
      </>
    ),
  },
  {
    id: "data",
    heading: "Data deleted and retained",
    body: (
      <>
        <p>After an approved deletion request, we delete the account credentials, profile, business/KYC profile, uploaded verification documents, saved addresses, preferences, tokens, and associated stored files.</p>
        <p>We may retain transaction, auction, bid, payment, tax, audit, and dispute records for the period required by law, financial controls, fraud prevention, or dispute resolution. Retained records are restricted and are not used to keep the account active.</p>
      </>
    ),
  },
  {
    id: "timing",
    heading: "Review and timing",
    body: (
      <>
        <p>Requests are reviewed by our support team. Deletion is normally completed within 30 days after all blockers are cleared. We will email the registered account address if clarification is needed or when the request is completed.</p>
        <p>For help, contact <a href="mailto:support@scrapifyauctions.com">support@scrapifyauctions.com</a>.</p>
      </>
    ),
  },
];

function AccountDeletionPage() {
  return <LegalPage title="Account Deletion" intro="How to permanently delete your Scrapify Auctions account and understand the data that may be retained." updated="22 September 2026" sections={SECTIONS} />;
}
