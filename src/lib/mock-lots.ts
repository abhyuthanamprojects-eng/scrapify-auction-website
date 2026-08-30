import copperImg from "@/assets/lot-copper.jpg";
import pcbImg from "@/assets/lot-pcb.jpg";
import aluminumImg from "@/assets/lot-aluminum.jpg";
import batteriesImg from "@/assets/lot-batteries.jpg";
import itImg from "@/assets/lot-it.jpg";

export type Lot = {
  id: string;
  title: string;
  category: string;
  seller: string;
  location: string;
  weight: string;
  condition: string;
  currentBid: number;
  bidders: number;
  endsAt: number; // ms epoch
  status: "live" | "upcoming" | "ended";
  image: string;
  emd: number;
  increment: number;
  reserve: number;
  auctionType: "forward" | "reverse";
  description: string;
  history: { bidder: string; amount: number; at: string }[];
};

const now = Date.now();
const min = 60_000;
const hr = 60 * min;

export const LOTS: Lot[] = [
  {
    id: "AUC-2026-0012",
    title: "Copper Wire Scrap — Bare Bright #1",
    category: "Non-Ferrous",
    seller: "BHEL Trichy Plant",
    location: "Trichy, TN",
    weight: "12.4 MT",
    condition: "Grade A",
    currentBid: 7_84_000,
    bidders: 14,
    endsAt: now + 42 * min,
    status: "live",
    image: copperImg,
    emd: 25_000,
    increment: 5_000,
    reserve: 8_50_000,
    auctionType: "forward",
    description:
      "Bare bright copper wire scrap from decommissioned transmission cables. No insulation, minimal oxidation. Segregated and baled.",
    history: [
      { bidder: "Bidder #7", amount: 7_84_000, at: "2 min ago" },
      { bidder: "Bidder #3", amount: 7_79_000, at: "4 min ago" },
      { bidder: "Bidder #7", amount: 7_74_000, at: "6 min ago" },
      { bidder: "Bidder #12", amount: 7_69_000, at: "9 min ago" },
    ],
  },
  {
    id: "AUC-2026-0014",
    title: "Retired IT Servers & Rack Equipment",
    category: "IT Assets",
    seller: "NTPC Corporate IT",
    location: "Noida, UP",
    weight: "3.8 MT",
    condition: "Used",
    currentBid: 2_16_500,
    bidders: 9,
    endsAt: now + 1 * hr + 12 * min,
    status: "live",
    image: itImg,
    emd: 15_000,
    increment: 2_500,
    reserve: 2_25_000,
    auctionType: "forward",
    description:
      "Approx 120 units of 1U/2U rack servers, patch panels, and network switches. Data-wiped, certificate provided post-lift.",
    history: [
      { bidder: "Bidder #4", amount: 2_16_500, at: "just now" },
      { bidder: "Bidder #1", amount: 2_14_000, at: "3 min ago" },
    ],
  },
  {
    id: "AUC-2026-0018",
    title: "Aluminium Sheet Cuttings — Baled",
    category: "Non-Ferrous",
    seller: "Tata Steel Jamshedpur",
    location: "Jamshedpur, JH",
    weight: "22.0 MT",
    condition: "Clean",
    currentBid: 39_60_000,
    bidders: 22,
    endsAt: now + 18 * min,
    status: "live",
    image: aluminumImg,
    emd: 50_000,
    increment: 10_000,
    reserve: 41_00_000,
    auctionType: "forward",
    description:
      "Compressed aluminium sheet cuttings from stamping line. Uniform bales, palletised, ready for pickup.",
    history: [
      { bidder: "Bidder #9", amount: 39_60_000, at: "1 min ago" },
      { bidder: "Bidder #2", amount: 39_50_000, at: "5 min ago" },
    ],
  },
  {
    id: "AUC-2026-0021",
    title: "Populated Circuit Boards (Mixed)",
    category: "E-Waste",
    seller: "SAIL Bokaro",
    location: "Bokaro, JH",
    weight: "1.2 MT",
    condition: "As-Is",
    currentBid: 5_45_000,
    bidders: 11,
    endsAt: now + 3 * hr + 5 * min,
    status: "upcoming",
    image: pcbImg,
    emd: 20_000,
    increment: 5_000,
    reserve: 6_00_000,
    auctionType: "forward",
    description:
      "Assorted populated PCBs — memory, motherboards, telecom cards. Buyer must be a registered e-waste recycler.",
    history: [],
  },
  {
    id: "AUC-2026-0023",
    title: "Used Lead-Acid Batteries",
    category: "Batteries",
    seller: "Indian Railways — CR",
    location: "Mumbai, MH",
    weight: "8.6 MT",
    condition: "Drained",
    currentBid: 9_12_000,
    bidders: 17,
    endsAt: now + 55 * min,
    status: "live",
    image: batteriesImg,
    emd: 30_000,
    increment: 5_000,
    reserve: 9_50_000,
    auctionType: "reverse",
    description:
      "UPS and traction batteries, fully drained, palletised. Reverse procurement — lowest recycler quote wins.",
    history: [
      { bidder: "Bidder #6", amount: 9_12_000, at: "just now" },
      { bidder: "Bidder #8", amount: 9_18_000, at: "2 min ago" },
    ],
  },
  {
    id: "AUC-2026-0027",
    title: "Mixed Ferrous Turnings",
    category: "Ferrous",
    seller: "BHEL Haridwar",
    location: "Haridwar, UK",
    weight: "45.0 MT",
    condition: "Oiled",
    currentBid: 12_80_000,
    bidders: 6,
    endsAt: now + 5 * hr,
    status: "upcoming",
    image: aluminumImg,
    emd: 40_000,
    increment: 5_000,
    reserve: 13_50_000,
    auctionType: "forward",
    description:
      "Steel turnings from CNC operations. Contains cutting oil residue. Buyer arranges lifting via own transport.",
    history: [],
  },
];

export const CATEGORIES = [
  "All",
  "Ferrous",
  "Non-Ferrous",
  "E-Waste",
  "IT Assets",
  "Batteries",
  "Plastic",
];

export function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export function timeLeft(endsAt: number): { label: string; urgent: boolean } {
  const diff = Math.max(0, endsAt - Date.now());
  if (diff === 0) return { label: "Ended", urgent: false };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const urgent = diff < 60 * 60_000;
  if (h > 0) return { label: `${h}h ${m}m`, urgent };
  if (m > 0) return { label: `${m}m ${String(s).padStart(2, "0")}s`, urgent };
  return { label: `${s}s`, urgent: true };
}

export function getLot(id: string): Lot | undefined {
  return LOTS.find((l) => l.id === id);
}