// Enterprise sourcing & auction domain (mock data layer).
// Generic across categories: scrap, e-waste, surplus, machinery, vehicles,
// raw materials, commodities, logistics lanes, warehousing, facility, manpower,
// civil works, rentals, IT hardware, professional services, insurance.

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
  | "hybrid"
  | "negotiated";

export type EventState =
  | "draft"
  | "validated"
  | "published"
  | "invited"
  | "live"
  | "paused"
  | "closed"
  | "evaluation"
  | "approval"
  | "awarded"
  | "cancelled";

export const FORMAT_LABEL: Record<EventFormat, string> = {
  english: "English auction",
  sealed: "Sealed bid",
  dutch: "Dutch auction",
  japanese: "Japanese / clock",
  bafo: "Best & final offer",
  rfq: "RFQ",
  rfi: "RFI",
  rfp: "RFP",
  hybrid: "Hybrid sourcing",
  negotiated: "Negotiation",
};

export const STATE_LABEL: Record<EventState, string> = {
  draft: "Draft",
  validated: "Validated",
  published: "Published",
  invited: "Invited",
  live: "Live",
  paused: "Paused",
  closed: "Closed",
  evaluation: "Under evaluation",
  approval: "Awaiting approval",
  awarded: "Awarded",
  cancelled: "Cancelled",
};

export const CATEGORIES = [
  "Scrap & Metals",
  "E-waste",
  "Surplus Inventory",
  "Machinery",
  "Vehicles",
  "Raw Materials",
  "Commodities",
  "Logistics & Transport Lanes",
  "Warehousing",
  "Facility Management",
  "Manpower Contracts",
  "Civil Works",
  "Equipment Rentals",
  "IT Hardware",
  "Professional Services",
  "Insurance Sourcing",
  "Asset Liquidation",
  "Service Contracts",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Category-driven attribute schema for lots / line items. */
export const CATEGORY_ATTRIBUTES: Record<string, string[]> = {
  "Scrap & Metals": ["Grade", "Ferrous %", "Moisture", "Weighbridge", "Loading"],
  "E-waste": ["Asset class", "Data wipe", "Working %", "CPCB compliance"],
  "Surplus Inventory": ["SKU", "Shelf life", "Packaging", "Batch"],
  Machinery: ["Make", "Model", "Year", "Running hours", "Condition"],
  Vehicles: ["Registration", "Fuel", "KM reading", "RC status", "Insurance"],
  "Raw Materials": ["Specification", "Purity", "Incoterm", "Delivery window"],
  Commodities: ["Benchmark index", "Tolerance", "Settlement basis"],
  "Logistics & Transport Lanes": ["Origin", "Destination", "Vehicle type", "Trips/month", "SLA"],
  Warehousing: ["Location", "Sq. ft", "Racking", "Tenure", "Ops hours"],
  "Facility Management": ["Site count", "Headcount", "Shifts", "Scope"],
  "Manpower Contracts": ["Skill", "Headcount", "Shift pattern", "Statutory"],
  "Civil Works": ["BOQ item", "Unit", "Site", "Completion period"],
  "Equipment Rentals": ["Equipment", "Capacity", "Rental period", "Operator"],
  "IT Hardware": ["OEM", "Config", "Warranty", "Quantity"],
  "Professional Services": ["Scope", "Effort (person-days)", "Milestones"],
  "Insurance Sourcing": ["Policy type", "Sum insured", "Claim ratio", "Tenure"],
  "Asset Liquidation": ["Asset ID", "Book value", "Location", "As-is basis"],
  "Service Contracts": ["Service", "SLA", "Tenure", "Penalty regime"],
};

export type LineItem = {
  no: string;
  description: string;
  quantity: number;
  unit: string;
  startPrice: number;
  attributes: Record<string, string>;
};

export type Participant = {
  id: string;
  name: string;
  city: string;
  qualification: "qualified" | "provisional" | "blocked";
  invited: boolean;
  accepted: boolean;
  termsAccepted: boolean;
  emd: "not_required" | "pending" | "confirmed" | "forfeited";
  score: number; // technical score 0-100
  risk: "low" | "medium" | "high";
};

export type BidRow = {
  participantId: string;
  alias: string;
  amount: number;
  at: number;
  rank: number;
  valid: boolean;
};

export type ApprovalStep = {
  level: "L1" | "L2" | "L3";
  role: string;
  approver: string;
  status: "pending" | "approved" | "rejected" | "not_required";
  note?: string;
  at?: number;
};

export type Clarification = {
  id: string;
  question: string;
  askedBy: string;
  category: string;
  at: number;
  answer?: string;
  answeredBy?: string;
  status: "open" | "answered" | "published_addendum";
  addendumNo?: string;
};

export type InspectionSlot = {
  id: string;
  date: string;
  slot: string;
  facility: string;
  capacity: number;
  bookedCount: number;
  visitors: { participant: string; visitorName: string; vehicleNo: string; gatePassId: string; status: "booked" | "checked_in" | "completed" }[];
};

export type RFxQuestion = {
  id: string;
  section: string;
  title: string;
  type: "text" | "number" | "select" | "file" | "boolean";
  mandatory: boolean;
  weight: number;
  options?: string[];
  helpText?: string;
};

export type RFxResponse = {
  participantId: string;
  participantName: string;
  scores: Record<string, number>; // questionId -> score 0..weight
  totalScore: number;
  status: "submitted" | "shortlisted" | "disqualified" | "under_review";
  evaluatorNote?: string;
};

export type LandedCostBreakdown = {
  basePrice: number;
  freightPerUnit: number;
  handlingCost: number;
  gstRatePercent: number;
  insurancePerUnit: number;
  totalLandedCost: number;
};

export type AuctionEvent = {
  id: string;
  title: string;
  category: Category;
  direction: EventDirection;
  format: EventFormat;
  state: EventState;
  owner: string;
  businessUnit: string;
  currency: "INR";
  value: number; // current best / estimated value
  baseline: number; // reserve (forward) or target/budget (reverse)
  startAt: number;
  endAt: number;
  autoExtendMins: number;
  incrementValue: number;
  visibility: "open" | "invited" | "prequalified";
  rankVisibility: "rank_only" | "price_visible" | "blind";
  emdRequired: boolean;
  emdAmount: number;
  lots: LineItem[];
  participants: Participant[];
  bids: BidRow[];
  approvals: ApprovalStep[];
  terms: string[];
  audit: { at: number; actor: string; action: string }[];
  clarifications?: Clarification[];
  inspectionSlots?: InspectionSlot[];
  rfxQuestions?: RFxQuestion[];
  rfxResponses?: RFxResponse[];
  landedCost?: LandedCostBreakdown;
};

const now = Date.now();
const min = 60_000;
const hr = 60 * min;
const day = 24 * hr;

const p = (
  id: string,
  name: string,
  city: string,
  score: number,
  risk: Participant["risk"],
  o: Partial<Participant> = {},
): Participant => ({
  id,
  name,
  city,
  qualification: "qualified",
  invited: true,
  accepted: true,
  termsAccepted: true,
  emd: "confirmed",
  score,
  risk,
  ...o,
});

export const EVENTS: AuctionEvent[] = [
  {
    id: "FWD-2026-0341",
    title: "Copper & Aluminium Scrap — Q3 Disposal (12 sites)",
    category: "Scrap & Metals",
    direction: "forward",
    format: "english",
    state: "live",
    owner: "R. Iyer",
    businessUnit: "Corporate Disposals",
    currency: "INR",
    value: 94_20_000,
    baseline: 85_00_000,
    startAt: now - 3 * hr,
    endAt: now + 38 * min,
    autoExtendMins: 3,
    incrementValue: 25_000,
    visibility: "prequalified",
    rankVisibility: "rank_only",
    emdRequired: true,
    emdAmount: 5_00_000,
    lots: [
      {
        no: "1",
        description: "Bare bright copper wire scrap",
        quantity: 42,
        unit: "MT",
        startPrice: 55_00_000,
        attributes: { Grade: "A", Moisture: "<1%", Loading: "Seller scope" },
      },
      {
        no: "2",
        description: "Aluminium extrusion offcuts",
        quantity: 68,
        unit: "MT",
        startPrice: 30_00_000,
        attributes: { Grade: "6063", Moisture: "Nil", Loading: "Buyer scope" },
      },
    ],
    participants: [
      p("V-1021", "Meridian Metals Pvt Ltd", "Mumbai", 88, "low"),
      p("V-1044", "Kalyan Recyclers", "Coimbatore", 79, "low"),
      p("V-1090", "Northgate Alloys", "Ludhiana", 72, "medium"),
      p("V-1133", "Sundar Metal Traders", "Chennai", 64, "medium", { emd: "pending" }),
    ],
    bids: [
      { participantId: "V-1021", alias: "Bidder A", amount: 94_20_000, at: now - 4 * min, rank: 1, valid: true },
      { participantId: "V-1044", alias: "Bidder B", amount: 93_10_000, at: now - 7 * min, rank: 2, valid: true },
      { participantId: "V-1090", alias: "Bidder C", amount: 91_75_000, at: now - 12 * min, rank: 3, valid: true },
      { participantId: "V-1021", alias: "Bidder A", amount: 89_50_000, at: now - 26 * min, rank: 4, valid: true },
    ],
    approvals: [
      { level: "L1", role: "Category Manager", approver: "S. Nair", status: "pending" },
      { level: "L2", role: "Finance Controller", approver: "A. Bhatt", status: "pending" },
      { level: "L3", role: "CPO", approver: "M. Raghavan", status: "not_required" },
    ],
    terms: [
      "Material sold on as-is-where-is basis; inspection deemed completed.",
      "EMD of ₹5,00,000 blocked before bidding; forfeited on winner default.",
      "GST 18% and TCS 1% applicable on award value.",
      "Lifting within 10 working days of full payment; weighbridge slip final.",
    ],
    audit: [
      { at: now - 6 * day, actor: "R. Iyer", action: "Event created as draft" },
      { at: now - 5 * day, actor: "System", action: "Publish validation passed" },
      { at: now - 5 * day, actor: "R. Iyer", action: "Published to 4 prequalified vendors" },
      { at: now - 3 * hr, actor: "System", action: "Event moved to live" },
    ],
    clarifications: [
      {
        id: "CLR-01",
        question: "Can we deploy multi-axle trailers for copper wire lifting?",
        askedBy: "Meridian Metals",
        category: "Logistics & Site Access",
        at: now - 2 * day,
        answer: "Yes, Gate 4 accommodates up to 40ft hydraulic trailers.",
        answeredBy: "R. Iyer (Event Owner)",
        status: "published_addendum",
        addendumNo: "ADD-01",
      },
      {
        id: "CLR-02",
        question: "Is weighbridge recalibrated within the last 30 days?",
        askedBy: "Kalyan Recyclers",
        category: "Compliance & Measurement",
        at: now - day,
        answer: "Weighbridge recalibration certificate dated 15-Aug-2026 attached.",
        answeredBy: "Plant In-charge",
        status: "answered",
      },
    ],
    inspectionSlots: [
      {
        id: "SLOT-01",
        date: "28-Aug-2026",
        slot: "10:00 AM - 01:00 PM",
        facility: "Plot 48, MIDC Plant Yard",
        capacity: 6,
        bookedCount: 3,
        visitors: [
          { participant: "Meridian Metals", visitorName: "Rajesh Varma", vehicleNo: "MH-04-AB-1290", gatePassId: "GP-FWD-8821", status: "completed" },
          { participant: "Kalyan Recyclers", visitorName: "S. K. Iyer", vehicleNo: "TN-38-XY-4421", gatePassId: "GP-FWD-8822", status: "completed" },
        ],
      },
    ],
  },
  {
    id: "REV-2026-0118",
    title: "Primary Freight — 26 lanes, West & South (annual)",
    category: "Logistics & Transport Lanes",
    direction: "reverse",
    format: "english",
    state: "live",
    owner: "P. Deshmukh",
    businessUnit: "Supply Chain",
    currency: "INR",
    value: 18_40_00_000,
    baseline: 19_75_00_000,
    startAt: now - 55 * min,
    endAt: now + 12 * min,
    autoExtendMins: 5,
    incrementValue: 50_000,
    visibility: "invited",
    rankVisibility: "rank_only",
    emdRequired: false,
    emdAmount: 0,
    lots: [
      {
        no: "1",
        description: "Bhiwandi → Hyderabad, 32ft MXL",
        quantity: 240,
        unit: "trips/yr",
        startPrice: 4_80_00_000,
        attributes: { Origin: "Bhiwandi", Destination: "Hyderabad", SLA: "36 hrs" },
      },
      {
        no: "2",
        description: "Chakan → Chennai, 22ft CBT",
        quantity: 180,
        unit: "trips/yr",
        startPrice: 3_90_00_000,
        attributes: { Origin: "Chakan", Destination: "Chennai", SLA: "48 hrs" },
      },
    ],
    participants: [
      p("V-2201", "TransBharat Logistics", "Pune", 91, "low"),
      p("V-2245", "Southern Freightways", "Chennai", 84, "low"),
      p("V-2289", "QuickFleet India", "Navi Mumbai", 77, "medium"),
    ],
    bids: [
      { participantId: "V-2201", alias: "Trans A", amount: 18_40_00_000, at: now - 3 * min, rank: 1, valid: true },
      { participantId: "V-2245", alias: "Trans B", amount: 18_75_00_000, at: now - 9 * min, rank: 2, valid: true },
      { participantId: "V-2289", alias: "Trans C", amount: 19_10_00_000, at: now - 18 * min, rank: 3, valid: true },
    ],
    approvals: [
      { level: "L1", role: "Head of Logistics", approver: "K. Deshpande", status: "pending" },
      { level: "L2", role: "CFO", approver: "N. Sharma", status: "pending" },
    ],
    terms: [
      "Rate contract valid for 12 months with fuel price escalation linkage.",
      "Placement SLA: 4 hours from indent; penalty of ₹1,500/hr on delays.",
      "Transit insurance under shipper marine open policy.",
    ],
    audit: [
      { at: now - 12 * day, actor: "P. Deshmukh", action: "Created RFx draft" },
      { at: now - 10 * day, actor: "P. Deshmukh", action: "Published reverse auction" },
      { at: now - 55 * min, actor: "System", action: "Live room open" },
    ],
    landedCost: {
      basePrice: 18_40_00_000,
      freightPerUnit: 14200,
      handlingCost: 150000,
      gstRatePercent: 18,
      insurancePerUnit: 450,
      totalLandedCost: 21_71_20_000,
    },
  },
  {
    id: "RFP-2026-0077",
    title: "Pan-India Integrated Facility Management (45 hubs)",
    category: "Facility Management",
    direction: "reverse",
    format: "rfp",
    state: "evaluation",
    owner: "V. Saxena",
    businessUnit: "Admin & Real Estate",
    currency: "INR",
    value: 34_80_00_000,
    baseline: 38_00_00_000,
    startAt: now - 18 * day,
    endAt: now - 2 * day,
    autoExtendMins: 0,
    incrementValue: 0,
    visibility: "prequalified",
    rankVisibility: "blind",
    emdRequired: true,
    emdAmount: 10_00_000,
    lots: [
      {
        no: "1",
        description: "Housekeeping, security & MEP services",
        quantity: 45,
        unit: "facilities",
        startPrice: 38_00_00_000,
        attributes: { "Site count": "45", Headcount: "840", Shifts: "3" },
      },
    ],
    participants: [
      p("V-3310", "Aegis Facility Services", "Bengaluru", 92, "low"),
      p("V-3342", "Integrity FM India", "Gurugram", 86, "low"),
      p("V-3390", "UrbanOps India", "Delhi", 74, "high", { emd: "forfeited" }),
    ],
    bids: [
      { participantId: "V-3310", alias: "Bidder 1", amount: 34_80_00_000, at: now - 3 * day, rank: 1, valid: true },
      { participantId: "V-3342", alias: "Bidder 2", amount: 36_10_00_000, at: now - 3 * day, rank: 2, valid: true },
    ],
    approvals: [
      { level: "L1", role: "VP Corporate Services", approver: "D. Roy", status: "pending" },
      { level: "L2", role: "CFO", approver: "N. Sharma", status: "pending" },
    ],
    terms: ["Annual performance review SLA. 60-day mobilization period."],
    audit: [
      { at: now - 20 * day, actor: "V. Saxena", action: "Event created" },
      { at: now - 2 * day, actor: "System", action: "Evaluation phase started" },
    ],
    rfxQuestions: [
      { id: "Q1", section: "Statutory & Compliance", title: "EPF & ESIC zero-default certificate attached?", type: "boolean", mandatory: true, weight: 25 },
      { id: "Q2", section: "Operational Capability", title: "Deployable certified MEP technicians count across 45 sites", type: "number", mandatory: true, weight: 35 },
      { id: "Q3", section: "Quality & SLA", title: "ISO 45001 & OHSAS Safety Management Plan", type: "file", mandatory: true, weight: 40 },
    ],
    rfxResponses: [
      { participantId: "V-3310", participantName: "Aegis Facility Services", scores: { Q1: 25, Q2: 32, Q3: 35 }, totalScore: 92, status: "shortlisted", evaluatorNote: "High score across all statutory checks." },
      { participantId: "V-3342", participantName: "Integrity FM India", scores: { Q1: 25, Q2: 28, Q3: 33 }, totalScore: 86, status: "shortlisted", evaluatorNote: "Solid technical plan." },
    ],
  },
  {
    id: "JAP-2026-0031",
    title: "Contract Plant Operators & Machinists (24 months)",
    category: "Manpower Contracts",
    direction: "reverse",
    format: "japanese",
    state: "awarded",
    owner: "S. Kulkarni",
    businessUnit: "Manufacturing Ops",
    currency: "INR",
    value: 12_60_00_000,
    baseline: 13_50_00_000,
    startAt: now - 14 * day,
    endAt: now - 7 * day,
    autoExtendMins: 2,
    incrementValue: 1_00_000,
    visibility: "prequalified",
    rankVisibility: "rank_only",
    emdRequired: true,
    emdAmount: 4_00_000,
    lots: [
      {
        no: "1",
        description: "CNC Machinists & ITI Fitters",
        quantity: 120,
        unit: "headcount",
        startPrice: 13_50_00_000,
        attributes: { Skill: "ITI / CNC", Statutory: "100% compliant" },
      },
    ],
    participants: [
      p("V-5510", "Workforce First", "Nashik", 89, "low"),
      p("V-5532", "TalentBridge Staffing", "Aurangabad", 81, "low"),
    ],
    bids: [
      { participantId: "V-5510", alias: "Vendor A", amount: 12_60_00_000, at: now - 7 * day, rank: 1, valid: true },
      { participantId: "V-5532", alias: "Vendor B", amount: 12_90_00_000, at: now - 7 * day, rank: 2, valid: true },
    ],
    approvals: [
      { level: "L1", role: "Plant Head", approver: "R. Patil", status: "approved", at: now - 6 * day },
      { level: "L2", role: "Finance Head", approver: "A. Bhatt", status: "approved", at: now - 5 * day },
    ],
    terms: ["100% minimum wage compliance guarantee with quarterly statutory audit."],
    audit: [
      { at: now - 14 * day, actor: "S. Kulkarni", action: "Published" },
      { at: now - 7 * day, actor: "System", action: "Auction concluded" },
      { at: now - 5 * day, actor: "A. Bhatt", action: "Award approved" },
    ],
  },
];

export type Order = {
  id: string;
  orderNumber: string;
  eventId: string;
  eventTitle: string;
  type: "Sale Order" | "Purchase Order" | "Work Order" | "Contract";
  vendorId: string;
  vendorName: string;
  totalValue: number;
  gstAmount: number;
  status: "draft" | "issued" | "in_progress" | "dispatched" | "delivered" | "qc_verified" | "settled" | "closed";
  issuedDate: string;
  deliveryDeadline: string;
  milestones: { name: string; status: "pending" | "current" | "completed"; due: string; weightPercent: number }[];
  weighbridgeSlips?: { slipNo: string; grossWeight: string; tareWeight: string; netWeight: string; date: string }[];
  gatePasses?: { passNo: string; vehicleNo: string; driver: string; status: "valid" | "used" | "expired" }[];
  invoices?: { invoiceNo: string; amount: number; gst: number; status: "pending" | "approved" | "paid" }[];
};

export const ORDERS: Order[] = [
  {
    id: "ORD-2026-0901",
    orderNumber: "SO-FWD-2026-0341-01",
    eventId: "FWD-2026-0341",
    eventTitle: "Copper & Aluminium Scrap — Q3 Disposal",
    type: "Sale Order",
    vendorId: "V-1021",
    vendorName: "Meridian Metals Pvt Ltd",
    totalValue: 94_20_000,
    gstAmount: 16_95_600,
    status: "in_progress",
    issuedDate: "28-Aug-2026",
    deliveryDeadline: "10-Sep-2026",
    milestones: [
      { name: "Award & 100% Payment Clearance", status: "completed", due: "30-Aug-2026", weightPercent: 20 },
      { name: "Yard Access & Gate Pass Generation", status: "current", due: "02-Sep-2026", weightPercent: 20 },
      { name: "Material Loading & Weighbridge Tare/Gross", status: "pending", due: "06-Sep-2026", weightPercent: 40 },
      { name: "Final Quantity Settlement & Gate Out", status: "pending", due: "10-Sep-2026", weightPercent: 20 },
    ],
    weighbridgeSlips: [
      { slipNo: "WB-MIDC-4890", grossWeight: "38.40 MT", tareWeight: "14.20 MT", netWeight: "24.20 MT", date: "29-Aug-2026" },
    ],
    gatePasses: [
      { passNo: "GP-FWD-8821", vehicleNo: "MH-04-AB-1290", driver: "Ramesh Pawar", status: "valid" },
    ],
    invoices: [
      { invoiceNo: "INV-DISP-2026-081", amount: 94_20_000, gst: 16_95_600, status: "approved" },
    ],
  },
  {
    id: "ORD-2026-0880",
    orderNumber: "PO-REV-2026-0118-01",
    eventId: "REV-2026-0118",
    eventTitle: "Primary Freight — 26 lanes, West & South",
    type: "Purchase Order",
    vendorId: "V-2201",
    vendorName: "TransBharat Logistics",
    totalValue: 18_40_00_000,
    gstAmount: 3_31_20_000,
    status: "issued",
    issuedDate: "27-Aug-2026",
    deliveryDeadline: "31-Aug-2027",
    milestones: [
      { name: "Contract Signing & Security Deposit", status: "completed", due: "29-Aug-2026", weightPercent: 10 },
      { name: "Fleet Mobilization & Lane Indents", status: "current", due: "05-Sep-2026", weightPercent: 30 },
      { name: "Quarterly Performance & SLA Audit", status: "pending", due: "30-Nov-2026", weightPercent: 60 },
    ],
  },
  {
    id: "ORD-2026-0750",
    orderNumber: "WO-JAP-2026-0031-01",
    eventId: "JAP-2026-0031",
    eventTitle: "Contract Plant Operators & Machinists",
    type: "Work Order",
    vendorId: "V-5510",
    vendorName: "Workforce First",
    totalValue: 12_60_00_000,
    gstAmount: 2_26_80_000,
    status: "in_progress",
    issuedDate: "20-Aug-2026",
    deliveryDeadline: "20-Aug-2028",
    milestones: [
      { name: "Mobilization of 120 Machinists", status: "completed", due: "25-Aug-2026", weightPercent: 25 },
      { name: "EPF/ESIC Compliance Verification", status: "current", due: "05-Sep-2026", weightPercent: 25 },
      { name: "Monthly Wage Disbursement & Invoice", status: "pending", due: "30-Sep-2026", weightPercent: 50 },
    ],
  },
];

export type FallbackOffer = {
  eventId: string;
  h1Vendor: string;
  h1Amount: number;
  h2Vendor: string;
  h2Amount: number;
  h3Vendor: string;
  h3Amount: number;
  priceDelta: number;
  defaultReason?: string;
  status: "not_triggered" | "h2_offered" | "h2_accepted" | "re_auction_recommended";
};

export const FALLBACK_OFFERS: FallbackOffer[] = [
  {
    eventId: "FWD-2026-0341",
    h1Vendor: "Meridian Metals Pvt Ltd",
    h1Amount: 94_20_000,
    h2Vendor: "Kalyan Recyclers",
    h2Amount: 93_10_000,
    h3Vendor: "Northgate Alloys",
    h3Amount: 91_75_000,
    priceDelta: 1_10_000,
    defaultReason: "Potential fallback if H1 defaults on 100% payment within 48h.",
    status: "not_triggered",
  },
  {
    eventId: "REV-2026-0118",
    h1Vendor: "TransBharat Logistics",
    h1Amount: 18_40_00_000,
    h2Vendor: "Southern Freightways",
    h2Amount: 18_75_00_000,
    h3Vendor: "QuickFleet India",
    h3Amount: 19_10_00_000,
    priceDelta: 35_00_000,
    status: "not_triggered",
  },
];

export type EmdLedgerRow = {
  id: string;
  eventId: string;
  party: string;
  amount: number;
  state: "held" | "released" | "forfeited" | "applied";
};

export const EMD_LEDGER: EmdLedgerRow[] = [
  { id: "EMD-411", eventId: "FWD-2026-0341", party: "Meridian Metals Pvt Ltd", amount: 5_00_000, state: "held" },
  { id: "EMD-412", eventId: "FWD-2026-0341", party: "Kalyan Recyclers", amount: 5_00_000, state: "held" },
  { id: "EMD-402", eventId: "RFP-2026-0077", party: "UrbanOps India", amount: 10_00_000, state: "forfeited" },
  { id: "EMD-398", eventId: "JAP-2026-0031", party: "TalentBridge Staffing", amount: 4_00_000, state: "released" },
  { id: "EMD-397", eventId: "JAP-2026-0031", party: "Workforce First", amount: 4_00_000, state: "applied" },
];

export type Fulfilment = {
  id: string;
  eventId: string;
  party: string;
  stage: "award_letter" | "order" | "scheduled" | "in_progress" | "delivered" | "closed";
  nextAction: string;
  dueAt: number;
};

export const FULFILMENTS: Fulfilment[] = [
  { id: "FUL-701", eventId: "JAP-2026-0031", party: "Workforce First", stage: "in_progress", nextAction: "Monthly compliance upload", dueAt: now + 4 * day },
  { id: "FUL-702", eventId: "RFP-2026-0077", party: "Aegis Facility Services", stage: "order", nextAction: "Issue work order & mobilisation plan", dueAt: now + 2 * day },
  { id: "FUL-703", eventId: "FWD-2026-0341", party: "Meridian Metals Pvt Ltd", stage: "award_letter", nextAction: "Await balance payment, then gate pass", dueAt: now + 3 * day },
];

export type Dispute = {
  id: string;
  eventId: string;
  party: string;
  type: "quantity" | "quality" | "payment" | "sla" | "process";
  severity: "low" | "medium" | "high";
  status: "open" | "under_review" | "resolved";
  opened: number;
  summary: string;
};

export const DISPUTES: Dispute[] = [
  { id: "DSP-51", eventId: "FWD-2026-0341", party: "Kalyan Recyclers", type: "process", severity: "medium", status: "under_review", opened: now - 2 * day, summary: "Claims auto-extension was not applied to a bid placed at T-8 seconds." },
  { id: "DSP-52", eventId: "JAP-2026-0031", party: "Workforce First", type: "payment", severity: "low", status: "open", opened: now - 5 * hr, summary: "Statutory reimbursement for March pending against invoice INV-9001." },
  { id: "DSP-49", eventId: "RFP-2026-0077", party: "UrbanOps India", type: "quality", severity: "high", status: "resolved", opened: now - 14 * day, summary: "Technical score challenge; committee re-scored and outcome upheld." },
];

export type Vendor = {
  id: string;
  name: string;
  categories: string[];
  city: string;
  status: "active" | "onboarding" | "suspended" | "blacklisted";
  score: number;
  events: number;
  winRate: number;
  compliance: "valid" | "expiring" | "expired";
};

export const VENDORS: Vendor[] = [
  { id: "V-1021", name: "Meridian Metals Pvt Ltd", categories: ["Scrap & Metals"], city: "Mumbai", status: "active", score: 88, events: 42, winRate: 0.31, compliance: "valid" },
  { id: "V-2201", name: "TransBharat Logistics", categories: ["Logistics & Transport Lanes"], city: "Pune", status: "active", score: 91, events: 28, winRate: 0.46, compliance: "expiring" },
  { id: "V-3310", name: "Aegis Facility Services", categories: ["Facility Management"], city: "Bengaluru", status: "active", score: 92, events: 17, winRate: 0.52, compliance: "valid" },
  { id: "V-3390", name: "UrbanOps India", categories: ["Facility Management", "Manpower Contracts"], city: "Delhi", status: "suspended", score: 74, events: 11, winRate: 0.09, compliance: "expired" },
  { id: "V-4410", name: "Precision Machine Traders", categories: ["Machinery"], city: "Rajkot", status: "onboarding", score: 80, events: 3, winRate: 0.33, compliance: "valid" },
  { id: "V-5510", name: "Workforce First", categories: ["Manpower Contracts"], city: "Nashik", status: "active", score: 89, events: 22, winRate: 0.41, compliance: "valid" },
];

export type OrgUser = {
  name: string;
  email: string;
  role: "Event owner" | "Approver" | "Finance" | "Compliance" | "Auditor" | "Admin";
  bu: string;
  mfa: boolean;
  lastActive: number;
};

export const ORG_USERS: OrgUser[] = [
  { name: "R. Iyer", email: "r.iyer@scrapify.example", role: "Event owner", bu: "Corporate Disposals", mfa: true, lastActive: now - 20 * min },
  { name: "P. Deshmukh", email: "p.deshmukh@scrapify.example", role: "Event owner", bu: "Supply Chain", mfa: true, lastActive: now - 2 * hr },
  { name: "A. Bhatt", email: "a.bhatt@scrapify.example", role: "Finance", bu: "Corporate Finance", mfa: true, lastActive: now - 40 * min },
  { name: "M. Raghavan", email: "m.raghavan@scrapify.example", role: "Approver", bu: "Executive", mfa: true, lastActive: now - 6 * hr },
  { name: "L. Fernandes", email: "l.fernandes@scrapify.example", role: "Compliance", bu: "Legal & Compliance", mfa: false, lastActive: now - day },
  { name: "G. Kapoor", email: "g.kapoor@scrapify.example", role: "Auditor", bu: "Internal Audit", mfa: true, lastActive: now - 3 * day },
];

export const KPIS = {
  liveEvents: EVENTS.filter((e) => e.state === "live").length,
  awaitingApproval: 4,
  savingsYtd: 41_20_00_000,
  realisationYtd: 128_60_00_000,
  cycleTimeDays: 11.4,
  participationRate: 0.72,
  awardedYtd: 96,
  vendorsActive: VENDORS.filter((v) => v.status === "active").length,
};

export const SPEND_TREND = [
  { month: "Feb", savings: 2.4, realisation: 8.1 },
  { month: "Mar", savings: 3.1, realisation: 9.4 },
  { month: "Apr", savings: 2.8, realisation: 11.2 },
  { month: "May", savings: 4.2, realisation: 12.8 },
  { month: "Jun", savings: 5.1, realisation: 14.6 },
  { month: "Jul", savings: 4.7, realisation: 16.2 },
  { month: "Aug", savings: 6.3, realisation: 18.9 },
];

export const FORMAT_MIX = [
  { format: "English", events: 34 },
  { format: "Reverse", events: 28 },
  { format: "Sealed", events: 12 },
  { format: "RFQ/RFP", events: 19 },
  { format: "Dutch/Japanese", events: 7 },
];

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export const cr = (n: number) =>
  n >= 1_00_00_000
    ? `₹${(n / 1_00_00_000).toFixed(2)} Cr`
    : n >= 1_00_000
      ? `₹${(n / 1_00_000).toFixed(2)} L`
      : inr(n);

export const timeLeft = (endAt: number, from = Date.now()) => {
  const ms = endAt - from;
  if (ms <= 0) return "Closed";
  const d = Math.floor(ms / day);
  const h = Math.floor((ms % day) / hr);
  const m = Math.floor((ms % hr) / min);
  const s = Math.floor((ms % min) / 1000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
};

export const fmtDate = (ms: number) =>
  new Date(ms).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function getEvent(id: string): AuctionEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

export function getOrder(id: string): Order | undefined {
  return ORDERS.find((o) => o.id === id || o.orderNumber === id);
}

export function publishChecklist(event: AuctionEvent) {
  return [
    { label: "Valid event title & category assigned", ok: event.title.length > 5 && !!event.category },
    { label: "At least one line item with quantity", ok: event.lots.length > 0 },
    { label: "Commercial rules (Reserve / Target / Increment)", ok: event.baseline > 0 },
    { label: "EMD & Security conditions configured", ok: !event.emdRequired || event.emdAmount > 0 },
    { label: "At least 2 qualified participants invited", ok: event.participants.length >= 2 },
    { label: "Terms & Conditions pact attached", ok: event.terms.length > 0 },
  ];
}

export function approvalTriggers(event: AuctionEvent) {
  const triggers: string[] = [];
  if (event.value > 10_00_000) triggers.push("Award Value exceeds ₹10,00,000 threshold (Level 2 Approval Required)");
  if (event.direction === "forward" && event.value < event.baseline) triggers.push("Winning bid below reserve baseline (Business Unit Head Sign-off Required)");
  if (event.direction === "reverse" && event.value > event.baseline) triggers.push("Procurement value exceeds target budget ceiling");
  return triggers;
}

export type Invoice = {
  id: string;
  eventId: string;
  party: string;
  amount: number;
  due: number;
  status: "paid" | "part_paid" | "overdue";
};

export const INVOICES: Invoice[] = [
  { id: "INV-9001", eventId: "FWD-2026-0341", party: "Meridian Metals Pvt Ltd", amount: 94_20_000, due: now + 5 * day, status: "part_paid" },
  { id: "INV-8890", eventId: "JAP-2026-0031", party: "Workforce First", amount: 12_60_00_000, due: now + 12 * day, status: "paid" },
  { id: "INV-8712", eventId: "REV-2026-0118", party: "TransBharat Logistics", amount: 18_40_00_000, due: now - 2 * day, status: "overdue" },
];

export function settlement(input: AuctionEvent | number, emdAmountArg = 0) {
  let value = 0;
  let emd = 0;
  let isReverse = false;

  if (typeof input === "object" && input !== null) {
    value = input.value;
    emd = input.emdAmount;
    isReverse = input.direction === "reverse";
  } else {
    value = input;
    emd = emdAmountArg;
  }

  const gst = Math.round(value * 0.18);
  const tcs = isReverse ? 0 : Math.round((value + gst) * 0.01);
  const total = value + gst + tcs;
  const balance = total - emd;

  return {
    value,
    winningAmount: value,
    emd,
    emdAdjusted: emd,
    gst,
    tcs,
    total,
    grandTotal: total,
    balance,
    balancePayable: balance,
  };
}
