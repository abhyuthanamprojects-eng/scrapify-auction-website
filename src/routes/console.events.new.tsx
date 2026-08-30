import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Trash2, Plus, UploadCloud, FileSpreadsheet, ShieldAlert } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_ATTRIBUTES,
  FORMAT_LABEL,
  VENDORS,
  cr,
  inr,
  type EventDirection,
  type EventFormat,
} from "@/lib/enterprise";
import { Card, PageHead, Pill } from "@/components/console/shell";

export const Route = createFileRoute("/console/events/new")({
  head: () => ({
    meta: [
      { title: "Create Sourcing Event (12-Step Wizard) — Scrapify Auctions" },
      {
        name: "description",
        content: "Configure requirement, lots, category attributes, RFx, rules, participants, landed cost and approvals.",
      },
    ],
  }),
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
  const [step, setStep] = useState(0);

  // Step 1: Purpose
  const [purpose, setPurpose] = useState("Sell Asset / Scrap Material");
  // Step 2: Format & Direction
  const [direction, setDirection] = useState<EventDirection>("forward");
  const [format, setFormat] = useState<EventFormat>("english");
  // Step 3: Ownership & Category
  const [title, setTitle] = useState("Industrial Copper Scrap & Armoured Cables (28 MT)");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [bu, setBu] = useState("Corporate Disposals");
  const [facility, setFacility] = useState("Plot 48, MIDC Industrial Area, Mumbai");
  // Step 4: Lots
  const [lines, setLines] = useState<Line[]>([
    { description: "Bare bright copper wire scrap", quantity: "28", unit: "MT", startPrice: "1450000", attributes: {} },
  ]);
  // Step 5: Documents
  const [docs, setDocs] = useState(["Full Technical Specification.pdf", "General Auction Terms.pdf"]);
  // Step 6: RFx
  const [enableRfx, setEnableRfx] = useState(true);
  // Step 7: Participants
  const [selectedVendors, setSelectedVendors] = useState<string[]>(["V-1021", "V-1044", "V-1090"]);
  // Step 8: Commercials
  const [baseline, setBaseline] = useState("1650000");
  const [increment, setIncrement] = useState("10000");
  const [emdRequired, setEmdRequired] = useState(true);
  const [emdAmount, setEmdAmount] = useState("50000");
  // Step 9: Timing
  const [autoExtendMins, setAutoExtendMins] = useState("3");
  const [startTime, setStartTime] = useState("Tomorrow, 10:00 AM");
  const [endTime, setEndTime] = useState("Tomorrow, 02:00 PM");
  // Step 10: Visibility
  const [rankVisibility, setRankVisibility] = useState<"rank_only" | "price_visible" | "blind">("rank_only");
  const [proxyBidAllowed, setProxyBidAllowed] = useState(true);
  // Step 11: Award
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [published, setPublished] = useState(false);

  const attrs = CATEGORY_ATTRIBUTES[category] ?? [];

  const checks = useMemo(
    () => [
      { label: "Valid Title and Sector", ok: title.trim().length > 3 },
      { label: "At least one complete lot/BOQ line", ok: lines.some((l) => l.description && l.quantity) },
      { label: "Reserve / Target Baseline", ok: Number(baseline) > 0 },
      { label: "Minimum 2 Invited Participants", ok: selectedVendors.length >= 2 },
      { label: "Commercial Terms Configured", ok: true },
    ],
    [title, lines, baseline, selectedVendors],
  );

  const allValid = checks.every((c) => c.ok);

  const handlePublish = () => {
    setPublished(true);
    setTimeout(() => {
      navigate({ to: "/console/events" });
    }, 1200);
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
          <Card title="Step 1 — Event Purpose" desc="Define the core objective of this sourcing or disposal activity">
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
          <Card title="Step 2 — Auction & Event Format" desc="Select the bidding mechanism and dynamic pricing rules">
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
          <Card title="Step 3 — Ownership & Category" desc="Assign organizational entity, facility location, and industrial sector">
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
                  <label className="text-xs font-semibold text-muted-foreground">Category / Sector *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-3 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Business Unit *</label>
                  <input
                    value={bu}
                    onChange={(e) => setBu(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-3 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Facility / Plant Site *</label>
                <input
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 focus:outline-none"
                />
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card
            title="Step 4 — Lots, Line Items & BOQ"
            desc="Add items with sector-specific attributes or import from Excel/CSV"
            actions={
              <button
                type="button"
                onClick={() =>
                  setLines([
                    ...lines,
                    { description: "", quantity: "10", unit: "MT", startPrice: "500000", attributes: {} },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-bold text-[color:var(--auction)]"
              >
                <Plus className="h-3.5 w-3.5" /> Add Line
              </button>
            }
          >
            <div className="space-y-4">
              {lines.map((l, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[color:var(--navy)]">Lot #{idx + 1}</span>
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
                      <label className="text-[11px] font-semibold text-muted-foreground">Description / Item Name</label>
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
                      <label className="text-[11px] font-semibold text-muted-foreground">Quantity & UOM</label>
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
          <Card title="Step 5 — Tender Documents & Specifications" desc="Attach specifications, drawings, contracts, and SLA policies">
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center bg-muted/20">
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                <span className="text-sm font-bold text-foreground">Drag & drop technical documents or BOQ</span>
                <span className="text-xs text-muted-foreground mt-1">PDF, Excel, Word up to 25MB each</span>
              </div>
              <div className="space-y-2">
                {docs.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-card border border-border p-2.5 text-xs">
                    <span className="font-semibold">{d}</span>
                    <Pill tone="good">ATTACHED</Pill>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {step === 5 && (
          <Card title="Step 6 — RFx Technical Questionnaire" desc="Configure pre-qualification questionnaire and scorecards">
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
                    <div className="bg-card p-3 rounded border">1. Statutory GST & Compliance (30%)</div>
                    <div className="bg-card p-3 rounded border">2. Technical Machinery / Fleet (40%)</div>
                    <div className="bg-card p-3 rounded border">3. Safety ISO Certification (30%)</div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {step === 6 && (
          <Card title="Step 7 — Participant Vendor Selection" desc="Invite prequalified vendors from the enterprise registry">
            <div className="space-y-2">
              {VENDORS.map((v) => {
                const checked = selectedVendors.includes(v.id);
                return (
                  <label
                    key={v.id}
                    className={`flex items-center justify-between rounded-xl border p-3 text-xs cursor-pointer ${
                      checked ? "border-[color:var(--navy)] bg-[color:var(--navy)]/5 font-semibold" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedVendors([...selectedVendors, v.id]);
                          else setSelectedVendors(selectedVendors.filter((id) => id !== v.id));
                        }}
                      />
                      <div>
                        <span className="font-bold text-foreground text-sm">{v.name}</span>
                        <span className="text-muted-foreground ml-2">({v.city} • Score: {v.score}%)</span>
                      </div>
                    </div>
                    <Pill tone={v.compliance === "valid" ? "good" : "warn"}>{v.compliance.toUpperCase()}</Pill>
                  </label>
                );
              })}
            </div>
          </Card>
        )}

        {step === 7 && (
          <Card title="Step 8 — Commercial Rules & Landed Cost" desc="Set starting price, reserve baseline, increment, and EMD escrow">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  {direction === "forward" ? "Reserve Price Baseline (INR) *" : "Target Budget Ceiling (INR) *"}
                </label>
                <input
                  value={baseline}
                  onChange={(e) => setBaseline(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Minimum Bid Increment / Decrement (INR) *</label>
                <input
                  value={increment}
                  onChange={(e) => setIncrement(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Security Deposit / EMD Amount (INR) *</label>
                <input
                  value={emdAmount}
                  onChange={(e) => setEmdAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono font-bold"
                />
              </div>
            </div>
          </Card>
        )}

        {step === 8 && (
          <Card title="Step 9 — Timing & Anti-Sniping Rules" desc="Configure schedule start, closure and auto-extension buffers">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Auction Start Time</label>
                <input
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Auction End Time</label>
                <input
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Anti-Sniping Overtime Extension (Minutes)</label>
                <input
                  value={autoExtendMins}
                  onChange={(e) => setAutoExtendMins(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-mono"
                />
              </div>
            </div>
          </Card>
        )}

        {step === 9 && (
          <Card title="Step 10 — Visibility & Security Governance" desc="Control rank visibility, competitor masking, and proxy bidding">
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
                <span className="font-semibold text-muted-foreground">Competitor Rank Visibility in Live Room:</span>
                <div className="mt-2 flex gap-3">
                  {["rank_only", "price_visible", "blind"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRankVisibility(v as any)}
                      className={`rounded-lg border p-2.5 capitalize ${
                        rankVisibility === v ? "border-[color:var(--navy)] bg-[color:var(--navy)]/10 font-bold" : "border-border"
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
          <Card title="Step 11 — Award & Fallback Contingency" desc="Configure H2/L2 fallback acquisition and multi-tier approval rules">
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
                If the H1 winner defaults on 100% balance payment within 48 hours, the award offer automatically transfers to the H2 bidder with forfeited H1 EMD.
              </div>
            </div>
          </Card>
        )}

        {step === 11 && (
          <Card title="Step 12 — Final Review & Publish" desc="Verify all event configuration parameters before live broadcast">
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
      <div className="flex items-center justify-between border-t border-border pt-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <div />
        )}

        {step < 11 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="inline-flex items-center gap-1 rounded-full bg-[color:var(--navy)] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={!allValid || published}
            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--success)] px-8 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110"
          >
            <Check className="h-4 w-4" />
            {published ? "Publishing Event..." : "Publish Sourcing Event"}
          </button>
        )}
      </div>
    </div>
  );
}
