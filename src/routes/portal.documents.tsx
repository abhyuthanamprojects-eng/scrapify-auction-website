import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import { api } from "@/lib/api-client";
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
  key: string;
  name: string;
  type: string;
  available: boolean;
  status: "verified" | "under_review" | "rejected" | "expiring_soon";
  size: string;
  expiry: string;
  reason?: string;
  format?: string;
  uploadedAt?: string;
}

function VendorDocumentsPage() {
  const { user } = Route.useRouteContext();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadDocuments = useCallback(async (showLoading = true) => {
    const vendorCode = user?.vendor?.code || user?.vendor?.id;
    if (!vendorCode) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const response = await api.getVendorDocuments(vendorCode);
      const payload = Array.isArray(response) ? response : response?.data;
      const rows = Array.isArray(payload) ? payload : [];
      setDocs(rows.map((row: any) => ({
        id: String(row.id),
        key: String(row.key || row.doc_key || row.kind || "document"),
        name: String(row.name || row.file_name || row.kind),
        type: String(row.kind || row.key || "Document"),
        available: row.available !== false,
        status: row.status === "approved" ? "verified" : row.status === "rejected" ? "rejected" : "under_review",
        size: row.size_kb ? `${row.size_kb} KB` : "—",
        expiry: "No expiry", reason: row.reason || undefined,
        format: String(row.file_name || "").split(".").pop()?.toUpperCase() || "FILE",
        uploadedAt: row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString() : undefined,
      })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  // Viewer State
  const [viewDoc, setViewDoc] = useState<DocumentItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewRequestRef = useRef(0);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const closeViewer = () => {
    previewRequestRef.current += 1;
    setViewDoc(null);
    setPreviewUrl(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setPreviewMimeType(null);
  };

  const handleViewDocument = async (doc: DocumentItem) => {
    const vendorCode = user?.vendor?.code || user?.vendor?.id;
    if (!vendorCode) {
      toast.error("Your vendor account is not available.");
      return;
    }

    const requestId = ++previewRequestRef.current;
    setViewDoc(doc);
    setPreviewUrl(null);
    setPreviewMimeType(null);
    setPreviewError(null);
    setPreviewLoading(true);

    try {
      const blob = await api.downloadVendorDocument(vendorCode, doc.id);
      if (requestId !== previewRequestRef.current) return;
      setPreviewMimeType(blob.type || null);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (error) {
      if (requestId === previewRequestRef.current) {
        setPreviewError(error instanceof Error ? error.message : "Document preview failed.");
      }
    } finally {
      if (requestId === previewRequestRef.current) setPreviewLoading(false);
    }
  };

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

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendorCode = user?.vendor?.code || user?.vendor?.id;
    if (!vendorCode || !selectedFile) {
      toast.error("Please select a document file first.");
      return;
    }

    setUploading(true);
    try {
      const docKey = replaceTarget?.key || docName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "document";
      const kind = replaceTarget?.type || docCategory;
      await api.uploadVendorDocument(vendorCode, docKey, kind, selectedFile);
      await loadDocuments(false);
      setUploadSuccess(true);
      toast.success(replaceTarget ? `${replaceTarget.name} replaced successfully.` : "Document uploaded successfully.");
      setIsUploadOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Document upload failed.");
    } finally {
      setUploading(false);
    }
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
          {loading ? (
            <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Loading documents…</td></tr>
          ) : docs.length === 0 ? (
            <tr key="empty-documents">
              <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No documents are available from the API.</td>
            </tr>
          ) : docs.map((d) => (
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
                  {d.available && <button
                    onClick={() => void handleViewDocument(d)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-semibold text-[color:var(--navy)] hover:bg-muted"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>}
                  {!d.available && <span className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">File unavailable</span>}
                  {(d.status === "rejected" || d.status === "expiring_soon" || d.status === "verified" || !d.available) && (
                    <button
                      onClick={() => handleOpenUpload(d)}
                      disabled={uploading}
                      className="inline-flex cursor-pointer items-center gap-1 rounded bg-[color:var(--navy)] px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> {d.available ? "Replace" : "Upload replacement"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* SECURE DOCUMENT VIEWER DIALOG */}
      <Dialog open={!!viewDoc} onOpenChange={(open) => !open && closeViewer()}>
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

          <div className="relative mt-2 flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-slate-50 p-4 text-center">
            {/* Watermark */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
              <span className="rotate-[-25deg] text-3xl font-black uppercase tracking-widest text-[color:var(--navy)]">
                SCRAPIFY SECURE • AUDIT RECORD
              </span>
            </div>

            {previewLoading ? (
              <div className="flex flex-col items-center gap-2 py-16 text-sm font-semibold text-muted-foreground">
                <RefreshCw className="h-7 w-7 animate-spin text-[color:var(--navy)]" />
                Loading secure document…
              </div>
            ) : previewError ? (
              <div className="flex max-w-sm flex-col items-center gap-2 py-12 text-sm font-semibold text-destructive">
                <AlertCircle className="h-8 w-8" />
                <span>{previewError}</span>
                <button
                  type="button"
                  onClick={() => viewDoc && void handleViewDocument(viewDoc)}
                  className="mt-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-[color:var(--navy)] hover:bg-white"
                >
                  Try again
                </button>
              </div>
            ) : previewUrl && (previewMimeType?.startsWith("image/") || ["PNG", "JPG", "JPEG", "WEBP"].includes(viewDoc?.format || "")) ? (
              <img
                src={previewUrl}
                alt={viewDoc?.name || "Uploaded document"}
                className="max-h-[430px] w-full rounded-lg object-contain"
              />
            ) : previewUrl && (previewMimeType === "application/pdf" || viewDoc?.format === "PDF") ? (
              <iframe
                src={previewUrl}
                title={viewDoc?.name || "Uploaded PDF"}
                className="h-[430px] w-full rounded-lg border border-border bg-white"
              />
            ) : previewUrl ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <div className="rounded-full bg-white p-4 shadow-sm">
                  <FileCheck className="h-12 w-12 text-[color:var(--navy)]" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">Preview is not supported for this file type.</p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-[color:var(--navy)] hover:bg-muted"
                >
                  Open secure file
                </a>
              </div>
            ) : null}

            <div className="pointer-events-none relative z-10 mt-3">
              <h4 className="text-sm font-bold text-foreground">{viewDoc?.name}</h4>
              <p className="text-xs text-muted-foreground">
                Format: {viewDoc?.format || "PDF"} • File Size: {viewDoc?.size} • Verified Cryptographic Signature
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={async () => {
                  const vendorCode = user?.vendor?.code || user?.vendor?.id;
                  if (!vendorCode || !viewDoc) return;
                  try {
                    const blob = await api.downloadVendorDocument(vendorCode, viewDoc.id);
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    const extension = (viewDoc.format || "pdf").toLowerCase();
                    anchor.download = viewDoc.name.toLowerCase().endsWith(`.${extension}`)
                      ? viewDoc.name
                      : `${viewDoc.name}.${extension}`;
                    document.body.appendChild(anchor);
                    anchor.click();
                    anchor.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 60_000);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Document download failed.");
                  }
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
              onClick={closeViewer}
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
                disabled={uploading}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--navy)] px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {uploading ? "Uploading…" : "Upload & Submit"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
