// Compatibility helpers for legacy auction screens.
// Transactional state is authoritative in the API; this module never persists
// registrations, EMDs, bids, payments, refunds, or gate passes locally.
import type { Lot } from "./auction-data";

export type EmdStatus = "not_paid" | "pending" | "confirmed" | "refund_initiated" | "refunded";
export const EMD_LABEL: Record<EmdStatus, string> = {
  not_paid: "Not Paid",
  pending: "EMD Pending",
  confirmed: "EMD Confirmed",
  refund_initiated: "Refund Initiated",
  refunded: "Refunded",
};

export type Participation = { lotId: string; emd: EmdStatus; method?: "gateway" | "neft"; reference?: string; registeredAt: number };
export type Txn = { id: string; at: number; label: string; amount: number; kind: "hold" | "release" | "debit" | "credit" };
export type Notice = { id: string; at: number; title: string; body: string; kind: "info" | "warn" | "success"; read: boolean };
export type PaymentRecord = { reference: string; at: number; lifting?: string };
export type FlowState = {
  participation: Record<string, Participation>;
  watch: string[];
  txns: Txn[];
  notices: Notice[];
  myBids: Record<string, number>;
  payments: Record<string, PaymentRecord>;
  extendedBy: Record<string, number>;
  endedNow: string[];
  prefs: { email: boolean; sms: boolean; inApp: boolean; push: boolean };
};

export const emptyFlow = (): FlowState => ({
  participation: {}, watch: [], txns: [], notices: [], myBids: {}, payments: {},
  extendedBy: {}, endedNow: [], prefs: { email: true, sms: true, inApp: true, push: true },
});

export function loadFlow(): FlowState { return emptyFlow(); }
export function saveFlow(_next: FlowState) { /* API state is authoritative. */ }
export function mutateFlow(_fn: (s: FlowState) => FlowState) { return emptyFlow(); }
export const FLOW_EVENT = "scrapify:api-flow";

// These names remain for legacy screens. They intentionally do not claim
// success or create local business records; callers must use the API actions.
export function notify(_title: string, _body: string, _kind: Notice["kind"] = "info") {}
export function markAllRead() {}
export function toggleWatch(_lotId: string) {}
export function registerForAuction(_lot: Lot) {}
export function payEmd(_lot: Lot, _method: "gateway" | "neft", _reference: string) {}
export function confirmEmd(_lot: Lot) {}
export function refundEmd(_lot: Lot, _stage: "refund_initiated" | "refunded") {}
export function placeBid(_lot: Lot, _amount: number) {}
export function extendAuction(_lot: Lot, _minutes: number) {}
export function endNow(_lot: Lot) {}
export function submitPayment(_lot: Lot, _reference: string) {}
export function scheduleLifting(_lot: Lot, _slot: string) {}

export const GST_RATE = 0.18;
export const TCS_RATE = 0.01;
export function payableSummary(h1: number, emdHeld: number) {
  const gst = Math.round(h1 * GST_RATE);
  const tcs = Math.round((h1 + gst) * TCS_RATE);
  const total = h1 + gst + tcs;
  return { h1, gst, tcs, total, emdHeld, balance: total - emdHeld };
}

export function emdPercent(lot: Lot): number { return lot.reserve > 0 ? Math.round((lot.emd / lot.reserve) * 1000) / 10 : 0; }
export function lotType(lot: Lot): "Single" | "Lot-wise" { return lot.subLots.length > 1 ? "Lot-wise" : "Single"; }
export function startsAt(lot: Lot): number { return lot.startsAt; }
export function endsAtWithExtension(lot: Lot, extendedMinutes = 0): number { return lot.endsAt + extendedMinutes * 60_000; }
export function subLots(lot: Lot) {
  return lot.subLots.length > 0 ? lot.subLots : [{ no: "1", description: lot.title, quantity: lot.weight, startPrice: lot.reserve }];
}
export function inspection(lot: Lot) {
  return { window: "Inspection schedule provided by the auction API", contact: "Contact details revealed by the auction API", address: `${lot.seller}, ${lot.location}` };
}
export function terms(lot: Lot) { return lot.terms; }
export function documents(_lot: Lot) { return [] as Array<{ name: string; size: string }>; }
export function maskedAlias(i: number) { return `Bidder ${String.fromCharCode(65 + (i % 26))}`; }
