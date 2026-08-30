import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ORG_USERS, CATEGORIES, fmtDate, type OrgUser } from "@/lib/enterprise";
import { Card, PageHead, Pill, Table } from "@/components/console/shell";
import { Plus, ShieldCheck, UserPlus, X, Settings2, Key, Users } from "lucide-react";

export const Route = createFileRoute("/console/organisation")({
  head: () => ({
    meta: [
      { title: "Organisation, Roles & Security — Scrapify Auctions" },
      {
        name: "description",
        content:
          "Manage business units, user roles, permissions, MFA enforcement, notification matrix and category templates.",
      },
      { property: "og:title", content: "Organisation & Governance | Scrapify Auctions" },
      {
        property: "og:description",
        content: "Roles, permissions, security posture and notification governance in one place.",
      },
    ],
  }),
  component: OrganisationPage,
});

const NOTIFICATIONS = [
  ["Event published", "Invited vendors", "Email + in-app"],
  ["Bid received", "Event owner", "In-app real-time"],
  ["Outbid / rank changed", "Participant", "Email + SMS + push"],
  ["Auto-extension applied", "All participants", "In-app + push notice"],
  ["Event closed", "Owner, approvers", "Email + in-app"],
  ["Approval requested", "Approver in queue", "Email + in-app"],
  ["Award issued", "Winner, finance", "Email + in-app"],
  ["Payment due / overdue", "Winner, finance", "Email + SMS alert"],
  ["EMD forfeited", "Vendor, finance, compliance", "Signed official notice"],
  ["Dispute raised", "Owner, compliance", "Priority arbitration queue"],
];

function OrganisationPage() {
  const [users, setUsers] = useState<OrgUser[]>(ORG_USERS);
  const [categories, setCategories] = useState<string[]>([...CATEGORIES]);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addCatOpen, setAddCatOpen] = useState(false);

  // New User Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgUser["role"]>("Event owner");
  const [bu, setBu] = useState("Corporate Disposals");

  // New Category Form State
  const [newCatName, setNewCatName] = useState("");

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const newUser: OrgUser = {
      name,
      email,
      role,
      bu,
      mfa: true,
      lastActive: Date.now(),
    };
    setUsers([...users, newUser]);
    setAddUserOpen(false);
    setName("");
    setEmail("");
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || categories.includes(newCatName.trim())) return;
    setCategories([...categories, newCatName.trim()]);
    setAddCatOpen(false);
    setNewCatName("");
  };

  return (
    <>
      <PageHead
        title="Organisation Governance & Security Controls"
        subtitle="Manage user roles, multi-tier approval permissions, MFA security posture, notification matrix, and dynamic category schemas."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setAddCatOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              <Plus className="h-4 w-4" /> Add Category Schema
            </button>
            <button
              onClick={() => setAddUserOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--auction)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            >
              <UserPlus className="h-4 w-4" /> Add User
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={`Enterprise Users & RBAC Roles (${users.length})`} className="lg:col-span-2">
          <Table head={["User Name & Email", "Assigned Role", "Business Unit", "MFA Posture", "Last Active"]}>
            {users.map((u) => (
              <tr key={u.email} className="hover:bg-muted/20">
                <td className="py-3 pr-4">
                  <span className="font-bold text-foreground">{u.name}</span>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="py-3 pr-4">
                  <span className="rounded bg-[color:var(--navy)]/10 px-2 py-0.5 text-xs font-bold text-[color:var(--navy)]">
                    {u.role}
                  </span>
                </td>
                <td className="py-3 pr-4 text-xs font-semibold text-foreground">{u.bu}</td>
                <td className="py-3 pr-4">
                  <Pill tone={u.mfa ? "good" : "bad"}>{u.mfa ? "MFA Active" : "Not Enrolled"}</Pill>
                </td>
                <td className="py-3 text-xs text-muted-foreground">{fmtDate(u.lastActive)}</td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="Security & Compliance Posture">
          <ul className="space-y-3.5 text-sm">
            {[
              ["MFA Enforcement", "Mandatory for Approvers & Admins", "good"],
              ["Session Inactivity Timeout", "20 minutes idle lockout", "good"],
              ["Cryptographic Signatures", "SHA-256 chained bid log", "good"],
              ["Sealed Envelope Control", "Dual custody private keys", "good"],
              ["IP Allow-Listing", "Enterprise VPN Gateway Active", "good"],
              ["Audit Readiness", "SOC2 & ISO 27001 Certified", "good"],
            ].map(([k, v, tone]) => (
              <li key={k} className="flex items-start justify-between gap-3 bg-muted/30 p-2.5 rounded-lg border border-border">
                <div>
                  <p className="font-bold text-xs text-foreground">{k}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{v}</p>
                </div>
                <Pill tone={tone as "good" | "warn"}>VERIFIED</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Notification & Webhook Matrix" desc="System trigger → Recipient → Broadcast channels">
          <Table head={["Event Trigger", "Recipient Group", "Notification Channels"]}>
            {NOTIFICATIONS.map((n) => (
              <tr key={n[0]}>
                <td className="py-3 pr-4 font-bold text-foreground text-xs">{n[0]}</td>
                <td className="py-3 pr-4 text-xs text-muted-foreground">{n[1]}</td>
                <td className="py-3 text-xs font-semibold text-[color:var(--navy)]">{n[2]}</td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title={`Sector & Category Schemas (${categories.length})`} desc="Dynamic attribute schemas configure lot inputs on the fly">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold shadow-xs">
                {c}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg">
            Scrapify dynamic categories define sector-specific attribute inputs (e.g. Moisture %, Ferrous grade, Running hours, Vehicle RC, CPCB compliance) automatically without code changes.
          </p>
        </Card>
      </div>

      {/* Add User Modal */}
      {addUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleAddUser} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display text-base font-bold">Add Enterprise User</h3>
              <button type="button" onClick={() => setAddUserOpen(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="my-4 text-xs space-y-3">
              <div>
                <label className="font-semibold text-muted-foreground">Full Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. S. Sen"
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground">Corporate Email Address *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="s.sen@scrapify.example"
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground">Assigned Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                  >
                    <option value="Event owner">Event owner</option>
                    <option value="Approver">Approver</option>
                    <option value="Finance">Finance</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Auditor">Auditor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Business Unit</label>
                  <input
                    value={bu}
                    onChange={(e) => setBu(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setAddUserOpen(false)}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[color:var(--auction)] px-5 py-1.5 text-xs font-semibold text-white hover:brightness-110"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Category Modal */}
      {addCatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleAddCategory} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display text-base font-bold">Add Category Schema</h3>
              <button type="button" onClick={() => setAddCatOpen(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="my-4 text-xs space-y-3">
              <div>
                <label className="font-semibold text-muted-foreground">Category Name *</label>
                <input
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Chemicals & Polymers, Aircraft Parts, Marine Cargo..."
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setAddCatOpen(false)}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[color:var(--navy)] px-5 py-1.5 text-xs font-semibold text-white hover:brightness-110"
              >
                Add Schema
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
