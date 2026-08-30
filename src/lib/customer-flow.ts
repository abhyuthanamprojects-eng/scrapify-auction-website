// Customer-panel domain layer (mock / localStorage only).
// Mirrors the admin status contract: the customer never invents a status.
import type { Lot } from "./mock-lots";

export type EmdStatus =
  | "not_paid"
  | "pending"
  | "confirmed"
  | "refund_initiated"
  | "refunded";

export const EMD_LABEL: Record<EmdStatus, string> = {
  not_paid: "Not Paid",
  pending: "EMD Pending",
  confirmed: "EMD Confirmed",
  refund_initiated: "Refund Initiated",
  refunded: "Refunded",
};

export type Participation = {
  lotId: string;
  emd: EmdStatus;
  method?: "gateway" | "neft";
  reference?: string;
  registeredAt: number;
};

export type Txn = {
  id: string;
  at: number;
  label: string;
  amount: number;
  kind: "hold" | "release" | "debit" | "credit";
};

export type Notice = {
  id: string;
  at: number;
  title: string;
  body: string;
  kind: "info" | "warn" | "success";
  read: boolean;
};

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

const KEY = "scrapify.flow.v1";
const EVT = "scrapify:flow";

export const emptyFlow = (): FlowState => ({
  participation: {},
  watch: [],
  txns: [],
  notices: [],
  myBids: {},
  payments: {},
  extendedBy: {},
  endedNow: [],
  prefs: { email: true, sms: true, inApp: true, push: true },
});

export function loadFlow(): FlowState {
  if (typeof window === "undefined") return emptyFlow();
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...emptyFlow(), ...JSON.parse(raw) } : emptyFlow();
  } catch {
    return emptyFlow();
  }
}

export function saveFlow(next: FlowState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function mutateFlow(fn: (s: FlowState) => FlowState) {
  const next = fn(loadFlow());
  saveFlow(next);
  return next;
}

export const FLOW_EVENT = EVT;

const uid = () => Math.random().toString(36).slice(2, 10);

export function notify(
  title: string,
  body: string,
  kind: Notice["kind"] = "info",
): void {
  mutateFlow((s) => ({
    ...s,
    notices: [
      { id: uid(), at: Date.now(), title, body, kind, read: false },
      ...s.notices,
    ].slice(0, 40),
  }));
}

export function markAllRead() {
  mutateFlow((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) }));
}

export function toggleWatch(lotId: string) {
  mutateFlow((s) => ({
    ...s,
    watch: s.watch.includes(lotId)
      ? s.watch.filter((x) => x !== lotId)
      : [...s.watch, lotId],
  }));
}

// ---------- Participation & EMD ----------

export function registerForAuction(lot: Lot) {
  mutateFlow((s) => ({
    ...s,
    participation: {
      ...s.participation,
      [lot.id]: {
        lotId: lot.id,
        emd: s.participation[lot.id]?.emd ?? "not_paid",
        registeredAt: Date.now(),
      },
    },
  }));
  notify(
    "Registered for auction",
    `You registered for ${lot.id}. Pay the EMD of ${inr(lot.emd)} to enter the bidding room.`,
  );
}

export function payEmd(lot: Lot, method: "gateway" | "neft", reference: string) {
  mutateFlow((s) => ({
    ...s,
    participation: {
      ...s.participation,
      [lot.id]: {
        lotId: lot.id,
        registeredAt: s.participation[lot.id]?.registeredAt ?? Date.now(),
        emd: "pending",
        method,
        reference,
      },
    },
    txns: [
      {
        id: uid(),
        at: Date.now(),
        label: `EMD submitted · ${lot.id}`,
        amount: lot.emd,
        kind: "debit",
      },
      ...s.txns,
    ],
  }));
  notify("EMD submitted", `EMD for ${lot.id} is pending admin confirmation.`, "warn");
}

export function confirmEmd(lot: Lot) {
  mutateFlow((s) => {
    const p = s.participation[lot.id];
    if (!p) return s;
    return {
      ...s,
      participation: { ...s.participation, [lot.id]: { ...p, emd: "confirmed" } },
      txns: [
        {
          id: uid(),
          at: Date.now(),
          label: `EMD blocked · ${lot.id}`,
          amount: lot.emd,
          kind: "hold",
        },
        ...s.txns,
      ],
    };
  });
  notify("EMD confirmed", `You can now enter the live room for ${lot.id}.`, "success");
}

export function refundEmd(lot: Lot, stage: "refund_initiated" | "refunded") {
  mutateFlow((s) => {
    const p = s.participation[lot.id];
    if (!p) return s;
    return {
      ...s,
      participation: { ...s.participation, [lot.id]: { ...p, emd: stage } },
      txns:
        stage === "refunded"
          ? [
              {
                id: uid(),
                at: Date.now(),
                label: `EMD refunded · ${lot.id}`,
                amount: lot.emd,
                kind: "credit",
              },
              ...s.txns,
            ]
          : s.txns,
    };
  });
  notify(
    stage === "refunded" ? "EMD refunded" : "EMD refund initiated",
    `${lot.id}: ${EMD_LABEL[stage]}.`,
    stage === "refunded" ? "success" : "info",
  );
}

export function placeBid(lot: Lot, amount: number) {
  mutateFlow((s) => ({ ...s, myBids: { ...s.myBids, [lot.id]: amount } }));
}

export function extendAuction(lot: Lot, minutes: number) {
  mutateFlow((s) => ({
    ...s,
    extendedBy: { ...s.extendedBy, [lot.id]: (s.extendedBy[lot.id] ?? 0) + minutes },
  }));
  notify("Auction extended", `${lot.id} extended by ${minutes} minutes.`, "warn");
}

export function endNow(lot: Lot) {
  mutateFlow((s) => ({ ...s, endedNow: [...new Set([...s.endedNow, lot.id])] }));
  notify("Auction closed", `${lot.id} was closed by the auctioneer.`, "warn");
}

export function submitPayment(lot: Lot, reference: string) {
  mutateFlow((s) => ({
    ...s,
    payments: { ...s.payments, [lot.id]: { reference, at: Date.now() } },
  }));
  notify("Payment submitted", `Balance payment reference recorded for ${lot.id}.`, "success");
}

export function scheduleLifting(lot: Lot, slot: string) {
  mutateFlow((s) => ({
    ...s,
    payments: {
      ...s.payments,
      [lot.id]: { ...(s.payments[lot.id] ?? { reference: "—", at: Date.now() }), lifting: slot },
    },
  }));
  notify("Lifting scheduled", `${lot.id} pickup slot: ${slot}. Gate pass generated.`, "success");
}

// ---------- Money rules (must match the admin H1 report) ----------

export const GST_RATE = 0.18;
export const TCS_RATE = 0.01;

export function payableSummary(h1: number, emdHeld: number) {
  const gst = Math.round(h1 * GST_RATE);
  const tcs = Math.round((h1 + gst) * TCS_RATE);
  const total = h1 + gst + tcs;
  return { h1, gst, tcs, total, emdHeld, balance: total - emdHeld };
}

// ---------- Auction derived data (mock enrichment) ----------

export function emdPercent(lot: Lot): number {
  return Math.round((lot.emd / lot.reserve) * 1000) / 10;
}

export function lotType(lot: Lot): "Single" | "Lot-wise" {
  return lot.weight.includes("MT") && lot.bidders % 2 === 0 ? "Lot-wise" : "Single";
}

export function startsAt(lot: Lot): number {
  return lot.endsAt - 7 * 24 * 60 * 60 * 1000;
}

export function endsAtWithExtension(lot: Lot, extendedMinutes = 0): number {
  return lot.endsAt + extendedMinutes * 60_000;
}

export function subLots(lot: Lot) {
  if (lotType(lot) === "Single") {
    return [
      {
        no: "1",
        description: lot.title,
        quantity: lot.weight,
        startPrice: lot.reserve,
      },
    ];
  }
  const total = parseFloat(lot.weight) || 10;
  return [1, 2, 3].map((i) => ({
    no: String(i),
    description: `${lot.title} — sub-lot ${i}`,
    quantity: `${(total / 3).toFixed(1)} MT`,
    startPrice: Math.round(lot.reserve / 3),
  }));
}

export function inspection(lot: Lot) {
  return {
    window: "Weekdays 10:00–16:00, up to 24h before auction close",
    contact: "Site in-charge (revealed after EMD confirmation)",
    address: `${lot.seller}, ${lot.location}`,
  };
}

export function terms(lot: Lot) {
  return [
    `EMD of ${inr(lot.emd)} (${emdPercent(lot)}% of starting price) is mandatory before bidding.`,
    `Minimum increment ${inr(lot.increment)}. Anti-sniping: last-minute bids extend the auction.`,
    "GST 18% and TCS 1% apply on the winning value; balance is payable after award.",
    "Material must be lifted within 10 working days of full payment.",
    "Weighbridge slip at the seller site is final for quantity settlement.",
  ];
}

export function documents(lot: Lot) {
  return [
    { name: `Catalogue_${lot.id}.pdf`, size: "480 KB" },
    { name: `Terms_${lot.id}.pdf`, size: "120 KB" },
    { name: `Inspection_Note_${lot.id}.pdf`, size: "96 KB" },
  ];
}

export function maskedAlias(i: number) {
  return `Bidder ${String.fromCharCode(65 + (i % 26))}`;
}

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}
