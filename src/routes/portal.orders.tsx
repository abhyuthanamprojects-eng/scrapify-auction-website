import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/console/shell";
import { KycRequired } from "@/components/kyc-required";

export const Route = createFileRoute("/portal/orders")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Fulfilment Orders & Contracts — Scrapify Vendor Portal" },
      {
        name: "description",
        content: "Vendor order tracking, gate passes, weighbridge slips, and milestone completion.",
      },
    ],
  }),
  component: VendorOrdersPage,
});

function VendorOrdersPage() {
  return (
    <>
      <PageHead
        title="My Orders & Fulfilment Deliveries"
        subtitle="Complete your verification to access order tracking."
      />
      <KycRequired feature="Orders & Fulfilment" />
    </>
  );
}
