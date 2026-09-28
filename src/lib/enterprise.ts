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

export const approvalTriggers: any[] = [];
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
export function settlement(_input: AuctionEvent | number, _emdAmountArg = 0): any { return {}; }
