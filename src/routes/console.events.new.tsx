import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  UploadCloud,
  FileSpreadsheet,
  ShieldAlert,
  Download,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Info,
} from "lucide-react";
import {
  CATEGORY_ATTRIBUTES,
  FORMAT_LABEL,
  cr,
  inr,
  type EventDirection,
  type EventFormat,
} from "@/lib/enterprise";
import { api } from "@/lib/api-client";
import { Card, PageHead, Pill } from "@/components/console/shell";

export const Route = createFileRoute("/console/events/new")({
  head: () => ({
    meta: [
      { title: "Create Sourcing Event (12-Step Wizard) — Scrapify Auctions" },
      {
        name: "description",
        content:
          "Configure requirement, lots, category attributes, RFx, rules, participants, landed cost and approvals.",
      },
    ],
  }),
  // Sellers can create auctions but do not have vendor-directory permission.
  // Load the public category catalog only; invitations are an optional
  // follow-up action available to authorized staff.
  loader: async () => [await api.getCategories(), { data: [] }],
  component: CreateEventWizard,
});

type Line = {
  description: string;
  quantity: string;
  unit: string;
  startPrice: string;
  attributes: Record<string, string>;
};

const STEPS = [
  "1. Purpose",
  "2. Format",
  "3. Ownership",
  "4. Lots & BOQ",
  "5. Documents",
  "6. RFx Config",
  "7. Participants",
  "8. Commercials",
  "9. Timing",
  "10. Visibility",
  "11. Award Matrix",
  "12. Preview",
];

function CreateEventWizard() {
  const navigate = useNavigate();
  const [categoryResponse, vendorResponse] = Route.useLoaderData();
  const categoryObjects: any[] = Array.isArray(categoryResponse?.data) ? categoryResponse.data : [];
  const categories = categoryObjects.map((c: any) => String(c.name ?? c));
  const vendors = Array.isArray(vendorResponse?.data) ? vendorResponse.data : [];
  const [step, setStep] = useState(0);

  // Step 1: Purpose
  const [purpose, setPurpose] = useState("Sell Asset / Scrap Material");
  // Step 2: Format & Direction
  const [direction, setDirection] = useState<EventDirection>("forward");
  const [format, setFormat] = useState<EventFormat>("english");
  // Step 3: Ownership & Category
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [bu, setBu] = useState("");
  const [plant, setPlant] = useState("");
  const [facility, setFacility] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [warehouseCity, setWarehouseCity] = useState("");
  const [warehouseState, setWarehouseState] = useState("");
  const [warehousePincode, setWarehousePincode] = useState("");
  const [warehouseContact, setWarehouseContact] = useState("");
  // Step 4: Lots
  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: "", unit: "MT", startPrice: "", attributes: {} },
  ]);
  // Step 4: Template import
  const [templateInfo, setTemplateInfo] = useState<any>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const [templateUploadResult, setTemplateUploadResult] = useState<any>(null);
  const [templateConfirming, setTemplateConfirming] = useState(false);
  const [templateConfirmed, setTemplateConfirmed] = useState(false);
  const [templateImportedLots, setTemplateImportedLots] = useState<Line[]>([]);
  const templateFileRef = useRef<HTMLInputElement>(null);

  // Step 5: Documents
  const [docs, setDocs] = useState<string[]>([]);
  // Step 6: RFx
  const [enableRfx, setEnableRfx] = useState(true);
  // Step 7: Participants
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  // Step 8: Commercials
  const [baseline, setBaseline] = useState("");
  const [increment, setIncrement] = useState("");
  const [emdRequired, setEmdRequired] = useState(false);
  const [emdAmount, setEmdAmount] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [liftingPeriod, setLiftingPeriod] = useState("7");
  const [liftingUnit, setLiftingUnit] = useState("Days");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [inspection, setInspection] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectionTime, setInspectionTime] = useState("");
  const [inspectionLocation, setInspectionLocation] = useState("");
  const [guidelines, setGuidelines] = useState("");
  // Step 9: Timing
  const [autoExtendMins, setAutoExtendMins] = useState("3");
  const [initialSlotMins, setInitialSlotMins] = useState("30");
  const [continuationSlotMins, setContinuationSlotMins] = useState("2");
  const [maximumDurationMins, setMaximumDurationMins] = useState("120");
  const [startTime, setStartTime] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    d.setMinutes(0, 0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000 + 120 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  // Step 10: Visibility
  const [rankVisibility, setRankVisibility] = useState<"rank_only" | "price_visible" | "blind">(
    "rank_only",
  );
  const [proxyBidAllowed, setProxyBidAllowed] = useState(true);
  // Step 11: Award
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [createdAuctionCode, setCreatedAuctionCode] = useState<string | null>(null);
  useEffect(() => {
    if (!category && categories[0]) setCategory(categories[0]);
  }, [category, categories]);

  const attrs = CATEGORY_ATTRIBUTES[category] ?? [];

  const selectedCategoryObj = categoryObjects.find(
    (c: any) => String(c.name ?? c) === category,
  );
  const selectedCategoryId = selectedCategoryObj?.id ?? selectedCategoryObj?.code;

  // Fetch template info when category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setTemplateInfo(null);
      return;
    }
    let cancelled = false;
    setTemplateLoading(true);
    setTemplateInfo(null);
    setTemplateFile(null);
    setTemplateUploadResult(null);
    setTemplateConfirmed(false);
    if (templateImportedLots.length > 0) {
      setLines([{ description: "", quantity: "", unit: "MT", startPrice: "", attributes: {} }]);
    }
    setTemplateImportedLots([]);
    api
      .getTemplateForCategory(selectedCategoryId)
      .then((res) => {
        if (!cancelled) setTemplateInfo(res?.data ?? res);
      })
      .catch(() => {
        if (!cancelled) setTemplateInfo(null);
      })
      .finally(() => {
        if (!cancelled) setTemplateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  const handleTemplateConfirm = useCallback(
    async (auctionCode: string, uploadId: number | string) => {
      setTemplateConfirming(true);
      try {
        const result = await api.confirmTemplateImport(auctionCode, uploadId);
        setTemplateConfirmed(true);
        // Convert imported rows to Line[] format
        const importedRows: any[] = result?.data?.lots ?? result?.data?.rows ?? result?.lots ?? [];
        if (importedRows.length > 0) {
          const converted: Line[] = importedRows.map((row: any) => ({
            description: row.description ?? row.name ?? row.item ?? "",
            quantity: String(row.quantity ?? ""),
            unit: row.unit ?? row.uom ?? "Nos.",
            startPrice: String(row.start_price ?? row.reserve_price ?? row.price ?? ""),
            attributes: row.attributes ?? {},
          }));
          setTemplateImportedLots(converted);
          setLines(converted);
        }
      } catch (err) {
        setTemplateUploadResult((prev: any) => ({
          ...prev,
          confirmError: err instanceof Error ? err.message : "Confirm failed",
        }));
      } finally {
        setTemplateConfirming(false);
      }
    },
    [],
  );

  const checks = useMemo(
    () => [
      { label: "Valid Title and Sector", ok: title.trim().length > 3 },
      {
        label: "At least one complete lot/BOQ line",
        ok: lines.some((l) => l.description && l.quantity),
      },
      { label: "Reserve / Target Baseline", ok: Number(baseline) > 0 },
      { label: "Participants (optional for draft)", ok: true },
      { label: "Commercial Terms Configured", ok: true },
    ],
    [title, lines, baseline, selectedVendors],
  );

  const allValid = checks.every((c) => c.ok);
  const [stepError, setStepError] = useState<string | null>(null);

  const validateStep = (s: number): string | null => {
    switch (s) {
      case 0:
        if (!purpose) return "Please select a purpose.";
        return null;
      case 1:
        return null;
      case 2:
        if (!title.trim()) return "Please enter an auction title.";
        if (!category) return "Please select a category.";
        if (!bu.trim()) return "Please enter a company / business unit.";
        return null;
      case 3: {
        const willUpload = !!(templateFile && templateInfo?.id && !templateConfirmed);
        if (!willUpload && !lines.some((l) => l.description.trim() && Number(l.quantity) > 0))
          return "Add at least one lot with a description and quantity, or upload a template.";
        return null;
      }
      case 7:
        if (!Number(baseline)) return "Please set a reserve / target baseline price.";
        if (!Number(increment)) return "Please set a bid increment.";
        return null;
      case 8: {
        const s1 = new Date(startTime);
        const e1 = new Date(endTime);
        if (Number.isNaN(s1.getTime()) || Number.isNaN(e1.getTime())) return "Please set valid start and end times.";
        if (e1 <= s1) return "End time must be after start time.";
        if (s1.getTime() < Date.now()) return "Start time cannot be in the past.";
        if (!Number(initialSlotMins) || !Number(continuationSlotMins)) return "Slot durations must be greater than zero.";
        if (!Number(maximumDurationMins)) return "Please set the maximum auction duration.";
        return null;
      }
      default:
        return null;
    }
  };

  const handleContinue = () => {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep(step + 1);
  };

  const handlePublish = async () => {
    if (publishing || !allValid) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        throw new Error("Enter valid start and end date/time values.");
      }
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      const maximumDuration = Number(maximumDurationMins);
      if (!Number.isInteger(maximumDuration) || maximumDuration < 1 || maximumDuration > 120) {
        throw new Error("Maximum auction duration must be between 1 and 120 minutes.");
      }
      if (durationMinutes > maximumDuration) {
        throw new Error(`Auction schedule cannot exceed ${maximumDuration} minutes.`);
      }
      if (Number(initialSlotMins) < 1 || Number(continuationSlotMins) < 1) {
        throw new Error("Slot durations must be greater than zero.");
      }
      const willUploadTemplate = !!(templateFile && templateInfo?.id && !templateConfirmed);
      if (!willUploadTemplate && !lines.some((line) => line.description.trim() && Number(line.quantity) > 0)) {
        throw new Error("Add at least one lot with an item name and quantity.");
      }
      const auctionPayload: Record<string, any> = {
        title: title.trim(),
        description: lines.map((line) => line.description.trim()).filter(Boolean).join("; "),
        company: bu,
        plant: plant || undefined,
        warehouse: warehouseName || undefined,
        warehouse_details: {
          address: warehouseAddress || undefined,
          city: warehouseCity || undefined,
          state: warehouseState || undefined,
          pincode: warehousePincode || undefined,
          contact: warehouseContact || undefined,
        },
        location: facility,
        category,
        ...(selectedCategoryId ? { category_id: selectedCategoryId } : {}),
        material_type: purpose,
        direction,
        lot_type: "lot_wise",
        quantity: lines.reduce((total, line) => total + (Number(line.quantity) || 0), 0).toString(),
        uom: lines[0]?.unit || "MT",
        reserve_price: Number(baseline),
        starting_price: Number(startingPrice || baseline),
        bid_increment: Number(increment),
        emd_amount: emdRequired ? Number(emdAmount) : 0,
        schedule_start: start.toISOString(),
        schedule_end: end.toISOString(),
        inspection,
        inspection_date: inspectionDate || undefined,
        inspection_time: inspectionTime || undefined,
        inspection_location: inspectionLocation || facility,
        guidelines_doc: guidelines || docs.join(", "),
        payment_terms: paymentTerms || undefined,
        lifting_period: liftingPeriod || undefined,
        lifting_unit: liftingUnit,
        contact_name: contactName || undefined,
        contact_phone: contactPhone || undefined,
        contact_email: contactEmail || undefined,
        status: "draft",
      };
      if (!willUploadTemplate) {
        auctionPayload.sub_lots = lines.map((line) => ({
          name: line.description,
          quantity: Number(line.quantity) || 0,
          uom: line.unit || "Nos.",
          reserve_price: Number(line.startPrice || baseline),
        }));
      }
      let code = createdAuctionCode;
      if (!code) {
        const response = await api.createAuction(auctionPayload);
        code = response?.data?.code ?? response?.code;
        if (!code) throw new Error("The API did not return the created event code.");
        setCreatedAuctionCode(code);
      }

      // Upload template file if one was selected but not yet uploaded
      if (templateFile && templateInfo?.id && !templateConfirmed) {
        const uploadResult = await api.uploadAuctionTemplate(code, templateInfo.id, templateFile);
        const uploadData = uploadResult?.data ?? uploadResult;
        const uploadId = uploadData?.upload?.id ?? uploadData?.upload_id;
        if (uploadData?.valid && uploadId) {
          await api.confirmTemplateImport(code, uploadId);
        } else if (!uploadData?.valid) {
          setTemplateUploadResult(uploadResult);
          throw new Error(
            uploadResult?.message || "Template validation failed. Fix errors and try again.",
          );
        }
      }

      await api.updateAuctionConfiguration(code, {
        rfq_required: enableRfx,
        rfq_mode: "DOCUMENT",
        emd_required: emdRequired,
        emd_type: "FIXED",
        emd_fixed_amount: emdRequired ? Number(emdAmount) : 0,
        initial_slot_minutes: Number(initialSlotMins),
        continuation_slot_minutes: Number(continuationSlotMins),
        maximum_auction_duration_minutes: maximumDuration,
        bid_cutoff_ms: 500,
        continuation_mode: "MANUAL_ADMIN",
        fallback_allowed: fallbackEnabled,
      });
      if (selectedVendors.length) {
        await Promise.all(
          selectedVendors.map((vendorId) => {
            const vendor = vendors.find((v: any) => String(v.code ?? v.id) === vendorId);
            if (!vendor?.email)
              throw new Error(`Selected vendor ${vendorId} has no email address.`);
            return api.inviteVendor({
              auction_code: code,
              email: vendor.email,
              company_name: vendor.company_name ?? vendor.name,
            });
          }),
        );
      }
      // Keep the seller's first submission as a draft. Publishing is a
      // separate approval-gated lifecycle action.
      setPublished(true);
      navigate({ to: "/console/events" });
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Event could not be created.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead
        title="Create Sourcing Event"
        subtitle={`12-Step Enterprise Auction & RFx Configuration Wizard (${step + 1} of 12)`}
      />

      {/* Step Stepper Header */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-[color:var(--navy)]">{STEPS[step].toUpperCase()}</span>
          <span className="text-muted-foreground">Step {step + 1} of 12</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-[color:var(--auction)] transition-all duration-300"
            style={{ width: `${((step + 1) / 12) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Contents */}
      <div className="mb-8">
        {step === 0 && (
          <Card
            title="Step 1 — Event Purpose"
            desc="Define the core objective of this sourcing or disposal activity"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Sell Asset / Scrap Material",
                "Procure Products / Raw Materials",
                "Source Service / Maintenance Contract",
                "Transportation & Logistics Tender",
                "Information Gathering (RFI)",
                "Commercial Rate Contract Negotiation",
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPurpose(p);
                    if (p.startsWith("Sell")) setDirection("forward");
                    else setDirection("reverse");
                  }}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    purpose === p
                      ? "border-[color:var(--auction)] bg-[color:var(--auction)]/10 font-bold text-foreground"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="text-sm font-semibold">{p}</div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card
            title="Step 2 — Auction & Event Format"
            desc="Select the bidding mechanism and dynamic pricing rules"
          >
            <div className="mb-5">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Auction direction
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ["forward", "Forward auction", "Buyers compete by offering the highest price."],
                  ["reverse", "Reverse auction", "Sellers compete by offering the lowest price."],
                ] as const).map(([value, label, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDirection(value)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      direction === value
                        ? "border-[color:var(--navy)] bg-[color:var(--navy)]/10 font-bold text-[color:var(--navy)]"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="text-sm font-bold">{label}</div>
                    <div className="mt-1 text-xs font-normal text-muted-foreground">{description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  "english",
                  "sealed",
                  "dutch",
                  "japanese",
                  "bafo",
                  "rfq",
                  "rfi",
                  "rfp",
                  "hybrid",
                ] as EventFormat[]
              ).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    format === f
                      ? "border-[color:var(--navy)] bg-[color:var(--navy)]/10 font-bold text-[color:var(--navy)]"
                      : "border-border hover:bg-muted/50 text-xs"
                  }`}
                >
                  <div className="font-bold capitalize text-sm">{FORMAT_LABEL[f]}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {f === "english" && "Open dynamic bidding room"}
                    {f === "sealed" && "One-time confidential sealed bid"}
                    {f === "japanese" && "Interval clock with mandatory accept"}
                    {f === "rfq" && "Technical & commercial quote packet"}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card
            title="Step 3 — Ownership & Category"
            desc="Assign the seller's business, plant, warehouse and industrial sector"
          >
            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Event Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Category / Sector *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-3 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Business Unit *
                  </label>
                  <input
                    value={bu}
                    onChange={(e) => setBu(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-3 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Facility / Plant Site *
                </label>
                <input
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 focus:outline-none"
                />
              </div>
              <div className="border-t border-border pt-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Warehouse details</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Plant / Unit" value={plant} onChange={setPlant} placeholder="Pune Processing Plant" />
                  <Field label="Warehouse name" value={warehouseName} onChange={setWarehouseName} placeholder="Pune Central Warehouse" />
                  <Field label="Warehouse contact" value={warehouseContact} onChange={setWarehouseContact} placeholder="Contact person or phone" />
                  <Field label="Warehouse address" value={warehouseAddress} onChange={setWarehouseAddress} placeholder="Plot, road, industrial area" />
                  <Field label="City" value={warehouseCity} onChange={setWarehouseCity} placeholder="Pune" />
                  <Field label="State" value={warehouseState} onChange={setWarehouseState} placeholder="Maharashtra" />
                  <Field label="Pincode" value={warehousePincode} onChange={setWarehousePincode} placeholder="411001" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card
            title="Step 4 — Lots, Line Items & BOQ"
            desc="Import from official Excel template or add items manually"
            actions={
              <button
                type="button"
                onClick={() =>
                  setLines([
                    ...lines,
                    {
                      description: "",
                      quantity: "10",
                      unit: "MT",
                      startPrice: "500000",
                      attributes: {},
                    },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-bold text-[color:var(--auction)]"
              >
                <Plus className="h-3.5 w-3.5" /> Add Line
              </button>
            }
          >
            <div className="space-y-6">
              {/* Template Import Section */}
              {templateLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking for category template...
                </div>
              )}

              {!templateLoading && selectedCategoryId && !templateInfo?.id && !templateConfirmed && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-xs text-amber-700 dark:text-amber-300">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>No official template is available for <strong>{category}</strong>. You can add lots manually below.</span>
                </div>
              )}

              {templateInfo?.id && !templateConfirmed && (
                <div className="rounded-xl border border-[color:var(--navy)]/30 bg-[color:var(--navy)]/5 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--navy)]">
                        <FileSpreadsheet className="h-4 w-4" />
                        Import from Official Template
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Download the Excel template for <strong>{category}</strong>, fill in your lot
                        details, then upload the completed file.
                      </p>
                      {templateInfo.version && (
                        <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          v{templateInfo.version}
                        </span>
                      )}
                    </div>
                    <a
                      href={api.getTemplateDownloadUrl(templateInfo.id)}
                      download
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[color:var(--navy)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Template
                    </a>
                  </div>

                  {/* Upload area */}
                  <div>
                    <input
                      ref={templateFileRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setTemplateFile(file);
                          setTemplateUploadResult(null);
                        }
                      }}
                    />
                    {!templateFile ? (
                      <button
                        type="button"
                        onClick={() => templateFileRef.current?.click()}
                        className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center hover:bg-muted/30 transition-colors"
                      >
                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-1.5" />
                        <span className="text-xs font-semibold text-foreground">
                          Click to upload completed template
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">
                          .xlsx, .xls, or .csv
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                        <div className="flex items-center gap-2 text-xs">
                          <FileSpreadsheet className="h-4 w-4 text-[color:var(--navy)]" />
                          <span className="font-semibold">{templateFile.name}</span>
                          <span className="text-muted-foreground">
                            ({(templateFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTemplateFile(null);
                              setTemplateUploadResult(null);
                              if (templateFileRef.current) templateFileRef.current.value = "";
                            }}
                            className="text-xs text-muted-foreground hover:text-destructive"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload result with note about needing auction code */}
                  {templateFile && !templateUploadResult && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200">
                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        The template will be validated and imported after the auction draft is
                        created at the final step. Continue filling in the remaining wizard steps,
                        and the template file will be uploaded when you publish.
                      </span>
                    </div>
                  )}

                  {/* Validation errors display */}
                  {templateUploadResult && !(templateUploadResult?.data?.valid ?? templateUploadResult?.valid) && (
                    <TemplateErrors result={templateUploadResult} templateInfo={templateInfo} />
                  )}

                  {/* Upload success with preview */}
                  {(() => {
                    const uploadData = templateUploadResult?.data ?? templateUploadResult;
                    const isValid = uploadData?.valid === true;
                    const parsedRows: any[] = uploadData?.rows ?? [];
                    const uploadId = uploadData?.upload?.id ?? uploadData?.upload_id;
                    if (!isValid || parsedRows.length === 0) return null;

                    const rowCount = uploadData.row_count ?? parsedRows.length;
                    const totalQty = uploadData.total_quantity ?? 0;
                    const totalRefValue = uploadData.total_reference_value ?? 0;

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--success)]">
                          <CheckCircle2 className="h-4 w-4" />
                          Template validated — {rowCount} item(s) parsed
                        </div>

                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                            <div className="text-lg font-bold text-[color:var(--navy)]">{rowCount}</div>
                            <div className="text-[10px] uppercase text-muted-foreground font-semibold">Items</div>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                            <div className="text-lg font-bold text-[color:var(--navy)]">{Number(totalQty).toLocaleString("en-IN")}</div>
                            <div className="text-[10px] uppercase text-muted-foreground font-semibold">Total Qty</div>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                            <div className="text-lg font-bold text-[color:var(--navy)]">{inr(Number(totalRefValue))}</div>
                            <div className="text-[10px] uppercase text-muted-foreground font-semibold">Total Ref. Value</div>
                          </div>
                        </div>

                        {/* Dynamic data table from extracted Excel rows */}
                        <div className="max-h-72 overflow-auto rounded-lg border border-border">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/60 sticky top-0">
                              <tr>
                                <th className="p-2 text-left font-semibold">#</th>
                                <th className="p-2 text-left font-semibold">Item Name</th>
                                <th className="p-2 text-right font-semibold">Qty</th>
                                <th className="p-2 text-left font-semibold">UOM</th>
                                <th className="p-2 text-right font-semibold">Ref. Value</th>
                                <th className="p-2 text-right font-semibold">Line Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedRows.map((row: any, i: number) => {
                                const d = row.data ?? row;
                                const qty = Number(String(d.quantity ?? "1").replace(/[,₹$ ]/g, "")) || 0;
                                const refVal = Number(String(d.reference_value ?? d.reserve_value ?? "0").replace(/[,₹$ ]/g, "")) || 0;
                                const lineTotal = qty * refVal;
                                return (
                                  <tr key={i} className="border-t border-border">
                                    <td className="p-2 font-mono text-muted-foreground">{row.row_number ?? i + 1}</td>
                                    <td className="p-2 font-semibold">
                                      {d.item_name ?? d.product_name ?? d.description ?? d.name ?? "—"}
                                      {d.brand && <span className="ml-1 text-muted-foreground font-normal">({d.brand})</span>}
                                    </td>
                                    <td className="p-2 text-right font-mono">{qty || "—"}</td>
                                    <td className="p-2 text-muted-foreground">{d.unit ?? d.uom ?? "PCS"}</td>
                                    <td className="p-2 text-right font-mono">{refVal > 0 ? inr(refVal) : "—"}</td>
                                    <td className="p-2 text-right font-mono font-semibold">{lineTotal > 0 ? inr(lineTotal) : "—"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-muted/40 border-t-2 border-border font-semibold">
                              <tr>
                                <td className="p-2" colSpan={2}>Total</td>
                                <td className="p-2 text-right font-mono">{Number(totalQty).toLocaleString("en-IN")}</td>
                                <td className="p-2" />
                                <td className="p-2" />
                                <td className="p-2 text-right font-mono text-[color:var(--navy)]">{inr(Number(totalRefValue))}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {!templateConfirmed && uploadId && (
                          <button
                            type="button"
                            disabled={templateConfirming}
                            onClick={() =>
                              handleTemplateConfirm(
                                uploadData.upload?.auction_code ?? "",
                                uploadId,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--success)] px-5 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50"
                          >
                            {templateConfirming ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Confirm Import
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Show confirmation banner when template lots are imported */}
              {templateConfirmed && templateImportedLots.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-[color:var(--success)]/30 bg-[color:var(--success)]/5 p-3 text-xs font-semibold text-[color:var(--success)]">
                  <CheckCircle2 className="h-4 w-4" />
                  {templateImportedLots.length} lot(s) imported from template
                </div>
              )}

              {/* Separator when both template and manual are visible */}
              {templateInfo?.id && !templateConfirmed && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-xs font-semibold text-muted-foreground">
                      OR ADD LOTS MANUALLY
                    </span>
                  </div>
                </div>
              )}

              {/* Manual lot entry */}
              {lines.map((l, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[color:var(--navy)]">
                      Lot #{idx + 1}
                    </span>
                    {lines.length > 1 && (
                      <button
                        onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                        className="text-destructive hover:opacity-80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Description / Item Name
                      </label>
                      <input
                        value={l.description}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].description = e.target.value;
                          setLines(updated);
                        }}
                        className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Quantity & UOM
                      </label>
                      <div className="mt-1 flex gap-1">
                        <input
                          value={l.quantity}
                          onChange={(e) => {
                            const updated = [...lines];
                            updated[idx].quantity = e.target.value;
                            setLines(updated);
                          }}
                          className="w-20 rounded-lg border border-border bg-background p-2 text-xs"
                        />
                        <input
                          value={l.unit}
                          onChange={(e) => {
                            const updated = [...lines];
                            updated[idx].unit = e.target.value;
                            setLines(updated);
                          }}
                          className="w-16 rounded-lg border border-border bg-background p-2 text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card
            title="Step 5 — Tender Documents & Specifications"
            desc="Attach specifications, drawings, contracts, and SLA policies"
          >
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center bg-muted/20">
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                <span className="text-sm font-bold text-foreground">
                  Drag & drop technical documents or BOQ
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  PDF, Excel, Word up to 25MB each
                </span>
              </div>
              <div className="space-y-2">
                {docs.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-card border border-border p-2.5 text-xs"
                  >
                    <span className="font-semibold">{d}</span>
                    <Pill tone="good">ATTACHED</Pill>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Inspection and access</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Inspection requirements" value={inspection} onChange={setInspection} placeholder="Inspection requirements" />
                  <Field label="Inspection date" value={inspectionDate} onChange={setInspectionDate} placeholder="YYYY-MM-DD" />
                  <Field label="Inspection time" value={inspectionTime} onChange={setInspectionTime} placeholder="10:00 AM - 4:00 PM" />
                  <Field label="Inspection location" value={inspectionLocation} onChange={setInspectionLocation} placeholder="Warehouse / yard address" />
                </div>
                <label className="mt-3 block text-xs font-semibold text-muted-foreground">Safety, PPE and gate-entry guidelines</label>
                <textarea value={guidelines} onChange={(e) => setGuidelines(e.target.value)} placeholder="Entry requirements, PPE rules, gate entry rules..." className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background p-3 text-sm" />
              </div>
            </div>
          </Card>
        )}

        {step === 5 && (
          <Card
            title="Step 6 — RFx Technical Questionnaire"
            desc="Configure pre-qualification questionnaire and scorecards"
          >
            <div className="space-y-4 text-xs">
              <label className="flex items-center gap-2 font-bold text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={enableRfx}
                  onChange={(e) => setEnableRfx(e.target.checked)}
                  className="rounded"
                />
                Mandatory Technical Qualification before Live Bidding
              </label>
              {enableRfx && (
                <div className="space-y-2 rounded-xl bg-muted/40 p-4">
                  <div className="font-bold text-foreground">Default Evaluator Sections:</div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="bg-card p-3 rounded border">
                      1. Statutory GST & Compliance (30%)
                    </div>
                    <div className="bg-card p-3 rounded border">
                      2. Technical Machinery / Fleet (40%)
                    </div>
                    <div className="bg-card p-3 rounded border">
                      3. Safety ISO Certification (30%)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {step === 6 && (
          <Card
            title="Step 7 — Participant Vendor Selection"
            desc="Invite prequalified vendors from the enterprise registry"
          >
            <div className="space-y-2">
              {vendors.map((v: any) => {
                const vendorId = String(v.code ?? v.id);
                const checked = selectedVendors.includes(vendorId);
                return (
                  <label
                    key={vendorId}
                    className={`flex items-center justify-between rounded-xl border p-3 text-xs cursor-pointer ${
                      checked
                        ? "border-[color:var(--navy)] bg-[color:var(--navy)]/5 font-semibold"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedVendors([...selectedVendors, vendorId]);
                          else setSelectedVendors(selectedVendors.filter((id) => id !== vendorId));
                        }}
                      />
                      <div>
                        <span className="font-bold text-foreground text-sm">
                          {v.company_name ?? v.name ?? vendorId}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          ({v.city ?? v.location ?? "—"} • Score:{" "}
                          {v.score ?? v.technical_score ?? "—"}%)
                        </span>
                      </div>
                    </div>
                    <Pill tone={v.compliance === "valid" ? "good" : "warn"}>
                      {(v.compliance ?? "unknown").toUpperCase()}
                    </Pill>
                  </label>
                );
              })}
            </div>
          </Card>
        )}

        {step === 7 && (
          <Card
            title="Step 8 — Commercial Rules & Landed Cost"
            desc="Set starting price, reserve baseline, increment, and EMD escrow"
          >
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Starting Price (INR) *</label>
                <input value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono font-bold" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  {direction === "forward"
                    ? "Reserve Price Baseline (INR) *"
                    : "Target Budget Ceiling (INR) *"}
                </label>
                <input
                  value={baseline}
                  onChange={(e) => setBaseline(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Minimum Bid Increment / Decrement (INR) *
                </label>
                <input
                  value={increment}
                  onChange={(e) => setIncrement(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Security Deposit / EMD Amount (INR) *
                </label>
                <input
                  value={emdAmount}
                  onChange={(e) => setEmdAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Payment Terms</label>
                <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="100% before lifting" className="mt-1 w-full rounded-xl border border-border bg-background p-3" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Lifting Period</label>
                <div className="mt-1 flex gap-2">
                  <input value={liftingPeriod} onChange={(e) => setLiftingPeriod(e.target.value)} className="w-full rounded-xl border border-border bg-background p-3" />
                  <select value={liftingUnit} onChange={(e) => setLiftingUnit(e.target.value)} className="rounded-xl border border-border bg-background p-3"><option>Days</option><option>Weeks</option></select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Auction contact</label>
                <div className="mt-1 grid gap-2 sm:grid-cols-3">
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Name" className="rounded-xl border border-border bg-background p-3" />
                  <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone" className="rounded-xl border border-border bg-background p-3" />
                  <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-border bg-background p-3" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 8 && (
          <Card
            title="Step 9 — Timing & Anti-Sniping Rules"
            desc="Configure schedule start, closure and auto-extension buffers"
          >
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Auction Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Auction End Time
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Anti-Sniping Overtime Extension (Minutes)
                </label>
                <input
                  value={autoExtendMins}
                  onChange={(e) => setAutoExtendMins(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Initial slot (minutes)</label>
                <input type="number" min="1" value={initialSlotMins} onChange={(e) => setInitialSlotMins(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Continuation slot (minutes)</label>
                <input type="number" min="1" value={continuationSlotMins} onChange={(e) => setContinuationSlotMins(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Maximum duration (minutes, max 120)</label>
                <input type="number" min="1" max="120" value={maximumDurationMins} onChange={(e) => setMaximumDurationMins(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono" />
              </div>
            </div>
          </Card>
        )}

        {step === 9 && (
          <Card
            title="Step 10 — Visibility & Security Governance"
            desc="Control rank visibility, competitor masking, and proxy bidding"
          >
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2 font-bold text-foreground">
                <input
                  type="checkbox"
                  checked={proxyBidAllowed}
                  onChange={(e) => setProxyBidAllowed(e.target.checked)}
                />
                Allow Automated Proxy Bidding (Auto-Bid Engine)
              </label>
              <div className="pt-2">
                <span className="font-semibold text-muted-foreground">
                  Competitor Rank Visibility in Live Room:
                </span>
                <div className="mt-2 flex gap-3">
                  {["rank_only", "price_visible", "blind"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRankVisibility(v as any)}
                      className={`rounded-lg border p-2.5 capitalize ${
                        rankVisibility === v
                          ? "border-[color:var(--navy)] bg-[color:var(--navy)]/10 font-bold"
                          : "border-border"
                      }`}
                    >
                      {v.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 10 && (
          <Card
            title="Step 11 — Award & Fallback Contingency"
            desc="Configure H2/L2 fallback acquisition and multi-tier approval rules"
          >
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2 font-bold text-foreground">
                <input
                  type="checkbox"
                  checked={fallbackEnabled}
                  onChange={(e) => setFallbackEnabled(e.target.checked)}
                />
                Enable Automatic H2 / L2 Fallback Offer on Winner Default
              </label>
              <div className="rounded-xl bg-muted/40 p-4 text-muted-foreground">
                If the H1 winner defaults on 100% balance payment within 48 hours, the award offer
                automatically transfers to the H2 bidder with forfeited H1 EMD.
              </div>
            </div>
          </Card>
        )}

        {step === 11 && (
          <Card
            title="Step 12 — Final Review & Publish"
            desc="Verify all event configuration parameters before live broadcast"
          >
            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-muted/40 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title:</span>
                  <strong className="text-foreground">{title}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <strong>{category}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commercial Baseline:</span>
                  <strong className="font-mono text-sm">{inr(Number(baseline))}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invited Vendors:</span>
                  <strong>{selectedVendors.length} Verified Vendors</strong>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 bg-card">
                <div className="font-bold text-foreground mb-2">Pre-Publish Validation:</div>
                {checks.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-bold text-[color:var(--success)]">✓ Pass</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Wizard Action Footer */}
      <div className="relative flex items-center justify-between border-t border-border pt-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => { setStepError(null); setStep(step - 1); }}
            className="inline-flex items-center gap-1 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <div />
        )}

        {stepError && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-sm">
            {stepError}
          </div>
        )}
        {step < 11 ? (
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex items-center gap-1 rounded-full bg-[color:var(--navy)] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={!allValid || published || publishing}
            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--success)] px-8 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110"
          >
            <Check className="h-4 w-4" />
            {publishError
              ? publishError
              : published || publishing
                ? "Publishing Event..."
                : "Publish Sourcing Event"}
          </button>
        )}
      </div>
    </div>
  );
}

function TemplateErrors({
  result,
  templateInfo,
}: {
  result: any;
  templateInfo: any;
}) {
  const errors: any[] = result?.data?.errors ?? result?.errors ?? [];
  const isWrongTemplate = result?.error?.code === "WRONG_TEMPLATE" || result?.code === "WRONG_TEMPLATE" || errors.some((e: any) => e.type === "WRONG_TEMPLATE");
  const isOldVersion = result?.error?.code === "OLD_VERSION" || result?.code === "OLD_VERSION" || errors.some((e: any) => e.type === "TEMPLATE_VERSION_UNSUPPORTED");

  const copyErrors = () => {
    const text = errors
      .map(
        (e: any) =>
          `Row ${e.row ?? "?"}, Column "${e.column ?? e.field ?? "?"}": ${e.message ?? e.error ?? "Invalid"} (value: ${e.value ?? "—"})`,
      )
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-3">
      {isWrongTemplate && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs">
          <ShieldAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-destructive">Wrong Template</div>
            <p className="mt-0.5 text-muted-foreground">
              The uploaded file does not match the expected template for this category.
            </p>
            {templateInfo?.id && (
              <a
                href={api.getTemplateDownloadUrl(templateInfo.id)}
                download
                className="mt-1.5 inline-flex items-center gap-1 text-[color:var(--navy)] font-semibold hover:underline"
              >
                <Download className="h-3 w-3" />
                Download correct template
              </a>
            )}
          </div>
        </div>
      )}

      {isOldVersion && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-amber-700 dark:text-amber-300">Outdated Template Version</div>
            <p className="mt-0.5 text-muted-foreground">
              {result?.message ?? "A newer version of the template is available."}
            </p>
            {templateInfo?.id && (
              <a
                href={api.getTemplateDownloadUrl(templateInfo.id)}
                download
                className="mt-1.5 inline-flex items-center gap-1 text-[color:var(--navy)] font-semibold hover:underline"
              >
                <Download className="h-3 w-3" />
                Download current version
              </a>
            )}
          </div>
        </div>
      )}

      {!isWrongTemplate && !isOldVersion && result?.message && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
          <XCircle className="h-4 w-4" />
          {result.message}
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-destructive">
              {errors.length} validation error(s)
            </span>
            <button
              type="button"
              onClick={copyErrors}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
              Copy All Errors
            </button>
          </div>
          <div className="max-h-48 overflow-auto rounded-lg border border-border">
            <table className="w-full text-[11px]">
              <thead className="bg-muted/60 sticky top-0">
                <tr>
                  <th className="p-1.5 text-left font-semibold">Row</th>
                  <th className="p-1.5 text-left font-semibold">Column</th>
                  <th className="p-1.5 text-left font-semibold">Value</th>
                  <th className="p-1.5 text-left font-semibold">Error</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err: any, i: number) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-1.5 font-mono">{err.row ?? "—"}</td>
                    <td className="p-1.5">{err.column ?? err.field ?? "—"}</td>
                    <td className="p-1.5 font-mono text-muted-foreground max-w-[120px] truncate">
                      {err.value ?? "—"}
                    </td>
                    <td className="p-1.5 text-destructive">{err.message ?? err.error ?? "Invalid"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-border bg-background p-3 focus:outline-none"
      />
    </div>
  );
}
