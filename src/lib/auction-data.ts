import fallbackImg from '@/assets/lot-aluminum.jpg';
import batteriesImg from '@/assets/lot-batteries.jpg';
import copperImg from '@/assets/lot-copper.jpg';
import itImg from '@/assets/lot-it.jpg';
import pcbImg from '@/assets/lot-pcb.jpg';
import { api } from '@/lib/api-client';

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
  startsAt: number;
  endsAt: number;
  status: 'live' | 'upcoming' | 'ended';
  image: string;
  emd: number;
  increment: number;
  reserve: number;
  auctionType: 'forward' | 'reverse';
  description: string;
  history: { bidder: string; amount: number; at: string }[];
  subLots: Array<{ no: string; description: string; quantity: string; startPrice: number }>;
  terms: string[];
  isRegistered: boolean;
  registrationOpen: boolean;
  registrationEnd: number | null;
};

type ApiAuction = Record<string, unknown>;

const apiOrigin = (import.meta.env.VITE_API_URL || 'https://api.scrapifyauctions.com/api/v1')
  .replace(/\/api\/v1\/?$/, '');

const resolvePhotoUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const source = value.trim();
  if (/^https?:\/\//i.test(source)) {
    // Old seeded records may contain a local APP_URL. Resolve those records
    // against the live API host so the public site and mobile app can render
    // the same stored asset after a production deploy.
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(source)) {
      const path = source.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
      return `${apiOrigin}${path}`;
    }
    return source;
  }
  return `${apiOrigin}/${source.replace(/^\//, '')}`;
};

const imageFor = (category: string, photos: unknown, imageUrl?: unknown): string => {
  const candidates = [imageUrl, ...(Array.isArray(photos) ? photos : [])];
  for (const candidate of candidates) {
    const value = typeof candidate === 'object' && candidate !== null
      ? (candidate as Record<string, unknown>).url ??
        (candidate as Record<string, unknown>).image_url ??
        (candidate as Record<string, unknown>).path
      : candidate;
    const resolved = resolvePhotoUrl(value);
    if (resolved) return resolved;
  }
  const value = category.toLowerCase();
  if (value.includes('copper') || value.includes('non-ferrous')) return copperImg;
  if (value.includes('battery')) return batteriesImg;
  if (value.includes('it asset')) return itImg;
  if (value.includes('e-waste') || value.includes('pcb')) return pcbImg;
  return fallbackImg;
};

const numeric = (value: unknown): number => Number(value ?? 0) || 0;
const epoch = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};
const statusOf = (value: unknown): Lot['status'] => {
  if (value === 'live' || value === 'extended' || value === 'paused') return 'live';
  if (value === 'closed' || value === 'cancelled' || value === 'awarded') return 'ended';
  return 'upcoming';
};

export function toLot(row: ApiAuction): Lot {
  const category = String(row.category ?? 'Uncategorised');
  const startsAt = epoch(row.schedule_start, Date.now());
  const endsAt = epoch(row.schedule_end, startsAt);
  const bids = Array.isArray(row.bids) ? row.bids : [];
  const subLots = Array.isArray(row.sub_lots) ? row.sub_lots : [];
  const terms = typeof row.terms === 'string'
    ? row.terms.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
    : [];

  return {
    id: String(row.code ?? row.id ?? ''),
    title: String(row.title ?? ''),
    category,
    seller: String(row.company ?? ''),
    location: String(row.location ?? row.plant ?? row.warehouse ?? ''),
    weight: [row.quantity, row.uom].filter(Boolean).join(' ') || 'Not specified',
    condition: String(row.material_type ?? 'As specified'),
    currentBid: numeric(row.current_highest_inr ?? row.starting_price_inr),
    bidders: numeric(row.bidders),
    startsAt,
    endsAt,
    status: statusOf(row.status),
    image: imageFor(category, row.photos, row.image_url ?? row.cover_image_url ?? row.thumbnail_url),
    emd: numeric(row.emd_amount_inr),
    increment: numeric(row.bid_increment_inr),
    reserve: numeric(row.reserve_price_inr),
    auctionType: row.direction === 'reverse' ? 'reverse' : 'forward',
    description: String(row.description ?? row.material_type ?? ''),
    history: bids.map((bid) => {
      const item = bid as Record<string, unknown>;
      return {
        bidder: String(item.vendor_name ?? item.vendor_id ?? 'Bidder'),
        amount: numeric(item.amount_inr),
        at: String(item.at ?? ''),
      };
    }),
    subLots: subLots.map((subLot, index) => {
      const item = subLot as Record<string, unknown>;
      return {
        no: String(item.code ?? item.id ?? index + 1),
        description: String(item.name ?? ''),
        quantity: [item.quantity, item.uom].filter(Boolean).join(' '),
        startPrice: numeric(item.reserve_price_inr ?? item.current_bid_inr),
      };
    }),
    terms,
    isRegistered: row.is_registered === true,
    registrationOpen: row.registration_open !== false,
    registrationEnd: row.registration_end ? epoch(row.registration_end, 0) : null,
  };
}

export async function getAuctions(params: Record<string, string> = {}): Promise<Lot[]> {
  const response = await api.getAuctions(params);
  const rows = Array.isArray(response.data) ? response.data : [];
  return rows.map((row: ApiAuction) => toLot(row));
}

export async function getLot(id: string): Promise<Lot> {
  const response = await api.getAuction(id);
  return toLot((response.data ?? response) as ApiAuction);
}

export async function getCategories(): Promise<string[]> {
  const response = await api.getCategories();
  const rows = Array.isArray(response.data) ? response.data : [];
  return ['All', ...rows.map((row: { name?: string }) => row.name).filter(Boolean)];
}

export function formatINR(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function timeLeft(endsAt: number): { label: string; urgent: boolean } {
  const diff = Math.max(0, endsAt - Date.now());
  if (diff === 0) return { label: 'Ended', urgent: false };
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  const urgent = diff < 3_600_000;
  if (hours > 0) return { label: `${hours}h ${minutes}m`, urgent };
  if (minutes > 0) return { label: `${minutes}m ${String(seconds).padStart(2, '0')}s`, urgent };
  return { label: `${seconds}s`, urgent: true };
}
