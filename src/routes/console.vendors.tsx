import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CATEGORIES, type Vendor } from "@/lib/enterprise";
import { loadVendors } from "@/lib/enterprise-api";
import { Card, Kpi, PageHead, Pill, Table } from "@/components/console/shell";
import { Plus, Search, ShieldCheck, UserCheck, X, Eye, ShieldAlert, Award } from "lucide-react";

export const Route = createFileRoute("/console/vendors")({
  loader: () => loadVendors(),
  head: () => ({
    meta: [
      { title: "Vendor Directory & Scorecards — Scrapify Auctions" },
      {
        name: "description",
        content:
          "Maintain the master vendor registry with category qualifications, trust scores, compliance validity and suspension controls.",
      },
      { property: "og:title", content: "Vendor Directory | Scrapify Auctions" },
      {
        property: "og:description",
        content: "Qualification, performance and compliance across every sourcing category.",
      },
    ],
  }),
  component: VendorsPage,
});

function VendorsPage() {
  const initialVendors = Route.useLoaderData();
  const [vendorsList, setVendorsList] = useState<Vendor[]>(initialVendors);
  const [cat, setCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorCat, setNewVendorCat] = useState<string>(CATEGORIES[0]);
  const [newVendorCity, setNewVendorCity] = useState("Mumbai");

  const rows = vendorsList.filter((v) => {
    const matchesCat = cat === "all" || v.categories.includes(cat);
    const matchesSearch =
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleSuspend = (id: string) => {
    setVendorsList((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, status: v.status === "suspended" ? "active" : "suspended" } : v,
      ),
    );
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;
    const newEntry: Vendor = {
      id: `V-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newVendorName,
      categories: [newVendorCat],
      city: newVendorCity,
      status: "onboarding",
      score: 85,
      events: 0,
      winRate: 0,
      compliance: "valid",
    };
    setVendorsList([newEntry, ...vendorsList]);
    setInviteModalOpen(false);
    setNewVendorName("");
    setNewVendorEmail("");
  };

  return (
    <>
      <PageHead
        title="Enterprise Vendor Directory"
        subtitle="Manage verified supplier base, KYB certificates, category qualifications, and performance scorecards."
        actions={
          <button
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--auction)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Invite Vendor
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total Registered Vendors" value={String(vendorsList.length)} hint="Across 18 sectors" />
        <Kpi label="Active & Qualified" value={String(vendorsList.filter((v) => v.status === "active").length)} delta="Verified" hint="Eligible to bid" />
        <Kpi label="Under KYB Onboarding" value={String(vendorsList.filter((v) => v.status === "onboarding").length)} hint="Document audit in progress" />
        <Kpi
          label="Compliance Attention"
          value={String(vendorsList.filter((v) => v.compliance !== "valid").length)}
          hint="Expiring certificates"
        />
      </div>

      {/* Category Filter & Search */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCat("all")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
              cat === "all" ? "bg-[color:var(--navy)] text-white" : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.slice(0, 6).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                cat === c ? "bg-[color:var(--navy)] text-white" : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground w-64">
          <Search className="h-3.5 w-3.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor, ID, city..."
            className="w-full bg-transparent focus:outline-none text-foreground"
          />
        </div>
      </div>

      <Card title={`Verified Vendors (${rows.length})`} className="mt-4">
        <Table head={["Vendor Name & ID", "Operating Categories", "Technical Score", "Events Bidded", "Win Rate", "Compliance", "Status", "Actions"]}>
          {rows.map((v) => (
            <tr key={v.id} className="hover:bg-muted/20">
              <td className="py-3 pr-4">
                <span className="font-bold text-foreground">{v.name}</span>
                <div className="text-xs text-muted-foreground">
                  {v.id} · {v.city}
                </div>
              </td>
              <td className="py-3 pr-4 text-xs text-muted-foreground">{v.categories.join(", ")}</td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-[color:var(--accent-blue)]"
                      style={{ width: `${v.score}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-xs">{v.score}%</span>
                </div>
              </td>
              <td className="py-3 pr-4 font-semibold">{v.events}</td>
              <td className="py-3 pr-4 font-mono font-semibold">{Math.round(v.winRate * 100)}%</td>
              <td className="py-3 pr-4">
                <Pill tone={v.compliance === "valid" ? "good" : v.compliance === "expiring" ? "warn" : "bad"}>
                  {v.compliance.toUpperCase()}
                </Pill>
              </td>
              <td className="py-3 pr-4">
                <Pill tone={v.status === "active" ? "good" : v.status === "onboarding" ? "warn" : "bad"}>
                  {v.status.toUpperCase()}
                </Pill>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedVendor(v)}
                    className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                  >
                    <Eye className="h-3 w-3" /> Scorecard
                  </button>
                  <button
                    onClick={() => toggleSuspend(v.id)}
                    className={`rounded px-2.5 py-1 text-xs font-semibold ${
                      v.status === "suspended" ? "bg-[color:var(--success)] text-white" : "border border-destructive/40 text-destructive hover:bg-destructive/10"
                    }`}
                  >
                    {v.status === "suspended" ? "Reinstate" : "Suspend"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* Vendor Profile Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="rounded bg-[color:var(--navy)]/10 px-2 py-0.5 text-xs font-bold text-[color:var(--navy)]">
                  {selectedVendor.id}
                </span>
                <h3 className="mt-1 font-display text-xl font-bold">{selectedVendor.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedVendor.city} • Tier 1 Verified Enterprise</p>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 grid gap-3 sm:grid-cols-3 bg-muted/30 p-4 rounded-xl text-xs">
              <div>
                <span className="text-muted-foreground font-semibold">Technical Score</span>
                <p className="font-display text-lg font-bold text-[color:var(--navy)]">{selectedVendor.score} / 100</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Events Participated</span>
                <p className="font-display text-lg font-bold text-foreground">{selectedVendor.events} Events</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Win Rate %</span>
                <p className="font-display text-lg font-bold text-[color:var(--success)]">{Math.round(selectedVendor.winRate * 100)}%</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-foreground">Verified Operating Categories:</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {selectedVendor.categories.map((c) => (
                    <span key={c} className="rounded bg-muted px-2.5 py-1 text-xs font-semibold">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-bold text-foreground">Compliance Verification:</span>
                <div className="mt-1 flex items-center gap-2">
                  <Pill tone="good">GST Verified</Pill>
                  <Pill tone="good">PAN / KYB Passed</Pill>
                  <Pill tone={selectedVendor.compliance === "valid" ? "good" : "warn"}>
                    Consent Expiry: {selectedVendor.compliance === "valid" ? "Active (2028)" : "Renewing Soon"}
                  </Pill>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
              <button
                onClick={() => setSelectedVendor(null)}
                className="rounded-full bg-[color:var(--navy)] px-5 py-2 text-xs font-semibold text-white"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Vendor Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleInviteSubmit} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display text-base font-bold">Invite Enterprise Vendor</h3>
              <button type="button" onClick={() => setInviteModalOpen(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="my-4 text-xs space-y-3">
              <div>
                <label className="font-semibold text-muted-foreground">Company / Entity Name *</label>
                <input
                  required
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="e.g. Apex Industrial Solutions"
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground">Authorized Contact Email *</label>
                <input
                  required
                  type="email"
                  value={newVendorEmail}
                  onChange={(e) => setNewVendorEmail(e.target.value)}
                  placeholder="procurement@apex.example"
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground">Primary Sector</label>
                  <select
                    value={newVendorCat}
                    onChange={(e) => setNewVendorCat(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">City / Hub</label>
                  <input
                    value={newVendorCity}
                    onChange={(e) => setNewVendorCity(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[color:var(--auction)] px-5 py-1.5 text-xs font-semibold text-white hover:brightness-110"
              >
                Send Invitation Token
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
