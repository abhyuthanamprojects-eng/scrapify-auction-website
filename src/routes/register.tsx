import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Gavel,
  UploadCloud,
  FileCheck2,
  ShieldCheck,
  CircleDot,
  Pencil,
} from "lucide-react";
import { useRegistration } from "@/hooks/use-registration";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { RegistrationState, WizardStep } from "@/lib/registration-store";
import { clearRegistration, MATERIALS } from "@/lib/registration-store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Enterprise Vendor & Buyer Registration — Scrapify Auctions" },
      {
        name: "description",
        content:
          "Complete guided corporate onboarding: identity verification, GSTIN check, company KYC, bank penny-drop, and compliance activation.",
      },
      { property: "og:title", content: "Enterprise Registration — Scrapify Auctions" },
      {
        property: "og:description",
        content: "Corporate onboarding and KYB verification for Scrapify multi-category auctions.",
      },
    ],
  }),
  component: RegisterWizard,
});

const STEPS: { n: WizardStep; label: string; blurb: string }[] = [
  { n: 1, label: "Verification", blurb: "Mobile & email OTP" },
  { n: 2, label: "Login Details", blurb: "Set your password" },
  { n: 3, label: "Company Information", blurb: "KYC & documents" },
  { n: 4, label: "Complete", blurb: "Review, pay, approval" },
];

function RegisterWizard() {
  const { state, update } = useRegistration();
  const step = state.step;

  // Google sign-up returns here: mark verification + login steps done and
  // continue with the remaining KYC steps.
  useEffect(() => {
    let active = true;
    const initial = state;
    if (initial.step > 2) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      update({
        email: data.user.email || initial.email,
        contactEmail: data.user.email || initial.contactEmail,
        contactName:
          initial.contactName ||
          ((data.user.user_metadata?.full_name as string | undefined) ?? ""),
        otpVerified: true,
        googleLinked: true,
        completed: { ...initial.completed, 1: true, 2: true },
        step: 3,
      });
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const goto = (n: WizardStep) => {
    // Only allow jumping back to a completed step, or the current step.
    if (n === step) return;
    if (n < step && state.completed[n === 1 ? 1 : ((n - 1) as WizardStep)]) {
      update({ step: n });
    } else if (n < step) {
      // Allow going back to any earlier step even if not "completed" flag set
      update({ step: n });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-[color:var(--navy)] text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--auction)]">
              <Gavel className="h-5 w-5" />
            </span>
            Scrapify<span className="text-[color:var(--gold-soft)]">Auction</span>
          </Link>
          <div className="text-xs uppercase tracking-wider text-white/70">
            Step {step} of 4
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Horizontal progress bar for narrow widths */}
        <div className="mb-6 lg:hidden">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-1 items-center gap-2">
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    step > s.n
                      ? "bg-emerald-500 text-white"
                      : step === s.n
                        ? "bg-[color:var(--navy)] text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${step > s.n ? "bg-emerald-500" : "bg-border"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm font-semibold text-foreground">
            {STEPS[step - 1].label}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Left: vertical stepper (desktop) */}
          <aside className="hidden lg:block">
            <div className="card-soft sticky top-6 p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bidder Registration
              </div>
              <ol className="mt-4 space-y-2">
                {STEPS.map((s) => {
                  const isDone = step > s.n;
                  const isCurrent = step === s.n;
                  const clickable = s.n < step;
                  return (
                    <li key={s.n}>
                      <button
                        type="button"
                        disabled={!clickable && !isCurrent}
                        onClick={() => goto(s.n)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                          isCurrent
                            ? "border-[color:var(--navy)] bg-[color:var(--navy)]/5"
                            : isDone
                              ? "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10"
                              : "border-border bg-card opacity-70"
                        } ${clickable ? "cursor-pointer" : ""}`}
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                            isDone
                              ? "bg-emerald-500 text-white"
                              : isCurrent
                                ? "bg-[color:var(--navy)] text-white"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isDone ? <Check className="h-4 w-4" /> : s.n}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-display text-sm font-bold text-foreground">
                            {s.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {s.blurb}
                          </span>
                        </span>
                        {isCurrent && (
                          <CircleDot className="ml-auto h-4 w-4 shrink-0 text-[color:var(--auction)]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                Your progress is saved automatically. You can close this tab and resume
                where you left off.
              </div>
            </div>
          </aside>

          {/* Right: current step form */}
          <div className="mx-auto w-full max-w-[640px] lg:mx-0">
            {step === 1 && <Step1 state={state} update={update} />}
            {step === 2 && <Step2 state={state} update={update} />}
            {step === 3 && <Step3 state={state} update={update} />}
            {step === 4 && <Step4 state={state} update={update} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Step 1: Verification ----------

function Step1({
  state,
  update,
}: {
  state: RegistrationState;
  update: (p: Partial<RegistrationState>) => void;
}) {
  const [mobile, setMobile] = useState(state.mobile);
  const [email, setEmail] = useState(state.email);
  const [otpSent, setOtpSent] = useState(state.otpVerified);
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const validMobile = /^[6-9]\d{9}$/.test(mobile);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const onGoogle = async () => {
    setError(null);
    try {
      update({ mobile });
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/register`,
      });
      if (res.error) throw res.error;
      if (res.redirected) return;
      const { data } = await supabase.auth.getUser();
      update({
        email: data.user?.email ?? email,
        contactEmail: data.user?.email ?? email,
        otpVerified: true,
        googleLinked: true,
        completed: { ...state.completed, 1: true, 2: true },
        step: 3,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-up failed");
    }
  };

  const sendOtp = () => {
    setError(null);
    if (!validMobile) return setError("Enter a valid 10-digit mobile number.");
    if (!validEmail) return setError("Enter a valid email address.");
    update({ mobile, email });
    setOtpSent(true);
    setResendIn(30);
  };

  const verify = () => {
    setError(null);
    // Mock: any 6-digit OTP works; hint value 123456
    if (!/^\d{4,6}$/.test(otp)) return setError("Enter the 4–6 digit code sent to you.");
    update({
      otpVerified: true,
      completed: { ...state.completed, 1: true },
      step: 2,
    });
  };

  return (
    <FormShell
      title="Verify your identity"
      subtitle="We'll send a one-time code to both your mobile number and email."
    >
      <Field
        label="Mobile Number"
        type="tel"
        value={mobile}
        onChange={setMobile}
        placeholder="10-digit mobile"
        disabled={otpSent}
        maxLength={10}
      />
      <Field
        label="Email ID"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@company.com"
        disabled={otpSent}
      />

      {!otpSent ? (
        <>
          {error && <ErrorLine>{error}</ErrorLine>}
          <PrimaryButton onClick={sendOtp} disabled={!validMobile || !validEmail}>
            Send OTP
          </PrimaryButton>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700">
            OTP sent to <b>{mobile}</b> and <b>{email}</b>. Use <b>123456</b> for demo.
          </div>
          <Field
            label="Enter OTP"
            type="text"
            value={otp}
            onChange={setOtp}
            placeholder="6-digit code"
            maxLength={6}
          />
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              className="text-[color:var(--auction)] hover:underline disabled:text-muted-foreground disabled:no-underline"
              disabled={resendIn > 0}
              onClick={() => setResendIn(30)}
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setOtpSent(false)}
            >
              Change mobile / email
            </button>
          </div>
          {error && <ErrorLine>{error}</ErrorLine>}
          <PrimaryButton onClick={verify} disabled={otp.length < 4}>
            Verify & Continue
          </PrimaryButton>
        </>
      )}

      <div className="flex items-center gap-3 pt-1 text-xs uppercase tracking-wider text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={onGoogle}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <GoogleMark />
        Register with Google
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Google verifies your email and password for you — you'll continue with
        Company Information &amp; KYC.
      </p>
    </FormShell>
  );
}

// ---------- Step 2: Login Details ----------

function Step2({
  state,
  update,
}: {
  state: RegistrationState;
  update: (p: Partial<RegistrationState>) => void;
}) {
  const [password, setPassword] = useState(state.password);
  const [confirm, setConfirm] = useState(state.confirmPassword);
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);

  const username = state.email || state.mobile;

  const strength = useMemo(() => scorePassword(password), [password]);
  const matches = password.length > 0 && password === confirm;
  const strong = strength.score >= 2;
  const canContinue = matches && strong;

  const submit = () => {
    if (!canContinue) return;
    update({
      password,
      confirmPassword: confirm,
      completed: { ...state.completed, 2: true },
      step: 3,
    });
  };

  return (
    <FormShell
      title="Create your login"
      subtitle="Your verified email/mobile is your username — we never ask you to invent a new one."
    >
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Username{" "}
          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-muted-foreground">
            from Step 1
          </span>
        </span>
        <input
          value={username}
          readOnly
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          className="mt-1 w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground outline-none"
        />
      </label>

      <PasswordField
        label="Create Password"
        value={password}
        onChange={setPassword}
        show={showA}
        onToggle={() => setShowA((v) => !v)}
      />

      {password.length > 0 && (
        <div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  strength.score > i
                    ? strength.score === 1
                      ? "bg-red-500"
                      : strength.score === 2
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{strength.label}</div>
        </div>
      )}

      <PasswordField
        label="Confirm Password"
        value={confirm}
        onChange={setConfirm}
        show={showB}
        onToggle={() => setShowB((v) => !v)}
      />
      {confirm.length > 0 && !matches && (
        <ErrorLine>Passwords do not match.</ErrorLine>
      )}

      <div className="flex items-center gap-3">
        <SecondaryButton onClick={() => update({ step: 1 })}>
          <ChevronLeft className="h-4 w-4" /> Back
        </SecondaryButton>
        <PrimaryButton onClick={submit} disabled={!canContinue}>
          Save & Continue
        </PrimaryButton>
      </div>
    </FormShell>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="mt-1 flex items-stretch overflow-hidden rounded-lg border border-border bg-background focus-within:border-[color:var(--auction)]">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="px-3 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

function scorePassword(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (!pw) return { score: 0, label: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Too weak", "Weak", "Medium", "Strong"] as const;
  return { score: s as 0 | 1 | 2 | 3, label: labels[s] };
}

// ---------- Step 3: Company Info ----------

function Step3({
  state,
  update,
}: {
  state: RegistrationState;
  update: (p: Partial<RegistrationState>) => void;
}) {
  const [f, setF] = useState({
    companyName: state.companyName,
    registeredAddress: state.registeredAddress,
    gstNumber: state.gstNumber,
    panNumber: state.panNumber,
    licenseNumber: state.licenseNumber,
    contactName: state.contactName,
    contactMobile: state.contactMobile,
    contactEmail: state.contactEmail,
    bankAccount: state.bankAccount,
    bankIfsc: state.bankIfsc,
    bankName: state.bankName,
  });
  const [gstFile, setGstFile] = useState<string | null>(state.gstFile);
  const [panFile, setPanFile] = useState<string | null>(state.panFile);
  const [chequeFile, setChequeFile] = useState<string | null>(state.chequeFile);
  const [licenseFile, setLicenseFile] = useState<string | null>(state.licenseFile);
  const [materials, setMaterials] = useState<string[]>(state.materialInterest);
  const [terms, setTerms] = useState(state.termsAccepted);

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const toggleMaterial = (m: string) =>
    setMaterials((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  const allFilled =
    Object.values(f).every((v) => v.trim().length > 0) &&
    gstFile &&
    panFile &&
    chequeFile &&
    licenseFile &&
    materials.length > 0 &&
    terms;

  const submit = () => {
    if (!allFilled) return;
    update({
      ...f,
      gstFile,
      panFile,
      chequeFile,
      licenseFile,
      materialInterest: materials,
      termsAccepted: terms,
      completed: { ...state.completed, 3: true },
      step: 4,
    });
  };

  return (
    <FormShell
      title="Company information"
      subtitle="All fields are required. Documents are used for one-time KYC verification."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company Name" value={f.companyName} onChange={set("companyName")} />
        <Field
          label="Registered Address"
          value={f.registeredAddress}
          onChange={set("registeredAddress")}
        />
        <Field label="GST Number" value={f.gstNumber} onChange={set("gstNumber")} />
        <Field label="PAN Number" value={f.panNumber} onChange={set("panNumber")} />
        <Field
          label="License Number"
          value={f.licenseNumber}
          onChange={set("licenseNumber")}
        />
        <Field
          label="Contact Person Name"
          value={f.contactName}
          onChange={set("contactName")}
        />
        <Field
          label="Mobile Number (business)"
          value={f.contactMobile}
          onChange={set("contactMobile")}
          type="tel"
          maxLength={10}
        />
        <div className="sm:col-span-2">
          <Field
            label="Email ID (business)"
            value={f.contactEmail}
            onChange={set("contactEmail")}
            type="email"
          />
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Material interest <span className="text-[color:var(--auction)]">*</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick every category you want auction alerts for. Same six categories the
          auctioneer uses.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MATERIALS.map((m) => {
            const on = materials.includes(m);
            return (
              <button
                key={m}
                type="button"
                aria-pressed={on}
                onClick={() => toggleMaterial(m)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  on
                    ? "border-[color:var(--auction)] bg-[color:var(--auction)]/10 text-[color:var(--auction)]"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bank details (for EMD refunds)
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Account Number" value={f.bankAccount} onChange={set("bankAccount")} />
          <Field label="IFSC Code" value={f.bankIfsc} onChange={set("bankIfsc")} />
          <Field label="Bank Name" value={f.bankName} onChange={set("bankName")} />
        </div>
      </div>

      <div className="mt-2 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Upload documents
        </div>
        <DropTile label="License" file={licenseFile} onFile={setLicenseFile} />
        <DropTile label="GST Certificate" file={gstFile} onFile={setGstFile} />
        <DropTile label="PAN Card" file={panFile} onFile={setPanFile} />
        <DropTile
          label="Cancelled Cheque / Bank Details"
          file={chequeFile}
          onFile={setChequeFile}
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Terms & Conditions
        </div>
        <div className="max-h-40 overflow-y-auto p-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            By registering as a bidder on Scrapify Auction, you agree to submit accurate
            KYC information, lock an EMD before bidding, and comply with post-auction
            lifting timelines. Winning bids create a binding contract with the seller.
          </p>
          <p className="mt-2">
            EMD is refundable if you do not win. Non-lifting after a winning bid may
            result in EMD forfeiture and account suspension. All disputes are subject to
            the jurisdiction of the courts of Mumbai, India.
          </p>
          <p className="mt-2">
            Scrapify may share your registration details with sellers and statutory
            authorities as required. You confirm you are authorised to represent the
            named entity, and that all uploaded documents are genuine.
          </p>
        </div>
        <label className="flex items-center gap-2 border-t border-border px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--auction)]"
          />
          I have read and accept the Terms & Conditions.
        </label>
      </div>

      <div className="flex items-center gap-3">
        <SecondaryButton onClick={() => update({ step: 2 })}>
          <ChevronLeft className="h-4 w-4" /> Back
        </SecondaryButton>
        <PrimaryButton onClick={submit} disabled={!allFilled}>
          Continue
        </PrimaryButton>
      </div>
    </FormShell>
  );
}

function DropTile({
  label,
  file,
  onFile,
}: {
  label: string;
  file: string | null;
  onFile: (name: string | null) => void;
}) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFile(files[0].name);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files);
      }}
      onClick={() => ref.current?.click()}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-colors ${
        file
          ? "border-emerald-500/50 bg-emerald-500/5"
          : drag
            ? "border-[color:var(--auction)] bg-[color:var(--auction)]/5"
            : "border-border bg-card hover:border-[color:var(--auction)]/60"
      }`}
    >
      {file ? (
        <FileCheck2 className="h-5 w-5 shrink-0 text-emerald-600" />
      ) : (
        <UploadCloud className="h-5 w-5 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="truncate text-xs text-muted-foreground">
          {file ?? "Drag & drop or click to upload (PDF, JPG, PNG)"}
        </div>
      </div>
      {file && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFile(null);
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Replace
        </button>
      )}
      <input
        ref={ref}
        type="file"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
        accept=".pdf,image/*"
      />
    </div>
  );
}

// ---------- Step 4: Complete ----------

function Step4({
  state,
  update,
}: {
  state: RegistrationState;
  update: (p: Partial<RegistrationState>) => void;
}) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<
    "review" | "payment" | "pending" | "approved" | "rejected" | "suspended"
  >(
    state.vendorStatus === "approved"
      ? "approved"
      : state.vendorStatus === "rejected"
        ? "rejected"
        : state.vendorStatus === "suspended"
          ? "suspended"
          : state.paymentSubmitted
            ? "pending"
            : "review",
  );
  const [method, setMethod] = useState<RegistrationState["paymentMethod"]>(
    state.paymentMethod,
  );

  const rows: [string, string, WizardStep][] = [
    ["Mobile", state.mobile, 1],
    ["Email", state.email, 1],
    ["Company Name", state.companyName, 3],
    ["Registered Address", state.registeredAddress, 3],
    ["GST Number", state.gstNumber, 3],
    ["PAN Number", state.panNumber, 3],
    ["License Number", state.licenseNumber, 3],
    ["Material Interest", state.materialInterest.join(", "), 3],
    ["Contact Person", state.contactName, 3],
    ["Business Mobile", state.contactMobile, 3],
    ["Business Email", state.contactEmail, 3],
    ["Bank Account", state.bankAccount, 3],
    ["IFSC", state.bankIfsc, 3],
    ["Bank Name", state.bankName, 3],
    ["License Document", state.licenseFile ?? "—", 3],
    ["GST Certificate", state.gstFile ?? "—", 3],
    ["PAN Card", state.panFile ?? "—", 3],
    ["Cancelled Cheque", state.chequeFile ?? "—", 3],
  ];

  if (phase === "review") {
    return (
      <FormShell
        title="Review your details"
        subtitle="Confirm everything is correct before payment. You can edit any section."
      >
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {rows.map(([k, v, jumpTo], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-background"}>
                  <td className="w-1/2 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {k}
                  </td>
                  <td className="px-4 py-2.5 text-foreground">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{v || "—"}</span>
                      <button
                        type="button"
                        onClick={() => update({ step: jumpTo })}
                        className="inline-flex items-center gap-1 text-xs text-[color:var(--auction)] hover:underline"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <SecondaryButton onClick={() => update({ step: 3 })}>
            <ChevronLeft className="h-4 w-4" /> Back
          </SecondaryButton>
          <PrimaryButton onClick={() => setPhase("payment")}>
            Proceed to Payment <ChevronRight className="h-4 w-4" />
          </PrimaryButton>
        </div>
      </FormShell>
    );
  }

  if (phase === "payment") {
    const options: { id: NonNullable<RegistrationState["paymentMethod"]>; blurb: string }[] = [
      { id: "RTGS", blurb: "Real-time gross settlement, best for large transfers." },
      { id: "NEFT", blurb: "Standard bank transfer, usually settles same day." },
      { id: "UPI", blurb: "Instant UPI transfer via any UPI app." },
    ];
    return (
      <FormShell
        title="Registration payment"
        subtitle="A one-time registration fee activates your bidder account."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setMethod(o.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                method === o.id
                  ? "border-[color:var(--auction)] bg-[color:var(--auction)]/5"
                  : "border-border bg-card hover:border-[color:var(--auction)]/50"
              }`}
            >
              <div className="font-display text-lg font-extrabold text-[color:var(--navy)]">
                {o.id}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{o.blurb}</div>
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-muted p-4 text-sm text-foreground">
          Amount payable: <b className="font-display">₹5,000</b> (one-time,
          non-refundable KYC processing fee).
        </div>

        <div className="flex items-center gap-3">
          <SecondaryButton onClick={() => setPhase("review")}>
            <ChevronLeft className="h-4 w-4" /> Back
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              update({
                paymentMethod: method,
                paymentSubmitted: true,
                vendorStatus: "pending",
                statusReason: "",
                completed: { ...state.completed, 4: true },
              });
              setPhase("pending");
            }}
            disabled={!method}
          >
            Submit payment
          </PrimaryButton>
        </div>
      </FormShell>
    );
  }

  if (phase === "pending") {
    return (
      <FormShell
        title="Submitted — pending admin review"
        subtitle="Under review, usually within 24 hours. You'll be able to bid once an admin approves your KYC."
      >
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <div className="font-display text-base font-bold text-amber-900">
            Status: Pending
          </div>
          <p className="mt-1 text-amber-900/80">
            Bidding is <b>locked</b> until an admin approves your account. This banner
            will stay on your profile until approval.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          <div className="font-semibold uppercase tracking-wider">Demo control</div>
          <p className="mt-1">
            No live admin panel connected yet — simulate the admin decision that drives
            this screen.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                update({ approved: true, vendorStatus: "approved", statusReason: "" });
                setPhase("approved");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground hover:border-[color:var(--auction)]"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              type="button"
              onClick={() => {
                update({
                  approved: false,
                  vendorStatus: "rejected",
                  statusReason: "PAN card image unreadable — please re-upload a clear scan.",
                });
                setPhase("rejected");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground hover:border-destructive"
            >
              Reject with reason
            </button>
          </div>
        </div>

        <SecondaryButton onClick={() => navigate({ to: "/" })}>
          Back to marketplace
        </SecondaryButton>
      </FormShell>
    );
  }

  if (phase === "rejected") {
    return (
      <FormShell
        title="Registration rejected"
        subtitle="The auctioneer reviewed your submission and returned it with a reason."
      >
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <div className="font-display text-base font-bold text-destructive">
            Status: Rejected
          </div>
          <p className="mt-1 text-sm text-destructive/90">
            Reason from admin: “{state.statusReason || "Not specified"}”
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PrimaryButton
            onClick={() => {
              update({
                step: 3,
                paymentSubmitted: false,
                vendorStatus: "none",
                completed: { ...state.completed, 3: false, 4: false },
              });
            }}
          >
            Edit &amp; resubmit <ChevronRight className="h-4 w-4" />
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate({ to: "/" })}>
            Back to marketplace
          </SecondaryButton>
        </div>
      </FormShell>
    );
  }

  if (phase === "suspended") {
    return (
      <FormShell
        title="Account suspended"
        subtitle="Bidding is blocked while your account is suspended."
      >
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <div className="font-display text-base font-bold text-destructive">
            Status: Suspended
          </div>
          <p className="mt-1 text-sm text-destructive/90">
            Reason from admin: “{state.statusReason || "Not specified"}”
          </p>
          <p className="mt-2 text-sm text-destructive/80">
            Contact support at <b>support@scrapify.in</b> or call 1800-000-000 to appeal.
          </p>
        </div>
        <SecondaryButton onClick={() => navigate({ to: "/" })}>
          Back to marketplace
        </SecondaryButton>
      </FormShell>
    );
  }

  // approved
  return (
    <FormShell
      title="Approved — you can now bid"
      subtitle="Your KYC has been approved. All bidding features are now unlocked."
    >
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 font-display text-base font-bold text-emerald-800">
          <Check className="h-5 w-5" /> KYC approved
        </div>
        <p className="mt-1 text-sm text-emerald-800/80">
          KYC fields are now read-only — use “request update” from your dashboard to
          change them, which sends you back to the admin queue.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
        <div className="font-semibold uppercase tracking-wider">Demo control</div>
        <button
          type="button"
          onClick={() => {
            update({
              approved: false,
              vendorStatus: "suspended",
              statusReason: "Non-lifting of a previously won lot (AUC-2026-0009).",
            });
            setPhase("suspended");
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground hover:border-destructive"
        >
          Simulate suspension
        </button>
      </div>
      <div className="flex items-center gap-3">
        <SecondaryButton
          onClick={() => {
            clearRegistration();
            navigate({ to: "/" });
          }}
        >
          Reset demo state
        </SecondaryButton>
        <PrimaryButton onClick={() => navigate({ to: "/" })}>
          Start bidding <ChevronRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </FormShell>
  );
}

// ---------- Shared primitives ----------

function FormShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-soft p-6 sm:p-8">
      <h1 className="font-display text-2xl font-extrabold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-[color:var(--auction)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      />
    </label>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[color:var(--auction)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.7)] transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:border-[color:var(--navy)]/40"
    >
      {children}
    </button>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-700">
      {children}
    </div>
  );
}
function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6.1C12.3 13.7 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.15-3.2-.45-4.7H24v9.1h12.7c-.55 2.9-2.2 5.3-4.6 7l7.6 5.9c4.4-4.1 6.8-10.2 6.8-17.3z" />
      <path fill="#FBBC05" d="M10.4 28.1a14.6 14.6 0 010-9.3l-7.8-6.1a24 24 0 000 21.5l7.8-6.1z" />
      <path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.7 2.3-6.4 0-11.7-4.2-13.6-10.2l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z" />
    </svg>
  );
}
