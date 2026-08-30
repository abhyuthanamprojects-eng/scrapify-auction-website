import { Link } from "@tanstack/react-router";
import { AlertTriangle, Ban, Clock3 } from "lucide-react";
import { useRegistration } from "@/hooks/use-registration";

/** Shows the admin-produced vendor status. The customer panel never invents it. */
export function VendorStatusBanner() {
  const { state } = useRegistration();
  const status = state.vendorStatus;

  if (status === "pending") {
    return (
      <Band tone="amber" icon={Clock3}>
        <b>Under review</b> — usually within 24 hours. Bidding stays locked until an
        admin approves your KYC.{" "}
        <Link to="/register" className="font-semibold underline">
          Check status
        </Link>
      </Band>
    );
  }

  if (status === "rejected") {
    return (
      <Band tone="red" icon={AlertTriangle}>
        <b>Registration rejected</b> — reason: “{state.statusReason || "Not specified"}”.{" "}
        <Link to="/register" className="font-semibold underline">
          Edit &amp; resubmit
        </Link>
      </Band>
    );
  }

  if (status === "suspended") {
    return (
      <Band tone="red" icon={Ban}>
        <b>Account suspended</b> — reason: “{state.statusReason || "Not specified"}”.
        Bidding is blocked. Contact support at support@scrapify.in
      </Band>
    );
  }

  return null;
}

function Band({
  tone,
  icon: Icon,
  children,
}: {
  tone: "amber" | "red";
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const cls =
    tone === "amber"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-900"
      : "border-destructive/40 bg-destructive/10 text-destructive";
  return (
    <div className={`border-b ${cls}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 text-sm sm:px-6">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{children}</span>
      </div>
    </div>
  );
}
