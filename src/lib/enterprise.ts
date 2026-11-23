// Shared enterprise-screen types and presentation helpers.
// Business records are loaded from the API; no production fixture data lives here.

export type EventDirection = "forward" | "reverse";
export type EventFormat =
  | "english"
  | "sealed"
  | "dutch"
  | "japanese"
  | "bafo"
  | "rfq"
  | "rfi"
  | "rfp"
  | "hybrid";
export type EventState = string;
export const FORMAT_LABEL: Record<EventFormat, string> = {
  english: "English forward auction",
  sealed: "Sealed bid",
  dutch: "Dutch auction",
  japanese: "Japanese auction",
  bafo: "Best and final offer",
  rfq: "Request for quotation",
  rfi: "Request for information",
  rfp: "Request for proposal",
  hybrid: "Hybrid sourcing event",
};
export const STATE_LABEL: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  live: "Live",
  active: "Live",
  closed: "Closed",
  awarded: "Awarded",
  cancelled: "Cancelled",
};
export const CATEGORIES: readonly string[] = [];
export type Category = string;
export const CATEGORY_ATTRIBUTES: Record<string, string[]> = {};

export type LineItem = any;
export type Participant = any;
export type BidRow = any;
export type ApprovalStep = any;
export type Clarification = any;
export type InspectionSlot = any;
export type RFxQuestion = any;
export type RFxResponse = any;
export type LandedCostBreakdown = any;
export type AuctionEvent = any;
export type Order = any;
export type Vendor = any;
export type OrgUser = any;
export type Dispute = any;

/** Reasons an event needs an approval decision, derived from its live data. */
export const approvalTriggers = (event: AuctionEvent): string[] => {
  if (!event) return [];
  const triggers: string[] = [];
  const value = Number(event.value) || 0;
  const baseline = Number(event.baseline) || 0;
  const accepted = Array.isArray(event.participants)
    ? event.participants.filter((p: any) => p?.accepted).length
    : 0;

  if (event.state === "approval") triggers.push("Pending governance review");
  if (value >= 10_000_000) triggers.push("Value above ₹1 Cr threshold");
  if (baseline > 0 && value > 0) {
    const variance = ((value - baseline) / baseline) * 100;
    const adverse = event.direction === "reverse" ? variance > 0 : variance < 0;
    if (adverse) triggers.push("Recommended price misses reserve/target");
  }
  if (accepted < 3) triggers.push("Low participation (fewer than 3 bidders)");
  return triggers.length ? triggers : ["Standard approval policy"];
};
export const publishChecklist: any = (_event: AuctionEvent) => [];

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const cr = (n: number) => `₹${(n / 10_000_000).toFixed(2)} Cr`;
export const timeLeft = (endAt: number, from = Date.now()) => {
  const total = Math.max(0, Math.floor((endAt - from) / 1000));
  if (total === 0) return "Ended";
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};
export const fmtDate = (ms: number) => {
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export function getEvent(_id: string): AuctionEvent | undefined { return undefined; }
export function getOrder(_id: string): Order | undefined { return undefined; }
/** Award settlement: GST 18% + TCS 1% on award value, EMD adjusted against the total. */
export function settlement(input: AuctionEvent | number, emdAmountArg = 0) {
  const ev = typeof input === "number" ? null : (input as any);
  const value = Math.max(0, Number(ev ? (ev.value ?? ev.baseline) : input) || 0);
  const emdRaw = ev ? (ev.emdRequired === false ? 0 : ev.emdAmount) : emdAmountArg;
  const gst = Math.round(value * 0.18);
  const tcs = Math.round(value * 0.01);
  const total = value + gst + tcs;
  const emd = Math.min(Math.max(0, Number(emdRaw) || 0), total);
  const balance = total - emd;
  return {
    value, gst, tcs, total, emd, balance,
    // aliases used by the event workspace
    winningAmount: value, grandTotal: total, emdAdjusted: emd, balancePayable: balance,
  };
}
