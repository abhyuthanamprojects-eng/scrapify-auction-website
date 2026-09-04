import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  FileText,
  ShieldCheck,
  Upload,
  AlertCircle,
  RefreshCw,
  Eye,
  Download,
  X,
  CheckCircle2,
  Lock,
  FileCheck,
  FileSpreadsheet,
  FileImage,
} from "lucide-react";
import { Card, PageHead, Pill, Table } from "@/components/console/shell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/portal/documents")({
  head: () => ({
    meta: [
      { title: "Enterprise Document Vault — Scrapify Vendor Portal" },
      { name: "description", content: "Corporate statutory certificates, GST, PAN, PCB Consent, and MSME filings." },
    ],
  }),
  component: VendorDocumentsPage,
});

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: "verified" | "under_review" | "rejected" | "expiring_soon";
  size: string;
  expiry: string;
  reason?: string;
  format?: string;
  uploadedAt?: string;
}

function VendorDocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([
    { id: "DOC-GST-01", name: "GST Registration Certificate (REG-06)", type: "Tax & Statutory", status: "verified", size: "1.4 MB", expiry: "Permanent", format: "PDF", uploadedAt: "12 Aug 2026" },
    { id: "DOC-PAN-01", name: "Company PAN Card", type: "Tax & Statutory", status: "verified", size: "840 KB", expiry: "Permanent", format: "PDF", uploadedAt: "12 Aug 2026" },
    { id: "DOC-PCB-01", name: "Pollution Control Board Consent to Operate", type: "Environmental & Safety", status: "expiring_soon", size: "3.8 MB", expiry: "15-Sep-2026", format: "PDF", uploadedAt: "05 Jul 2026" },
    { id: "DOC-ISO-01", name: "ISO 9001:2015 Quality Certificate", type: "Technical", status: "under_review", size: "2.2 MB", expiry: "12-Dec-2027", format: "PDF", uploadedAt: "20 Aug 2026" },
    { id: "DOC-BNK-01", name: "Cancelled Cheque & Penny-Drop Verification", type: "Financial", status: "verified", size: "1.1 MB", expiry: "Verified", format: "PDF", uploadedAt: "10 Aug 2026" },
    { id: "DOC-POA-01", name: "Board Resolution / Power of Attorney", type: "Legal", status: "rejected", size: "1.9 MB", expiry: "Missing seal", reason: "Missing 2nd director counter-signature and corporate seal.", format: "PDF", uploadedAt: "18 Aug 2026" },
  ]);

  // Viewer State
  const [viewDoc, setViewDoc] = useState<DocumentItem | null>(null);

  // Upload/Replace Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<DocumentItem | null>(null);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("Tax & Statutory");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenUpload = (target?: DocumentItem) => {
    if (target) {
      setReplaceTarget(target);
      setDocName(target.name);
      setDocCategory(target.type);
    } else {
      setReplaceTarget(null);
      setDocName("");
      setDocCategory("Tax & Statutory");
    }
    setSelectedFile(null);
    setUploadSuccess(false);
    setIsUploadOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (!docName && !replaceTarget) {
        setDocName(f.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !replaceTarget) return;

    const fileSizeStr = selectedFile
      ? selectedFile.size > 1024 * 1024
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(selectedFile.size / 1024).toFixed(0)} KB`
      : "1.2 MB";

    const formatStr = selectedFile ? selectedFile.name.split(".").pop()?.toUpperCase() || "PDF" : "PDF";

    if (replaceTarget) {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === replaceTarget.id
            ? {
                ...d,
                size: fileSizeStr,
                format: formatStr,
                status: "under_review",
                reason: undefined,
                uploadedAt: "Just now",
              }
            : d
        )
      );
    } else {
      const newId = `DOC-CUSTOM-0${docs.length + 1}`;
      const newDoc: DocumentItem = {
        id: newId,
        name: docName || selectedFile?.name || "Uploaded Certificate",
        type: docCategory,
        status: "under_review",
        size: fileSizeStr,
        expiry: "Verification Pending",
        format: formatStr,
        uploadedAt: "Just now",
      };
      setDocs((prev) => [newDoc, ...prev]);
    }

    setUploadSuccess(true);
    setTimeout(() => {
      setIsUploadOpen(false);
      setUploadSuccess(false);
    }, 1200);
  };

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
              onClick={() => handleOpenUpload()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              <Upload className="h-4 w-4" /> Upload Document
            </button>
          </div>
        }
      />

      <Card title="Statutory & Compliance Certificates" desc="Tier 1 Vendor Clearance Status">
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
                    onClick={() => setViewDoc(d)}
                    className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  {(d.status === "rejected" || d.status === "expiring_soon" || d.status === "verified") && (
                    <button
                      onClick={() => handleOpenUpload(d)}
                      className="inline-flex items-center gap-1 rounded bg-[color:var(--navy)] px-2.5 py-1 text-xs font-bold text-white hover:opacity-90"
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

      {/* SECURE DOCUMENT VIEWER DIALOG */}
      <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 p-1 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <DialogTitle className="text-base font-bold text-[color:var(--navy)]">
                {viewDoc?.name}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {viewDoc?.id} • {viewDoc?.type} • Uploaded {viewDoc?.uploadedAt || "12 Aug 2026"}
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-2 flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-slate-50 p-6 text-center">
            {/* Watermark */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
              <span className="rotate-[-25deg] text-3xl font-black uppercase tracking-widest text-[color:var(--navy)]">
                SCRAPIFY SECURE • AUDIT RECORD
              </span>
            </div>

            <div className="rounded-full bg-white p-4 shadow-sm">
              <FileCheck className="h-12 w-12 text-[color:var(--navy)]" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-foreground">{viewDoc?.name}</h4>
            <p className="text-xs text-muted-foreground">
              Format: {viewDoc?.format || "PDF"} • File Size: {viewDoc?.size} • Verified Cryptographic Signature
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  alert(`Downloading cryptographic copy for ${viewDoc?.name}`);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--navy)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" /> Download Watermarked Copy
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 p-3 text-[11px] text-amber-900 border border-amber-200">
            <div className="flex items-center gap-1.5 font-bold">
              <Lock className="h-3.5 w-3.5 text-amber-700" /> Platform Security & Audit Notice
            </div>
            All statutory downloads and document access are permanently watermarked and recorded in the audit trail.
          </div>

          <DialogFooter>
            <button
              onClick={() => setViewDoc(null)}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPLOAD & REPLACE MODAL */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[color:var(--navy)]">
              {replaceTarget ? `Replace Document: ${replaceTarget.name}` : "Upload Statutory Certificate"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              PDF, PNG, JPEG supported up to 10MB. Clear, legible scans required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDocument} className="space-y-4">
            {!replaceTarget && (
              <div>
                <label className="block text-xs font-bold text-foreground">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PCB Consent to Operate 2026-2027"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[color:var(--auction)] focus:outline-none"
                />
              </div>
            )}

            {!replaceTarget && (
              <div>
                <label className="block text-xs font-bold text-foreground">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[color:var(--auction)] focus:outline-none"
                >
                  <option value="Tax & Statutory">Tax & Statutory</option>
                  <option value="Environmental & Safety">Environmental & Safety</option>
                  <option value="Technical">Technical</option>
                  <option value="Financial">Financial</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Select File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                  selectedFile
                    ? "border-emerald-500 bg-emerald-50/40"
                    : "border-border bg-slate-50 hover:bg-slate-100/70"
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-foreground truncate max-w-[200px]">{selectedFile.name}</div>
                      <div className="text-[11px] text-muted-foreground font-medium">
                        {(selectedFile.size / 1024).toFixed(0)} KB • Ready to submit
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 text-muted-foreground mb-1.5" />
                    <span className="text-xs font-bold text-foreground">Click to browse or drop file here</span>
                    <span className="text-[11px] text-muted-foreground">PDF, JPG, PNG (Max 10MB)</span>
                  </div>
                )}
              </div>
            </div>

            {uploadSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-100 p-2.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Document submitted successfully for verification!
              </div>
            )}

            <DialogFooter className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile && !replaceTarget}
                className="rounded-full bg-[color:var(--navy)] px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                Upload & Submit
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
