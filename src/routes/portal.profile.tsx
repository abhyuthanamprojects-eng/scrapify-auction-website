import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  Clock,
  Edit2,
  Save,
  X,
  CreditCard,
  Warehouse,
  Globe,
} from "lucide-react";
import { Card, PageHead, Pill } from "@/components/console/shell";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/portal/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Scrapify Vendor Portal" },
      { name: "description", content: "View and manage your profile, company details, and verification status." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const vendor = user?.vendor;
  const org = user?.organization;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    api.getAddresses().then((res) => {
      setAddresses(res?.data || (Array.isArray(res) ? res : []));
    }).catch(() => {}).finally(() => setLoadingAddresses(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await api.updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      setSuccessMsg("Profile updated successfully.");
      setEditing(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const isVerified = vendor?.status === "approved";
  const kybStatus = user?.kyb_status || vendor?.status || "pending";

  return (
    <div className="space-y-6">
      <PageHead
        title="My Profile"
        subtitle="View your account details, company information, and verification status."
        actions={
          !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--navy)] px-4 py-2.5 text-xs font-bold text-white shadow hover:opacity-90"
            >
              <Edit2 className="h-4 w-4" /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(false); setName(user?.name || ""); setEmail(user?.email || ""); setPhone(user?.phone || ""); setErrorMsg(""); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--navy)] px-4 py-2.5 text-xs font-bold text-white shadow hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )
        }
      />

      {successMsg && (
        <div className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{errorMsg}</div>
      )}

      {/* Verification Banner */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-full ${isVerified ? "bg-emerald-100" : "bg-amber-100"}`}>
            <ShieldCheck className={`h-5 w-5 ${isVerified ? "text-emerald-600" : "text-amber-600"}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-[color:var(--navy)]">
              {isVerified ? "Verified Vendor" : "Verification Pending"}
            </p>
            <p className="text-xs text-muted-foreground">
              KYB Status: <Pill tone={isVerified ? "good" : "warn"}>{kybStatus}</Pill>
              {user?.kyc_verified && <span className="ml-2">KYC: <Pill tone="good">Verified</Pill></span>}
            </p>
          </div>
          {vendor?.code && (
            <span className="ml-auto rounded-lg bg-muted px-3 py-1.5 text-xs font-mono font-bold text-[color:var(--navy)]">
              {vendor.code}
            </span>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card className="overflow-hidden">
          <div className="border-b border-border/70 bg-muted/30 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[color:var(--navy)]">
              <User className="h-4 w-4 text-[color:var(--auction)]" /> Personal Information
            </h3>
          </div>
          <div className="space-y-4 p-5">
            <Field icon={<User className="h-4 w-4" />} label="Full Name" editing={editing} value={name} onChange={setName} display={user?.name} />
            <Field icon={<Mail className="h-4 w-4" />} label="Email" editing={editing} value={email} onChange={setEmail} display={user?.email} type="email" />
            <Field icon={<Phone className="h-4 w-4" />} label="Phone" editing={editing} value={phone} onChange={setPhone} display={user?.phone} type="tel" />
            <InfoRow icon={<ShieldCheck className="h-4 w-4" />} label="Role" value={user?.role || "—"} />
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Member Since" value={user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
          </div>
        </Card>

        {/* Company Information */}
        <Card className="overflow-hidden">
          <div className="border-b border-border/70 bg-muted/30 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[color:var(--navy)]">
              <Building2 className="h-4 w-4 text-[color:var(--auction)]" /> Company Details
            </h3>
          </div>
          <div className="space-y-4 p-5">
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Company Name" value={vendor?.company_name || org?.name || "—"} />
            <InfoRow icon={<User className="h-4 w-4" />} label="Contact Person" value={vendor?.contact_name || "—"} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Business Email" value={vendor?.email || "—"} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Business Phone" value={vendor?.phone || "—"} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location" value={vendor?.location || "—"} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={vendor?.address || "—"} />
          </div>
        </Card>

        {/* Tax & Legal */}
        <Card className="overflow-hidden">
          <div className="border-b border-border/70 bg-muted/30 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[color:var(--navy)]">
              <FileText className="h-4 w-4 text-[color:var(--auction)]" /> Tax & Legal
            </h3>
          </div>
          <div className="space-y-4 p-5">
            <InfoRow icon={<FileText className="h-4 w-4" />} label="GST Number" value={vendor?.gst_number || "—"} />
            <InfoRow icon={<CreditCard className="h-4 w-4" />} label="PAN Number" value={vendor?.pan_number || "—"} />
            <InfoRow icon={<FileText className="h-4 w-4" />} label="License Number" value={vendor?.license_number || "—"} />
          </div>
        </Card>

        {/* Operations */}
        <Card className="overflow-hidden">
          <div className="border-b border-border/70 bg-muted/30 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[color:var(--navy)]">
              <Warehouse className="h-4 w-4 text-[color:var(--auction)]" /> Operations
            </h3>
          </div>
          <div className="space-y-4 p-5">
            <InfoRow
              icon={<Globe className="h-4 w-4" />}
              label="Operating States"
              value={
                Array.isArray(vendor?.operating_states) && vendor.operating_states.length > 0
                  ? vendor.operating_states.join(", ")
                  : "—"
              }
            />
            {Array.isArray(vendor?.warehouse_details) && vendor.warehouse_details.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Warehouses</p>
                <div className="space-y-2">
                  {vendor.warehouse_details.map((wh: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border p-3 text-xs">
                      <p className="font-semibold text-[color:var(--navy)]">{wh.name || `Warehouse ${i + 1}`}</p>
                      {wh.address && <p className="text-muted-foreground">{wh.address}</p>}
                      {wh.city && <p className="text-muted-foreground">{wh.city}{wh.state ? `, ${wh.state}` : ""}{wh.pincode ? ` - ${wh.pincode}` : ""}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <InfoRow icon={<Warehouse className="h-4 w-4" />} label="Warehouses" value="No warehouses added" />
            )}
          </div>
        </Card>
      </div>

      {/* Addresses */}
      <Card className="overflow-hidden">
        <div className="border-b border-border/70 bg-muted/30 px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[color:var(--navy)]">
            <MapPin className="h-4 w-4 text-[color:var(--auction)]" /> Saved Addresses
          </h3>
        </div>
        <div className="p-5">
          {loadingAddresses ? (
            <p className="text-xs text-muted-foreground">Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <p className="text-xs text-muted-foreground">No saved addresses.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((addr: any) => (
                <div key={addr.id} className="rounded-lg border border-border p-4 text-xs space-y-1">
                  <p className="font-bold text-[color:var(--navy)]">{addr.label || addr.type || "Address"}</p>
                  <p className="text-muted-foreground">{addr.address_line_1}</p>
                  {addr.address_line_2 && <p className="text-muted-foreground">{addr.address_line_2}</p>}
                  <p className="text-muted-foreground">
                    {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                  </p>
                  {addr.is_default && <Pill tone="good">Default</Pill>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({ icon, label, editing, value, onChange, display, type = "text" }: {
  icon: React.ReactNode; label: string; editing: boolean;
  value: string; onChange: (v: string) => void; display?: string; type?: string;
}) {
  if (!editing) return <InfoRow icon={icon} label={label} value={display || "—"} />;
  return (
    <div className="flex items-start gap-3">
      <span className="mt-2.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="flex-1">
        <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">{label}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[color:var(--navy)]"
        />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase">{label}</p>
        <p className="text-sm font-medium text-[color:var(--navy)]">{value}</p>
      </div>
    </div>
  );
}
