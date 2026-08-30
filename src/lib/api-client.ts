// Scrapify Auctions Web Unified API Client
// Interfaces directly with Laravel REST API (/api/v1) with resilient offline fallback

const API_BASE_URL = typeof window !== 'undefined' && (window as any).ENV_API_URL 
  ? (window as any).ENV_API_URL 
  : 'http://localhost:8000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
  };
  error?: {
    code: string;
    details?: any;
  };
}

class ScrapifyApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('scrapify_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('scrapify_token', token);
      } else {
        localStorage.removeItem('scrapify_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || `API Error: ${res.status}`);
      }
      return json;
    } catch (err) {
      console.warn(`[ScrapifyApiClient] Network request failed for ${endpoint}:`, err);
      throw err;
    }
  }

  /* ---------------- Auth ---------------- */
  async login(identifier: string, password: string) {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async register(data: any) {
    const res = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async me() {
    return this.request<any>('/auth/me');
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  /* ---------------- Vendor Documents & OCR ---------------- */
  async uploadVendorDocument(vendorCode: string, docKey: string, kind: string, file: File) {
    const formData = new FormData();
    formData.append('doc_key', docKey);
    formData.append('kind', kind);
    formData.append('file', file);

    const url = `${API_BASE_URL}/vendors/${vendorCode}/documents`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Document upload failed');
    return json;
  }

  /* ---------------- Categories & Dynamic Attributes ---------------- */
  async getCategories() {
    return this.request<any>('/categories');
  }

  /* ---------------- Auctions & Lots ---------------- */
  async getAuctions(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/auctions${query ? `?${query}` : ''}`);
  }

  async getAuction(code: string) {
    return this.request<any>(`/auctions/${code}`);
  }

  async getAuctionLots(code: string) {
    return this.request<any>(`/auctions/${code}/lots`);
  }

  async createAuction(data: any) {
    return this.request<any>('/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAuction(code: string, data: any) {
    return this.request<any>(`/auctions/${code}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async publishAuction(code: string) {
    return this.request<any>(`/auctions/${code}/publish`, {
      method: 'POST',
    });
  }

  /* ---------------- Live Bidding ---------------- */
  async getLiveState(code: string) {
    return this.request<any>(`/auctions/${code}/live-state`);
  }

  async placeBid(code: string, data: { amount: number; lot_id?: number; is_proxy?: boolean }) {
    return this.request<any>(`/auctions/${code}/bids`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async setProxyBid(code: string, data: { max_amount: number; lot_id?: number }) {
    return this.request<any>(`/auctions/${code}/proxy-bid`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /* ---------------- RFx Packages ---------------- */
  async getRfx(code: string) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/rfx`);
  }

  async submitRfxResponse(code: string, packageId: number, answers: any) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/rfx/${packageId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  /* ---------------- Site Inspections & Gate Passes ---------------- */
  async getInspections(code: string) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/inspections`);
  }

  async bookInspection(code: string, data: any) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/inspections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyGatePass(qrToken: string) {
    return this.request<ApiResponse<any>>(`/gate-passes/verify/${qrToken}`);
  }

  /* ---------------- Clarifications & Addenda ---------------- */
  async getClarifications(code: string) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/clarifications`);
  }

  async askClarification(code: string, data: { question: string; section?: string; is_public?: boolean }) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/clarifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acknowledgeAddendum(code: string, addendumId: number) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/addenda/${addendumId}/acknowledge`, {
      method: 'POST',
    });
  }

  /* ---------------- Approvals & Governance ---------------- */
  async getApprovals(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse<any>>(`/approvals${query ? `?${query}` : ''}`);
  }

  async decideApproval(id: number, decision: 'approved' | 'rejected' | 'escalated', comments?: string) {
    return this.request<ApiResponse<any>>(`/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, comments }),
    });
  }

  /* ---------------- Awards & Fallback ---------------- */
  async getAwards(code: string) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/awards`);
  }

  async acceptAward(id: number) {
    return this.request<ApiResponse<any>>(`/awards/${id}/accept`, {
      method: 'POST',
    });
  }

  /* ---------------- Orders & Fulfilment ---------------- */
  async getOrders(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(code: string) {
    return this.request<any>(`/orders/${code}`);
  }

  async payOrder(code: string, data: any) {
    return this.request<any>(`/orders/${code}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /* ---------------- Disputes ---------------- */
  async getDisputes(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse<any>>(`/disputes${query ? `?${query}` : ''}`);
  }

  async getDispute(code: string) {
    return this.request<ApiResponse<any>>(`/disputes/${code}`);
  }

  async raiseDispute(data: any) {
    return this.request<ApiResponse<any>>('/disputes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addDisputeMessage(code: string, message: string) {
    return this.request<ApiResponse<any>>(`/disputes/${code}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  /* ---------------- Reports & Audit ---------------- */
  async getDashboardReports() {
    return this.request<any>('/reports/dashboard');
  }

  async getAuditLogs(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/audit-logs${query ? `?${query}` : ''}`);
  }
}

export const api = new ScrapifyApiClient();
