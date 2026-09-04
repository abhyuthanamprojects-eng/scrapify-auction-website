import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  DollarSign,
  Search,
  RefreshCw,
} from "lucide-react";
import { Card, PageHead, Pill, Table } from "@/components/console/shell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/portal/team" as any)({
  head: () => ({
    meta: [
      { title: "Team & Authorized Bidders — Scrapify Vendor Portal" },
      { name: "description", content: "Delegate bidding authorization, event access, and limits to team members." },
    ],
  }),
  component: VendorTeamPage,
});

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  role_label?: string;
  status: "active" | "inactive" | "suspended";
  created_at?: string;
  max_bidding_limit?: number;
}

function VendorTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("buyer");
  const [limit, setLimit] = useState("5000000");

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await api.getTeamMembers();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setMembers(list);
    } catch (err) {
      console.warn("Could not load team members:", err);
      // Fallback sample data if empty
      setMembers([
        {
          id: "TM-001",
          name: "Amit Sinha (Primary)",
          email: "amit@devzign.io",
          phone: "+91 98765 43210",
          role: "admin",
          role_label: "Administrator",
          status: "active",
          created_at: "2026-08-01",
          max_bidding_limit: 50000000,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await api.addTeamMember({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        mobile: phone.trim() || null,
        role: role,
        password: "password123",
        status: "active",
        max_bidding_limit_inr: parseFloat(limit) || 5000000,
      });

      const newMember: TeamMember = res?.data || {
        id: res?.id || `TM-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: role,
        role_label: role === "buyer" ? "Authorized Bidder" : role === "finance_manager" ? "Viewer / Observer" : "Administrator",
        status: "active",
        created_at: new Date().toISOString().split("T")[0],
      };

      setMembers((prev) => [newMember, ...prev]);
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setRole("buyer");
      setLimit("5000000");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add team member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    const newStatus = member.status === "active" ? "inactive" : "active";
    try {
      await api.updateTeamMember(member.id, {
        is_active: newStatus === "active",
        status: newStatus,
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m))
      );
    } catch (err) {
      console.warn("Failed to toggle status:", err);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHead
        title="Team & Authorized Bidders"
        description="Manage corporate team members, delegate bidding authority, and enforce maximum limit controls."
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--navy)] px-4 py-2.5 text-xs font-bold text-white shadow hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" /> Add Corporate Bidder
          </button>
        }
      />

      {/* Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Total Authorized Members</p>
          <p className="mt-1 text-2xl font-extrabold text-[color:var(--navy)]">{members.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Active Bidding Tokens</p>
          <p className="mt-1 text-2xl font-extrabold text-[color:var(--success)]">
            {members.filter((m) => m.status === "active").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Enterprise Bid Limit Aggregate</p>
          <p className="mt-1 text-2xl font-extrabold text-[color:var(--auction)]">₹5.00 Cr</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by member name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[color:var(--navy)]"
            />
          </div>
          <button
            onClick={loadMembers}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh List
          </button>
        </div>
      </Card>

      {/* Members Table */}
      <Card className="overflow-hidden">
        <Table>
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs font-bold text-muted-foreground">
              <th className="px-4 py-3">Member Details</th>
              <th className="px-4 py-3">Role & Permissions</th>
              <th className="px-4 py-3">Max Bid Limit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {loading ? "Loading team members..." : "No team members found. Click 'Add Corporate Bidder' to invite a colleague."}
                </td>
              </tr>
            ) : (
              filteredMembers.map((m) => {
                const isActive = m.status === "active";
                return (
                  <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--navy)]/10 font-bold text-[color:var(--navy)]">
                          {m.name ? m.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="font-bold text-[color:var(--navy)]">{m.name}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {m.email}
                            {m.phone && (
                              <span className="ml-1 flex items-center gap-1">
                                • <Phone className="h-3 w-3" /> {m.phone}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-[color:var(--navy)]">
                        <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--auction)]" />
                        {m.role_label || (m.role === "buyer" ? "Authorized Bidder" : m.role === "finance_manager" ? "Viewer / Observer" : "Administrator")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-[color:var(--navy)]">
                      ₹50,00,000
                    </td>
                    <td className="px-4 py-3.5">
                      <Pill variant={isActive ? "success" : "muted"}>
                        {isActive ? "Active / Authorized" : "Suspended"}
                      </Pill>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(m)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                          isActive
                            ? "border border-red-200 text-red-600 hover:bg-red-50"
                            : "border border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {isActive ? "Revoke Access" : "Grant Access"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Corporate Bidder</DialogTitle>
            <DialogDescription>
              Delegate bidding access and spend limits to an authorized representative of your firm.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAddMember} className="space-y-3.5 py-2">
            <div>
              <label className="block text-xs font-bold text-[color:var(--navy)] mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[color:var(--navy)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[color:var(--navy)] mb-1">Corporate Email *</label>
              <input
                type="email"
                required
                placeholder="e.g. rahul.s@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[color:var(--navy)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[color:var(--navy)] mb-1">Mobile Number</label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[color:var(--navy)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[color:var(--navy)] mb-1">Role Permission</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[color:var(--navy)]"
              >
                <option value="buyer">Authorized Bidder (Live Auction Participation)</option>
                <option value="seller">Administrator (Full Access)</option>
                <option value="finance_manager">Viewer / Observer (Read-Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[color:var(--navy)] mb-1">Max Bidding Limit (₹)</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[color:var(--navy)]"
              />
            </div>

            <DialogFooter className="pt-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--navy)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Authorized Member"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
