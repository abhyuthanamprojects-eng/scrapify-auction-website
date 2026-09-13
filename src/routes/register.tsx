"use client";

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
import { signInWithPopup } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import type { RegistrationState, WizardStep } from "@/lib/registration-store";
import { clearRegistration, MATERIALS } from "@/lib/registration-store";
import { api } from "@/lib/api-client";

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

const isIndianMobile = (value: string) => /^(?:\+91[\s-]?)?[6-9]\d{9}$/.test(value.trim());
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isIndianPincode = (value: string) => /^[1-9]\d{5}$/.test(value.trim());
const isGstin = (value: string) => /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.trim().toUpperCase());
const isPan = (value: string) => /^[A-Z]{5}\d{4}[A-Z]$/.test(value.trim().toUpperCase());
const isIfsc = (value: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase());

function RegisterWizard() {
  const { state, update } = useRegistration();
  const step = state.step;
  const [hydrated, setHydrated] = useState(false);

  // Ensure hydration completes before rendering step-dependent content
  useEffect(() => {
    setHydrated(true);
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
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <header className="border-b border-border bg-[color:var(--navy)] text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white">
              <img src="/scrapify-auction-app-icon.png" alt="Scrapify Auctions" className="h-full w-full object-contain" />
            </span>
            Scrapify<span className="text-[color:var(--gold-soft)]">Auction</span>
          </Link>
          <div className="text-xs uppercase tracking-wider text-white/70" suppressHydrationWarning>
            Step {step} of 4
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">How would you like to use Scrapify?</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["buyer", "seller"] as const).map((role) => (
              <button key={role} type="button" onClick={() => update({ role })} className={`rounded-lg border p-4 text-left ${state.role === role ? "border-[color:var(--auction)] bg-orange-50" : "border-border"}`}>
                <strong className="block uppercase">{role}</strong>
                <span className="text-sm text-muted-foreground">{role === "buyer" ? "Participate in auctions" : "Create and manage auctions"}</span>
              </button>
            ))}
          </div>
        </div>
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
                  <div className={`h-0.5 flex-1 ${step > s.n ? "bg-emerald-500" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm font-semibold text-foreground">{STEPS[step - 1].label}</div>
        </div>

        <div
          className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
          suppressHydrationWarning
        >
          {/* Left: vertical stepper (desktop) */}
          <aside className="hidden lg:block">
            <div className="card-soft sticky top-6 p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {state.role === "seller" ? "Seller Registration" : "Buyer Registration"}
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
                Your progress is saved automatically. You can close this tab and resume where you
                left off.
              </div>
            </div>
          </aside>

          {/* Right: current step form */}
          <div className="mx-auto w-full max-w-[640px] lg:mx-0" suppressHydrationWarning>
            {hydrated && (
              <>
                {step === 1 && <Step1 state={state} update={update} />}
                {step === 2 && <Step2 state={state} update={update} />}
                {step === 3 && <Step3 state={state} update={update} />}
                {step === 4 && <Step4 state={state} update={update} />}
              </>
            )}
            {!hydrated && <Step1 state={state} update={update} />}
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
  const [mobileOtpSent, setMobileOtpSent] = useState(state.mobileOtpVerified);
  const [emailOtpSent, setEmailOtpSent] = useState(state.emailOtpVerified);
  const [mobileOtp, setMobileOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtpLength, setMobileOtpLength] = useState(4);
  const [emailOtpLength, setEmailOtpLength] = useState(6);
  const [mobileResendIn, setMobileResendIn] = useState(0);
  const [emailResendIn, setEmailResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mobileResendIn <= 0) return;
    const t = setTimeout(() => setMobileResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [mobileResendIn]);

  useEffect(() => {
    if (emailResendIn <= 0) return;
    const t = setTimeout(() => setEmailResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [emailResendIn]);

  const validMobile = /^[6-9]\d{9}$/.test(mobile);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const mobileVerified = state.mobileOtpVerified;
  const emailVerified = state.emailOtpVerified;

  const onGoogle = async () => {
    setError(null);
    if (!mobileVerified) {
      setError("Verify your mobile OTP before continuing with Google.");
      return;
    }
    update({ mobile });
    try {
      const { auth, googleProvider } = await getFirebaseAuth();
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await api.googleSignIn(idToken, mobile || undefined, state.role);
      const user = res.user;
      update({
        email: user?.email ?? result.user.email ?? email,
        contactEmail: user?.email ?? result.user.email ?? email,
        contactName: user?.name ?? result.user.displayName ?? state.contactName,
        mobileOtpVerified: true,
        emailOtpVerified: true,
        otpVerified: true,
        googleLinked: true,
        vendorCode: user?.vendor?.id ?? "",
        completed: { ...state.completed, 1: true, 2: true },
        step: 3,
      });
      window.dispatchEvent(new CustomEvent("scrapify:auth"));
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") return;
      setError(err instanceof Error ? err.message : "Google sign-up failed");
    }
  };

  const sendMobileOtp = async () => {
    setError(null);
    if (!validMobile) return setError("Enter a valid 10-digit mobile number.");
    try {
      const response = await api.requestOtp(mobile, "register");
      update({ mobile });
      setMobileOtpLength(Number(response.otp_length) || 4);
      setMobileOtpSent(true);
      setMobileResendIn(response.resend_after ?? 30);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send mobile OTP.");
    }
  };

  const sendEmailOtp = async () => {
    setError(null);
    if (!validEmail) return setError("Enter a valid email address.");
    try {
      const response = await api.requestOtp(email, "register");
      update({ email });
      setEmailOtpLength(Number(response.otp_length) || 6);
      setEmailOtpSent(true);
      setEmailResendIn(response.resend_after ?? 30);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send email OTP.");
    }
  };

  const verifyMobile = async () => {
    setError(null);
    if (!new RegExp(`^\\d{${mobileOtpLength}}$`).test(mobileOtp)) return setError(`Enter the ${mobileOtpLength}-digit mobile OTP.`);
    try {
      await api.verifyOtp(mobile, mobileOtp, "register");
      const complete = state.emailOtpVerified;
      update({
        mobile,
        mobileOtpVerified: true,
        otpVerified: complete,
        ...(complete ? { completed: { ...state.completed, 1: true }, step: 2 as const } : {}),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mobile OTP verification failed.");
    }
  };

  const verifyEmail = async () => {
    setError(null);
    if (!new RegExp(`^\\d{${emailOtpLength}}$`).test(emailOtp)) return setError(`Enter the ${emailOtpLength}-digit email OTP.`);
    try {
      await api.verifyOtp(email, emailOtp, "register");
      const complete = state.mobileOtpVerified;
      update({
        email,
        emailOtpVerified: true,
        otpVerified: complete,
        ...(complete ? { completed: { ...state.completed, 1: true }, step: 2 as const } : {}),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Email OTP verification failed.");
    }
  };

  return (
    <FormShell
      title="Verify your identity"
      subtitle="Verify your mobile by SMS and your email independently. Both checks are required before registration."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Mobile OTP</span>
            {mobileVerified && <span className="text-xs font-semibold text-emerald-600">Verified</span>}
          </div>
          <Field
            label="Mobile Number"
            type="tel"
            value={mobile}
            onChange={(value) => {
              setMobile(value);
              if (mobileVerified) {
                update({ mobile: value, mobileOtpVerified: false, otpVerified: false });
              } else if (mobileOtpSent) {
                setMobileOtpSent(false);
                setMobileOtp("");
              }
            }}
            placeholder="10-digit mobile"
            disabled={mobileVerified}
            maxLength={10}
          />
          {!mobileVerified && !mobileOtpSent && (
            <div className="mt-3">
              <PrimaryButton onClick={sendMobileOtp} disabled={!validMobile}>Send SMS OTP</PrimaryButton>
            </div>
          )}
          {!mobileVerified && mobileOtpSent && (
            <>
              <Field label="SMS code" type="text" value={mobileOtp} onChange={setMobileOtp} placeholder={`${mobileOtpLength}-digit code`} maxLength={mobileOtpLength} />
              <div className="flex items-center justify-between text-xs">
                <button type="button" className="text-[color:var(--auction)] hover:underline disabled:text-muted-foreground" disabled={mobileResendIn > 0} onClick={sendMobileOtp}>
                  {mobileResendIn > 0 ? "Resend in " + mobileResendIn + "s" : "Resend SMS"}
                </button>
                <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setMobileOtpSent(false)}>Change</button>
              </div>
              <div className="mt-3">
                <PrimaryButton onClick={verifyMobile} disabled={mobileOtp.length !== mobileOtpLength}>Verify mobile</PrimaryButton>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Email OTP</span>
            {emailVerified && <span className="text-xs font-semibold text-emerald-600">Verified</span>}
          </div>
          <Field
            label="Email ID"
            type="email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              if (emailVerified) {
                update({ email: value, emailOtpVerified: false, otpVerified: false });
              } else if (emailOtpSent) {
                setEmailOtpSent(false);
                setEmailOtp("");
              }
            }}
            placeholder="you@company.com"
            disabled={emailVerified}
          />
          {!emailVerified && !emailOtpSent && (
            <div className="mt-3">
              <PrimaryButton onClick={sendEmailOtp} disabled={!validEmail}>Send email OTP</PrimaryButton>
            </div>
          )}
          {!emailVerified && emailOtpSent && (
            <>
              <Field label="Email code" type="text" value={emailOtp} onChange={setEmailOtp} placeholder={`${emailOtpLength}-digit code`} maxLength={emailOtpLength} />
              <div className="flex items-center justify-between text-xs">
                <button type="button" className="text-[color:var(--auction)] hover:underline disabled:text-muted-foreground" disabled={emailResendIn > 0} onClick={sendEmailOtp}>
                  {emailResendIn > 0 ? "Resend in " + emailResendIn + "s" : "Resend email"}
                </button>
                <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setEmailOtpSent(false)}>Change</button>
              </div>
              <div className="mt-3">
                <PrimaryButton onClick={verifyEmail} disabled={emailOtp.length !== emailOtpLength}>Verify email</PrimaryButton>
              </div>
            </>
          )}
        </div>
      </div>

      {error && <ErrorLine>{error}</ErrorLine>}
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
        Google verifies your email. Verify mobile OTP first, then you can continue directly to Company Information &amp; KYC.
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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const username = state.email || state.mobile;

  const strength = useMemo(() => scorePassword(password), [password]);
  const matches = password.length > 0 && password === confirm;
  const strong = password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
  const canContinue = matches && strong;

  const submit = async () => {
    if (!canContinue) return;
    setBusy(true);
    setError(null);
    try {
      const response = await api.register({
        name: state.email.split("@")[0] || state.mobile,
        email: state.email,
        phone: state.mobile,
        password,
        registration_type: state.role,
      });
      const vendorCode = response.user?.vendor?.id ?? "";
      update({
        password: "",
        confirmPassword: "",
        vendorCode,
        completed: { ...state.completed, 2: true },
        step: 3,
      });
      window.dispatchEvent(new CustomEvent("scrapify:auth"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Account could not be created.");
    } finally {
      setBusy(false);
    }
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
      {confirm.length > 0 && !matches && <ErrorLine>Passwords do not match.</ErrorLine>}
      {error && <ErrorLine>{error}</ErrorLine>}

      <div className="flex items-center gap-3">
        <SecondaryButton onClick={() => update({ step: 1 })}>
          <ChevronLeft className="h-4 w-4" /> Back
        </SecondaryButton>
        <PrimaryButton onClick={submit} disabled={!canContinue || busy}>
          {busy ? "Creating account…" : "Save & Continue"}
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
    pincode: state.pincode,
    city: state.city,
    state: state.state,
    gstNumber: state.gstNumber,
    panNumber: state.panNumber,
    licenseNumber: state.licenseNumber,
    contactName: state.contactName,
    contactMobile: state.contactMobile,
    contactEmail: state.contactEmail,
    bankAccount: state.bankAccount,
    bankIfsc: state.bankIfsc,
    bankName: state.bankName,
    warehouseName: state.warehouseName,
    warehouseAddress: state.warehouseAddress,
    warehouseCity: state.warehouseCity,
    warehouseState: state.warehouseState,
    warehousePincode: state.warehousePincode,
    warehouseContact: state.warehouseContact,
  });
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [warehousePincodeLoading, setWarehousePincodeLoading] = useState(false);
  const [pincodeResolved, setPincodeResolved] = useState(Boolean(state.pincode && state.city && state.state));
  const [warehousePincodeResolved, setWarehousePincodeResolved] = useState(Boolean(state.warehousePincode && state.warehouseCity && state.warehouseState));

  const onPincodeChange = async (value: string) => {
    const pincode = value.replace(/\D/g, '').slice(0, 6);
    setF((p) => ({ ...p, pincode, city: '', state: '' }));
    setPincodeResolved(false);
    if (isIndianPincode(pincode)) {
      setPincodeLoading(true);
      try {
        const result = await api.lookupPincode(pincode);
        setF((p) => ({ ...p, city: result.city, state: result.state }));
        setPincodeResolved(true);
      } catch {
        setError("We could not resolve this PIN code. Please enter a valid Indian PIN code.");
      } finally {
        setPincodeLoading(false);
      }
    }
  };
  const onWarehousePincodeChange = async (value: string) => {
    const pincode = value.replace(/\D/g, '').slice(0, 6);
    setF((p) => ({ ...p, warehousePincode: pincode, warehouseCity: '', warehouseState: '' }));
    setWarehousePincodeResolved(false);
    if (!isIndianPincode(pincode)) return;
    setWarehousePincodeLoading(true);
    try {
      const result = await api.lookupPincode(pincode);
      setF((p) => ({ ...p, warehouseCity: result.city, warehouseState: result.state }));
      setWarehousePincodeResolved(true);
    } catch {
      setError("We could not resolve the warehouse PIN code. Please enter a valid Indian PIN code.");
    } finally {
      setWarehousePincodeLoading(false);
    }
  };
  const [gstFile, setGstFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [chequeFile, setChequeFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [materials, setMaterials] = useState<string[]>(state.materialInterest);
  const [terms, setTerms] = useState(state.termsAccepted);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const toggleMaterial = (m: string) =>
    setMaterials((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  const allFilled =
    Object.entries(f)
      .filter(([key]) => !key.startsWith("warehouse"))
      .every(([, value]) => value.trim().length > 0) &&
    gstFile &&
    panFile &&
    chequeFile &&
    licenseFile &&
    materials.length > 0 &&
    terms;

  const warehouseRequired = state.role === "seller";
  const warehouseComplete = [
    f.warehouseName,
    f.warehouseAddress,
    f.warehouseCity,
    f.warehouseState,
    f.warehousePincode,
  ].every((value) => value.trim().length > 0);
  const formComplete = allFilled &&
    isIndianPincode(f.pincode) && pincodeResolved &&
    isIndianMobile(f.contactMobile) &&
    isEmail(f.contactEmail) && isGstin(f.gstNumber) && isPan(f.panNumber) &&
    /^\d{6,30}$/.test(f.bankAccount.trim()) && isIfsc(f.bankIfsc) &&
    (!warehouseRequired || (warehouseComplete && isIndianPincode(f.warehousePincode) && warehousePincodeResolved));

  const submit = async () => {
    if (!formComplete) return;
    setBusy(true);
    setError(null);
    try {
      const vendorResponse = await api.registerVendor({
        company_name: f.companyName,
        address: f.registeredAddress,
        pincode: f.pincode,
        city: f.city,
        state: f.state,
        contact_name: f.contactName,
        email: f.contactEmail,
        phone: f.contactMobile,
        gst_number: f.gstNumber,
        pan_number: f.panNumber,
        license_number: f.licenseNumber,
        bank_name: f.bankName,
        account_number: f.bankAccount,
        ifsc_code: f.bankIfsc,
        account_holder_name: f.contactName,
        material_interest: materials,
        terms_accepted: terms,
        ...(warehouseRequired
          ? {
              warehouse_details: {
                name: f.warehouseName,
                address: f.warehouseAddress,
                city: f.warehouseCity,
                state: f.warehouseState,
                pincode: f.warehousePincode,
                contact_name: f.warehouseContact || f.contactName,
                contact_phone: f.contactMobile,
              },
            }
          : {}),
      });
      const vendorCode =
        vendorResponse.data?.code ?? vendorResponse.code ?? vendorResponse.id ?? state.vendorCode;
      if (!vendorCode) throw new Error("Vendor code missing from registration response.");
      await Promise.all([
        api.uploadVendorDocument(vendorCode, "license", "License", licenseFile!),
        api.uploadVendorDocument(vendorCode, "gst", "GST Certificate", gstFile!),
        api.uploadVendorDocument(vendorCode, "pan", "PAN Card", panFile!),
        api.uploadVendorDocument(vendorCode, "bank", "Cancelled Cheque", chequeFile!),
      ]);
      await api.submitVendorKyc(vendorCode);
      update({
        ...f,
        vendorCode,
        gstFile: gstFile!.name,
        panFile: panFile!.name,
        chequeFile: chequeFile!.name,
        licenseFile: licenseFile!.name,
        materialInterest: materials,
        termsAccepted: terms,
        completed: { ...state.completed, 3: true },
        step: 4,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Company registration failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormShell
      title="Company information"
      subtitle={
        state.role === "seller"
          ? "Complete your company, warehouse, banking, and KYC details for seller approval."
          : "All fields are required. Documents are used for one-time KYC verification."
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company Name" value={f.companyName} onChange={set("companyName")} />
        <Field
          label="Registered Address"
          value={f.registeredAddress}
          onChange={set("registeredAddress")}
        />
        <Field
          label="PIN Code"
          value={f.pincode}
          onChange={onPincodeChange}
          maxLength={6}
          placeholder={pincodeLoading ? "Looking up…" : "6-digit PIN code"}
        />
        <Field label="City (from PIN API)" value={f.city} onChange={set("city")} disabled={pincodeLoading} readOnly />
        <Field label="State (from PIN API)" value={f.state} onChange={set("state")} disabled={pincodeLoading} readOnly />
        <Field label="GST Number" value={f.gstNumber} onChange={set("gstNumber")} />
        <Field label="PAN Number" value={f.panNumber} onChange={set("panNumber")} />
        <Field label="License Number" value={f.licenseNumber} onChange={set("licenseNumber")} />
        <Field label="Contact Person Name" value={f.contactName} onChange={set("contactName")} />
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

      {warehouseRequired && (
        <div className="rounded-xl border border-[color:var(--auction)]/30 bg-[color:var(--auction)]/5 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Warehouse / operating site
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            This is the location from which your seller lots will be dispatched or inspected.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Warehouse name" value={f.warehouseName} onChange={set("warehouseName")} />
            <Field label="Warehouse PIN code" value={f.warehousePincode} onChange={onWarehousePincodeChange} maxLength={6} placeholder={warehousePincodeLoading ? "Looking up…" : "6-digit PIN code"} />
            <div className="sm:col-span-2">
              <Field label="Warehouse address" value={f.warehouseAddress} onChange={set("warehouseAddress")} />
            </div>
            <Field label="Warehouse city (from PIN API)" value={f.warehouseCity} onChange={set("warehouseCity")} disabled={warehousePincodeLoading} readOnly />
            <Field label="Warehouse state (from PIN API)" value={f.warehouseState} onChange={set("warehouseState")} disabled={warehousePincodeLoading} readOnly />
            <Field label="Site contact name (optional)" value={f.warehouseContact} onChange={set("warehouseContact")} />
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Material interest <span className="text-[color:var(--auction)]">*</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick every category you want auction alerts for. Same six categories the auctioneer uses.
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
            By registering on Scrapify Auction, you agree to submit accurate KYC information and
            comply with the platform's verification, payment, and fulfilment rules. Winning bids
            create a binding contract with the seller.
          </p>
          <p className="mt-2">
            EMD is refundable if you do not win. Non-lifting after a winning bid may result in EMD
            forfeiture and account suspension. All disputes are subject to the jurisdiction of the
            courts of Mumbai, India.
          </p>
          <p className="mt-2">
            Scrapify may share your registration details with sellers and statutory authorities as
            required. You confirm you are authorised to represent the named entity, and that all
            uploaded documents are genuine.
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
        <PrimaryButton onClick={submit} disabled={!formComplete || busy}>
          {busy ? "Uploading…" : "Continue"}
        </PrimaryButton>
      </div>
      {error && <ErrorLine>{error}</ErrorLine>}
    </FormShell>
  );
}

function DropTile({
  label,
  file,
  onFile,
}: {
  label: string;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFile(files[0]);
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
          {file?.name ?? "Drag & drop or click to upload (PDF, JPG, PNG)"}
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
  const [method, setMethod] = useState<RegistrationState["paymentMethod"]>(state.paymentMethod);
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [registrationFee, setRegistrationFee] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== "pending" || !api.getToken()) return;
    let active = true;
    const refresh = async () => {
      try {
        const response = await api.me();
        const vendor = response.user?.vendor;
        if (!active || !vendor?.status) return;
        if (["approved", "rejected", "suspended"].includes(vendor.status)) {
          const next = vendor.status as "approved" | "rejected" | "suspended";
          update({
            approved: next === "approved",
            vendorStatus: next,
            statusReason: vendor.rejection_reason ?? vendor.suspension_reason ?? "",
          });
          setPhase(next);
        }
      } catch {
        // Keep the persisted pending state; the next poll will retry.
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [phase, update]);

  useEffect(() => {
    api
      .getPlatformConfig()
      .then((config) => setRegistrationFee(config.vendor_registration_fee))
      .catch(() => setRegistrationFee(null));
  }, []);

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
    ...(state.role === "seller"
      ? [
          ["Warehouse Name", state.warehouseName, 3] as [string, string, WizardStep],
          ["Warehouse Address", state.warehouseAddress, 3] as [string, string, WizardStep],
          ["Warehouse City / State", `${state.warehouseCity}, ${state.warehouseState}`, 3] as [string, string, WizardStep],
          ["Warehouse PIN Code", state.warehousePincode, 3] as [string, string, WizardStep],
        ]
      : []),
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
        subtitle={
          state.role === "seller"
            ? "A one-time registration fee submits your seller verification application."
            : "A one-time registration fee activates your buyer account."
        }
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
          Amount payable:{" "}
          <b className="font-display">
            {registrationFee == null ? "Loading…" : `₹${registrationFee.toLocaleString("en-IN")}`}
          </b>{" "}
          (one-time, non-refundable KYC processing fee).
        </div>

        <Field
          label="Payment reference / UTR"
          value={paymentReference}
          onChange={setPaymentReference}
          placeholder="Enter bank or UPI reference"
        />
        {error && <ErrorLine>{error}</ErrorLine>}

        <div className="flex items-center gap-3">
          <SecondaryButton onClick={() => setPhase("review")}>
            <ChevronLeft className="h-4 w-4" /> Back
          </SecondaryButton>
          <PrimaryButton
            onClick={async () => {
              if (!method || !paymentReference.trim() || !state.vendorCode) return;
              setBusy(true);
              setError(null);
              try {
                await api.submitVendorPayment(state.vendorCode, {
                  method,
                  reference: paymentReference.trim(),
                });
                update({
                  paymentMethod: method,
                  paymentSubmitted: true,
                  vendorStatus: "pending",
                  statusReason: "",
                  completed: { ...state.completed, 4: true },
                });
                setPhase("pending");
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "Payment could not be submitted.",
                );
              } finally {
                setBusy(false);
              }
            }}
            disabled={!method || !paymentReference.trim() || busy}
          >
            {busy ? "Submitting…" : "Submit payment"}
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
          <div className="font-display text-base font-bold text-amber-900">Status: Pending</div>
          <p className="mt-1 text-amber-900/80">
            Bidding is <b>locked</b> until an admin approves your account. This banner will stay on
            your profile until approval.
          </p>
        </div>

        <SecondaryButton onClick={() => navigate({ to: "/" })}>Back to marketplace</SecondaryButton>
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
          <div className="font-display text-base font-bold text-destructive">Status: Rejected</div>
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
          <div className="font-display text-base font-bold text-destructive">Status: Suspended</div>
          <p className="mt-1 text-sm text-destructive/90">
            Reason from admin: “{state.statusReason || "Not specified"}”
          </p>
          <p className="mt-2 text-sm text-destructive/80">
            Contact support at <b>support@scrapify.in</b> or call 1800-000-000 to appeal.
          </p>
        </div>
        <SecondaryButton onClick={() => navigate({ to: "/" })}>Back to marketplace</SecondaryButton>
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
          KYC fields are now read-only — use “request update” from your dashboard to change them,
          which sends you back to the admin queue.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <SecondaryButton
          onClick={() => {
            clearRegistration();
            navigate({ to: "/" });
          }}
        >
          Start a new registration
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
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  readOnly?: boolean;
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
        readOnly={readOnly}
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
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6.1C12.3 13.7 17.6 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.15-3.2-.45-4.7H24v9.1h12.7c-.55 2.9-2.2 5.3-4.6 7l7.6 5.9c4.4-4.1 6.8-10.2 6.8-17.3z"
      />
      <path fill="#FBBC05" d="M10.4 28.1a14.6 14.6 0 010-9.3l-7.8-6.1a24 24 0 000 21.5l7.8-6.1z" />
      <path
        fill="#34A853"
        d="M24 47.5c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.7 2.3-6.4 0-11.7-4.2-13.6-10.2l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z"
      />
    </svg>
  );
}
