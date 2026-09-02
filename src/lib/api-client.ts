// Scrapify Auctions Web Unified API Client
// Interfaces directly with Laravel REST API (/api/v1). Production data must
// never silently fall back to demo records when the API is unavailable.

const runtimeApiUrl =
  typeof window !== "undefined"
    ? (window as Window & { ENV_API_URL?: string }).ENV_API_URL
    : undefined;
const API_BASE_URL = (
  runtimeApiUrl ||
  import.meta.env.VITE_API_URL ||
  "https://api.scrapifyauctions.com/api/v1"
).replace(/\/$/, "");

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

export function getAnonymousKey(): string {
  if (typeof window === "undefined") return "";
  const storageKey = "scrapify.anonymous-key";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const value = window.crypto.randomUUID();
  window.localStorage.setItem(storageKey, value);
  return value;
}

class ScrapifyApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("scrapify_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("scrapify_token", token);
      } else {
        localStorage.removeItem("scrapify_token");
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
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
    const res = await this.request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async register(data: any) {
    const res = await this.request<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async requestOtp(identifier: string, purpose = "register") {
    return this.request<any>("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ identifier, purpose }),
    });
  }

  async verifyOtp(identifier: string, code: string) {
    const response = await this.request<any>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ identifier, code }),
    });
    if (response.token) this.setToken(response.token);
    return response;
  }

  async me() {
    return this.request<any>("/auth/me");
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      this.setToken(null);
    }
  }

  /* ---------------- Vendor Documents & OCR ---------------- */
  async uploadVendorDocument(vendorCode: string, docKey: string, kind: string, file: File) {
    const formData = new FormData();
    formData.append("doc_key", docKey);
    formData.append("kind", kind);
    formData.append("file", file);

    const url = `${API_BASE_URL}/vendors/${vendorCode}/documents`;
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Document upload failed");
    return json;
  }

  async registerVendor(data: Record<string, unknown>) {
    return this.request<any>("/vendors/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async submitVendorPayment(vendorCode: string, data: { method: string; reference: string }) {
    return this.request<any>(`/vendors/${vendorCode}/registration-payment`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /* ---------------- Categories & Dynamic Attributes ---------------- */
  async getCategories() {
    return this.request<any>("/categories");
  }

  async getPlatformConfig() {
    return this.request<{ vendor_registration_fee: number; currency: string }>("/platform-config");
  }

  /* ---------------- Auctions & Lots ---------------- */
  async getAuctions(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/auctions${query ? `?${query}` : ""}`);
  }

  async getAuction(code: string) {
    return this.request<any>(`/auctions/${code}`);
  }

  async getAuctionLots(code: string) {
    return this.request<any>(`/auctions/${code}/lots`);
  }

  async getAuctionBids(code: string) {
    return this.request<any>(`/auctions/${code}/bids`);
  }

  async markInterested(code: string, anonKey?: string) {
    return this.request<any>(`/auctions/${code}/interested`, {
      method: "POST",
      body: JSON.stringify(anonKey ? { anon_key: anonKey } : {}),
    });
  }

  async unmarkInterested(code: string, anonKey?: string) {
    const query = anonKey ? `?anon_key=${encodeURIComponent(anonKey)}` : "";
    return this.request<any>(`/auctions/${code}/interested${query}`, {
      method: "DELETE",
    });
  }

  async createAuction(data: any) {
    return this.request<any>("/auctions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAuction(code: string, data: any) {
    return this.request<any>(`/auctions/${code}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async publishAuction(code: string) {
    return this.request<any>(`/auctions/${code}/publish`, {
      method: "POST",
    });
  }

  /* ---------------- Live Bidding ---------------- */
  async getLiveState(code: string) {
    return this.request<any>(`/auctions/${code}/live-state`);
  }

  async placeBid(code: string, data: { amount: number; lot?: string }) {
    return this.request<any>(`/auctions/${code}/bids`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async setProxyBid(code: string, data: { max_amount: number; lot?: string }) {
    return this.request<any>(`/auctions/${code}/proxy-bid`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /* ---------------- RFx Packages ---------------- */
  async getRfx(code: string) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/rfx`);
  }

  async submitRfxResponse(code: string, packageId: number, answers: any) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/rfx/${packageId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  }

  /* ---------------- Site Inspections & Gate Passes ---------------- */
  async getInspections(code: string) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/inspections`);
  }

  async bookInspection(code: string, data: any) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/inspections`, {
      method: "POST",
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

  async askClarification(
    code: string,
    data: { question: string; section?: string; is_public?: boolean },
  ) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/clarifications`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async acknowledgeAddendum(code: string, addendumId: number) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/addenda/${addendumId}/acknowledge`, {
      method: "POST",
    });
  }

  async acceptAuctionTerms(code: string) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/terms/accept`, { method: "POST" });
  }

  /* ---------------- Approvals & Governance ---------------- */
  async getApprovals(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse<any>>(`/approvals${query ? `?${query}` : ""}`);
  }

  async decideApproval(
    id: number,
    decision: "approved" | "rejected" | "escalated",
    comments?: string,
  ) {
    return this.request<ApiResponse<any>>(`/approvals/${id}/decide`, {
      method: "POST",
      body: JSON.stringify({ decision, comments }),
    });
  }

  /* ---------------- Awards & Fallback ---------------- */
  async getAwards(code: string) {
    return this.request<ApiResponse<any>>(`/auctions/${code}/awards`);
  }

  async acceptAward(id: number) {
    return this.request<ApiResponse<any>>(`/awards/${id}/accept`, {
      method: "POST",
    });
  }

  /* ---------------- Orders & Fulfilment ---------------- */
  async getOrders(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/orders${query ? `?${query}` : ""}`);
  }

  async getVendors(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/vendors${query ? `?${query}` : ""}`);
  }

  async inviteVendor(data: { email: string; company_name?: string; auction_code?: string }) {
    return this.request<ApiResponse<any>>("/vendors/invitations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getOrganizations(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/organizations${query ? `?${query}` : ""}`);
  }

  async getWallet() {
    return this.request<any>("/wallet");
  }

  async getWalletTransactions(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/wallet/transactions${query ? `?${query}` : ""}`);
  }

  async getEmd(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/emd${query ? `?${query}` : ""}`);
  }

  async getNotifications(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/notifications${query ? `?${query}` : ""}`);
  }

  async validateToken(token: string) {
    return this.request<any>(`/tokens/validate/${encodeURIComponent(token)}`);
  }

  async getMyBids() {
    return this.request<any>("/my-bids");
  }

  async getOrder(code: string) {
    return this.request<any>(`/orders/${code}`);
  }

  async payOrder(code: string, data: any) {
    return this.request<any>(`/orders/${code}/pay`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async schedulePickup(code: string, data: any) {
    return this.request<ApiResponse<any>>(`/orders/${code}/pickup`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAdminFinanceSummary() {
    return this.request<any>("/admin/finance/summary");
  }

  async getAdminFulfilments(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/admin/fulfilments${query ? `?${query}` : ""}`);
  }

  async getAdminOrganisationUsers(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/admin/organisation/users${query ? `?${query}` : ""}`);
  }

  async createAdminOrganisationUser(data: any) {
    return this.request<ApiResponse<any>>("/admin/organisation/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAdminOrganisationUser(id: number, data: any) {
    return this.request<ApiResponse<any>>(`/admin/organisation/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /* ---------------- Disputes ---------------- */
  async getDisputes(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse<any>>(`/disputes${query ? `?${query}` : ""}`);
  }

  async getDispute(code: string) {
    return this.request<ApiResponse<any>>(`/disputes/${code}`);
  }

  async raiseDispute(data: any) {
    return this.request<ApiResponse<any>>("/disputes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async addDisputeMessage(code: string, message: string) {
    return this.request<ApiResponse<any>>(`/disputes/${code}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  /* ---------------- Reports & Audit ---------------- */
  async getDashboardReports() {
    return this.request<any>("/reports/dashboard");
  }

  async getAdminReportSummary(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/admin/reports/summary${query ? `?${query}` : ""}`);
  }

  async getAuditLogs(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/audit-logs${query ? `?${query}` : ""}`);
  }
}

export const api = new ScrapifyApiClient();
