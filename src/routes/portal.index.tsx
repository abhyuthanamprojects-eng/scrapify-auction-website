import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/console/shell";
import { KycRequired } from "@/components/kyc-required";

export const Route = createFileRoute("/portal/")({
  head: () => ({
    meta: [
      { title: "Bidder Portal — My Invitations & Live Events" },
      {
        name: "description",
        content:
          "Every sourcing event you are invited to: forward and reverse auctions, sealed bids, Dutch and Japanese clocks, RFQ, RFI and RFP, with EMD and terms status.",
      },
    ],
  }),
  component: PortalHome,
});

function PortalHome() {
  return (
    <>
      <PageHead
        title="My Invitations & Bids"
        subtitle="Complete your verification to access bidding features."
      />
      <KycRequired feature="My Invitations & Bids" />
    </>
  );
}
