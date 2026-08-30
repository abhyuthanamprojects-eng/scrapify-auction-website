import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, ShieldCheck, Upload, AlertCircle, RefreshCw, Eye } from "lucide-react";
import { Card, PageHead, Pill, Table } from "@/components/console/shell";

export const Route = createFileRoute("/portal/documents")({
  head: () => ({
    meta: [
      { title: "Enterprise Document Vault — Scrapify Vendor Portal" },
      { name: "description", content: "Corporate statutory certificates, GST, PAN, PCB Consent, and MSME filings." },
    ],
  }),
  component: VendorDocumentsPage,
});

function VendorDocumentsPage() {
  const [docs, setDocs] = useState([
    { id: "DOC-GST-01", name: "GST Registration Certificate (REG-06)", type: "Tax & Statutory", status: "verified", size: "1.4 MB", expiry: "Permanent" },
    { id: "DOC-PAN-01", name: "Company PAN Card", type: "Tax & Statutory", status: "verified", size: "840 KB", expiry: "Permanent" },
    { id: "DOC-PCB-01", name: "Pollution Control Board Consent to Operate", type: "Environmental & Safety", status: "expiring_soon", size: "3.8 MB", expiry: "15-Sep-2026" },
    { id: "DOC-ISO-01", name: "ISO 9001:2015 Quality Certificate", type: "Technical", status: "under_review", size: "2.2 MB", expiry: "12-Dec-2027" },
    { id: "DOC-BNK-01", name: "Cancelled Cheque & Penny-Drop Verification", type: "Financial", status: "verified", size: "1.1 MB", expiry: "Verified" },
    { id: "DOC-POA-01", name: "Board Resolution / Power of Attorney", type: "Legal", status: "rejected", size: "1.9 MB", expiry: "Missing seal", reason: "Missing 2nd director counter-signature and corporate seal." },
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead
        title="Enterprise Document Vault"
        subtitle="Manage verified statutory credentials, environmental consents, and financial settlement certificates."
        actions={
          <div className="flex gap-2">
            <Link to="/portal" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
              Back to Portal
            </Link>
            <button
              onClick={() => alert("Uploading new compliance document...")}
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white"
            >
              <Upload className="h-4 w-4" /> Upload Document
            </button>
          </div>
        }
      />

      <Card title="Statutory & Compliance Certificates (6 Documents)" desc="Tier 1 Vendor Clearance Status">
        <Table head={["Document Name", "Category", "Size / Expiry", "Verification Status", "Actions"]}>
          {docs.map((d) => (
            <tr key={d.id}>
              <td className="py-3">
                <div className="font-bold text-foreground">{d.name}</div>
                <div className="text-[11px] font-mono text-muted-foreground">{d.id}</div>
                {d.status === "rejected" && d.reason && (
                  <div className="mt-1 text-[11px] text-destructive font-medium bg-destructive/10 p-1.5 rounded">
                    Rejection: {d.reason}
                  </div>
                )}
              </td>
              <td className="py-3 text-xs text-muted-foreground">{d.type}</td>
              <td className="py-3 text-xs font-medium">
                {d.size} • <span className={d.status === "expiring_soon" ? "text-[color:var(--auction)] font-bold" : "text-muted-foreground"}>{d.expiry}</span>
              </td>
              <td className="py-3">
                <Pill tone={d.status === "verified" ? "good" : d.status === "rejected" ? "bad" : "warn"}>
                  {d.status.replace("_", " ").toUpperCase()}
                </Pill>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => alert(`Opening secure watermarked viewer for ${d.name}`)}
                    className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  {(d.status === "rejected" || d.status === "expiring_soon") && (
                    <button
                      onClick={() => alert(`Replacing document ${d.name}`)}
                      className="inline-flex items-center gap-1 rounded bg-[color:var(--navy)] px-2.5 py-1 text-xs font-bold text-white"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Replace
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
