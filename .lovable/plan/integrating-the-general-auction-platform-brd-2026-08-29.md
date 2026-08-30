# Integrating the General Auction Platform BRD

Your BRD describes a full enterprise auction suite: forward + reverse auctions, RFx (RFQ/RFI/RFP), Dutch and Japanese clock formats, sealed bids, BAFO, negotiation rooms, approval matrices, award/fallback logic, EMD and settlement, audit and analytics. Today the app covers roughly the forward-auction buyer slice (marketplace, lot page, live room, results, wallet, alerts, KYC registration wizard) on mock local data.

Integrating the whole BRD is a multi-phase build. Below is how I propose to do it end to end, in the order that keeps the app usable at every step.

## Phase 1 — Event engine foundation (shared domain)

One event model that all formats reuse, replacing the forward-only lot model:

- Event: direction (forward/reverse), format (english, sealed, rfq, rfi, rfp, dutch, japanese, bafo, negotiated), state machine (draft → validated → published → invited → live → paused → closed → under evaluation → awarded → cancelled → re-auction).
- Lots and line items: quantity, unit, grade, location, tax profile, documents, photos; validation report listing missing mandatory fields before publish.
- Bid validity rules: eligibility + accepted terms + time window + EMD/security status + increment/decrement + reserve/target.
- Participant model: bidder eligibility per category, qualification status, suspension/compliance hold.
- Audit trail entry for every state change, bid, approval and award decision.

## Phase 2 — Bidder/participant experience per format

- Forward English room (exists) generalised to reverse English (descending, L1 rank, best-value scoring display).
- Sealed bid: submit/revise offers before deadline, no market feedback, reveal after close.
- Dutch clock: system-driven price steps with an Accept action.
- Japanese clock: stay-in/drop-out at each level, live active-participant count.
- RFQ: quote sheet per line item. RFI: questionnaire + document upload. RFP: technical + commercial envelopes.
- BAFO round for shortlisted participants.
- Terms acceptance gate, EMD gate and eligibility gate enforced consistently on every format.

## Phase 3 — Customer/seller console

- Event creation wizard: requirement → lots/line items → rules (reserve/target, increment, extensions, visibility model) → EMD/security → invitations → publish validation.
- Bidder invitation and shortlisting, category eligibility.
- Live monitor: participation, rank ladder, extension/pause/end controls, exception log.
- Evaluation screen: H1/H2 or L1/L2 comparison, reserve/target variance, scoring, participation risk.

## Phase 4 — Approval, award and fallback

- Approval matrix by value threshold, below-reserve/above-target, single bidder, non-H1/L1 award, high-risk vendor, cancellation after bids; L1/L2/L3 approver queue with one decision screen.
- Award types: auto, manual, split, negotiated, fallback.
- Winner acceptance deadline, default handling, fallback to H2/L2, re-auction or cancel; forfeiture recording.
- Negotiation room with offers, counteroffers, reasons and approvals.

## Phase 5 — Money, fulfilment, closure

- EMD/security lifecycle: hold, apply to balance, refund, forfeit, recovery case.
- Balance payment with GST/TCS, payment deadlines and breach handling.
- Award letter, order/sale order/DO, lifting schedule, gate pass, chain of custody, closure certificate.

## Phase 6 — Governance, notifications, analytics

- Roles and permissions (event owner, approver, finance, compliance, auditor, bidder).
- Notification matrix per BRD event/recipient/channel, plus in-app alert centre preferences.
- Dashboards: realisation/savings, cycle time, participation, vendor performance, audit readiness.
- Security controls: bid tamper protection, sniping controls via auto-extension, full audit export.

## Technical notes

- Data moves off localStorage onto the backend: tables for events, lots, line items, participants, bids, approvals, awards, payments, documents, notifications and audit log, with RLS scoped by organisation and role, plus grants per table.
- Bid submission, clock steps, close/evaluate and award actions run as server functions so rules and timing cannot be bypassed by the client; realtime is used for the live rooms.
- Existing design system (navy/orange, Manrope/Sora, current components) stays as is; new screens reuse it.
- Existing routes are preserved: current lot/live/results/wallet/alerts screens are refactored onto the new event model rather than replaced.

## How I suggest we sequence it

Phase 1 + 2 first (the engine plus every bidder-side format), then Phase 3 + 4 (customer console and approvals), then Phase 5 + 6. Each phase ships working screens.

Tell me if you want me to start with Phase 1 now, or reorder so a specific area (for example reverse auction, or the approval matrix) comes first.
