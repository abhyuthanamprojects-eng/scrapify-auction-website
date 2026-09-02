import { api } from '@/lib/api-client';
import type {
  AuctionEvent,
  EventFormat,
  EventState,
  Order,
  Vendor,
} from '@/lib/enterprise';

const num = (value: unknown) => Number(value ?? 0) || 0;
const date = (value: unknown) => typeof value === 'string' ? Date.parse(value) || 0 : 0;
const state = (value: unknown): EventState => {
  const status = String(value ?? 'draft');
  const aliases: Record<string, EventState> = {
    pending_approval: 'approval', approved: 'validated', sent_back: 'draft',
    under_evaluation: 'evaluation', awaiting_approval: 'approval',
  };
  return aliases[status] ?? (status as EventState);
};

const asRows = (response: any): Record<string, any>[] => {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : [];
};

const compliance = (value: unknown): Vendor['compliance'] => {
  const raw = String(value ?? 'valid').toLowerCase();
  if (raw === 'expired' || raw === 'rejected') return 'expired';
  if (raw === 'expiring' || raw === 'pending') return 'expiring';
  return 'valid';
};

const vendorStatus = (value: unknown): Vendor['status'] => {
  const raw = String(value ?? 'onboarding').toLowerCase();
  if (raw === 'approved' || raw === 'verified' || raw === 'active') return 'active';
  if (raw === 'suspended') return 'suspended';
  if (raw === 'blacklisted') return 'blacklisted';
  return 'onboarding';
};

const orderType = (value: unknown): Order['type'] => {
  const raw = String(value ?? 'Sale Order').toLowerCase();
  if (raw.includes('purchase')) return 'Purchase Order';
  if (raw.includes('work')) return 'Work Order';
  if (raw.includes('contract')) return 'Contract';
  return 'Sale Order';
};

const eventFormat = (row: Record<string, any>): EventFormat => {
  const raw = String(row.format ?? row.auction_type ?? '').toLowerCase();
  if (['sealed', 'dutch', 'japanese', 'bafo', 'rfq', 'rfi', 'rfp', 'hybrid', 'negotiated'].includes(raw)) {
    return raw as EventFormat;
  }
  return row.direction === 'reverse' ? 'rfq' : 'english';
};

export async function loadEvents(params: Record<string, string> = {}): Promise<AuctionEvent[]> {
  const response = await api.getAuctions({ ...params, per_page: '100' });
  const rows = asRows(response);
  return rows.map((row: Record<string, any>) => ({
    id: String(row.code ?? row.id),
    title: String(row.title ?? ''),
    category: String(row.category ?? 'Scrap & Metals') as AuctionEvent['category'],
    direction: row.direction === 'reverse' ? 'reverse' : 'forward',
    format: eventFormat(row),
    state: state(row.status),
    owner: String(row.submitted_by ?? ''),
    businessUnit: String(row.company ?? ''),
    currency: 'INR',
    value: num(row.current_highest_inr ?? row.starting_price_inr),
    baseline: num(row.reserve_price_inr),
    startAt: date(row.schedule_start),
    endAt: date(row.schedule_end),
    autoExtendMins: 0,
    incrementValue: num(row.bid_increment_inr),
    visibility: 'open',
    rankVisibility: 'price_visible',
    emdRequired: num(row.emd_amount_inr) > 0,
    emdAmount: num(row.emd_amount_inr),
    lots: (row.sub_lots ?? []).map((lot: Record<string, any>, index: number) => ({
      no: String(lot.code ?? lot.id ?? index + 1),
      description: String(lot.name ?? ''),
      quantity: num(lot.quantity),
      unit: String(lot.uom ?? ''),
      startPrice: num(lot.reserve_price_inr),
      attributes: {},
    })),
    participants: (row.participants ?? row.vendors ?? []).map((vendor: Record<string, any>) => ({
      id: String(vendor.code ?? vendor.id ?? ''),
      name: String(vendor.company_name ?? vendor.name ?? 'Vendor'),
      city: String(vendor.city ?? vendor.location ?? ''),
      qualification: 'qualified',
      invited: true,
      accepted: Boolean(vendor.accepted ?? true),
      termsAccepted: Boolean(vendor.terms_accepted ?? false),
      emd: num(vendor.emd_amount_inr) > 0 ? 'confirmed' : 'not_required',
      score: num(vendor.technical_score ?? vendor.score),
      risk: 'low',
    })),
    bids: (row.bids ?? []).map((bid: Record<string, any>, index: number) => ({
      participantId: String(bid.vendor_id ?? ''), alias: String(bid.vendor_name ?? 'Bidder'),
      amount: num(bid.amount_inr), at: date(bid.at), rank: index + 1, valid: true,
    })),
    approvals: [],
    terms: typeof row.terms === 'string' ? row.terms.split(/\r?\n/).filter(Boolean) : [],
    audit: [],
  }));
}

export async function loadVendors(): Promise<Vendor[]> {
  const response = await api.getVendors({ per_page: '100' });
  const rows = asRows(response);
  return rows.map((row: Record<string, any>) => ({
    id: String(row.code ?? row.id),
    name: String(row.company_name ?? row.name ?? ''),
    categories: Array.isArray(row.material_interest)
      ? row.material_interest.map(String)
      : Array.isArray(row.categories)
        ? row.categories.map((cat: any) => String(cat.name ?? cat))
        : [],
    city: String(row.city ?? row.location ?? ''),
    status: vendorStatus(row.status),
    score: num(row.technical_score ?? row.score),
    events: num(row.events_count ?? row.events),
    winRate: num(row.win_rate ?? row.winRate) > 1 ? num(row.win_rate ?? row.winRate) / 100 : num(row.win_rate ?? row.winRate),
    compliance: compliance(row.compliance_status ?? row.kyc_status ?? row.status),
  }));
}

export async function loadOrders(): Promise<Order[]> {
  const response = await api.getOrders({ per_page: '100' });
  const rows = asRows(response);
  return rows.map((row: Record<string, any>) => ({
    id: String(row.code ?? row.id),
    orderNumber: String(row.order_number ?? row.code ?? row.id),
    eventId: String(row.auction_code ?? row.auction_id ?? ''),
    eventTitle: String(row.auction_title ?? row.event_title ?? row.title ?? ''),
    type: orderType(row.type),
    vendorId: String(row.vendor_code ?? row.vendor_id ?? ''),
    vendorName: String(row.vendor_name ?? row.counterparty ?? ''),
    totalValue: num(row.total_value_inr ?? row.amount_inr ?? row.total_inr),
    gstAmount: num(row.gst_amount_inr ?? row.gst_inr),
    status: String(row.status ?? 'draft') as Order['status'],
    issuedDate: String(row.issued_date ?? row.created_at ?? ''),
    deliveryDeadline: String(row.delivery_deadline ?? row.due_at ?? ''),
    milestones: (row.milestones ?? []).map((m: Record<string, any>) => ({
      name: String(m.name ?? m.title ?? ''),
      status: String(m.status ?? 'pending') as Order['milestones'][number]['status'],
      due: String(m.due ?? m.due_at ?? ''),
      weightPercent: num(m.weight_percent ?? m.weight),
    })),
    slips: row.slips ?? [],
    gatePasses: row.gate_passes ?? [],
    invoices: row.invoices ?? [],
  }));
}

export async function loadDashboardData() {
  const [events, vendors, orders, reports] = await Promise.all([
    loadEvents(),
    loadVendors(),
    loadOrders(),
    api.getDashboardReports().catch(() => ({ data: {} })),
  ]);
  return { events, vendors, orders, reports: reports?.data ?? reports ?? {} };
}
