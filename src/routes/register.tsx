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
import { redirectIfAuthenticated } from "@/lib/route-guards";

export const Route = createFileRoute("/register")({
  beforeLoad: () => redirectIfAuthenticated(),
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
const isGstin = (value: string) =>
  /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.trim().toUpperCase());
const isPan = (value: string) => /^[A-Z]{5}\d{4}[A-Z]$/.test(value.trim().toUpperCase());
const isIfsc = (value: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase());
const isBankAccount = (value: string) => /^\d{6,40}$/.test(value.trim());
const OTP_LENGTH = 4;

const derivePanFromGstin = (gstin: string) => gstin.slice(2, 12).toUpperCase();

const objectValue = (value: unknown, keys: string[]) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "";
};

const formatGstAddress = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const parts = [
    objectValue(value, ["address", "address_line1", "address_line_1", "principal_place_address"]),
    objectValue(value, ["address_line2", "address_line_2"]),
    objectValue(value, ["building_name", "building_number", "floor_number"]),
    objectValue(value, ["street", "locality", "location", "district"]),
    objectValue(value, ["city", "city_name", "town"]),
    objectValue(value, ["pincode", "pin_code", "postal_code"]),
  ].filter(Boolean);
  return [...new Set(parts)].join(", ");
};

const gstAddressPincode = (value: unknown) =>
  objectValue(value, ["pincode", "pin_code", "postal_code", "postalCode"])
    .replace(/\D/g, "")
    .slice(0, 6);

const gstAddressLocation = (value: unknown) => ({
  city: objectValue(value, ["city", "city_name", "town", "district"]),
  state: objectValue(value, ["state", "state_name"]),
});

const rateLimitSeconds = (cause: unknown) => {
  if (!(cause instanceof Error)) return 0;
  const error = cause as Error & { status?: number; retryAfter?: number };
  if (error.status !== 429) return 0;
  const retryAfter = Number(error.retryAfter);
  return Math.max(
    1,
    Math.min(3600, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60),
  );
};

function RegisterWizard() {
  const { state, update } = useRegistration();
  const step = state.step;
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (state.vendorCode && (state.mobileOtpVerified || state.emailOtpVerified)) {
      // A transient status request failure must not erase the wizard or reload
      // the whole document. The authenticated session and locally saved form
      // state are still valid and the pending screen polls safely below.
      void api.getVendorKycStatus(state.vendorCode).catch(() => undefined);
    }
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
              <img
                src="/scrapify-auction-app-icon.png"
                alt="Scrapify Auctions"
                className="h-full w-full object-contain"
              />
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
          <p className="text-sm font-semibold text-foreground">
            How would you like to use Scrapify?
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["buyer", "seller"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => update({ role })}
                className={`rounded-lg border p-4 text-left ${state.role === role ? "border-[color:var(--auction)] bg-orange-50" : "border-border"}`}
              >
                <strong className="block uppercase">{role}</strong>
                <span className="text-sm text-muted-foreground">
                  {role === "buyer" ? "Participate in auctions" : "Create and manage auctions"}
                </span>
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
  const [mobileOtpLength, setMobileOtpLength] = useState(OTP_LENGTH);
  const [emailOtpLength, setEmailOtpLength] = useState(OTP_LENGTH);
  const [mobileResendIn, setMobileResendIn] = useState(0);
  const [emailResendIn, setEmailResendIn] = useState(0);
  const [mobileOtpPending, setMobileOtpPending] = useState(false);
  const [emailOtpPending, setEmailOtpPending] = useState(false);
  const otpRequestsInFlight = useRef(new Set<"mobile" | "email">());
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
    try {
      const { auth, googleProvider } = await getFirebaseAuth();
      const result = await signInWithPopup(auth, googleProvider);
      update({
        email: result.user.email ?? email,
        contactEmail: result.user.email ?? email,
        contactName: result.user.displayName ?? state.contactName,
        mobileOtpVerified: false,
        emailOtpVerified: true,
        otpVerified: false,
        googleLinked: true,
        completed: { ...state.completed, 1: true, 2: false },
        step: 2,
      });
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") return;
      setError(err instanceof Error ? err.message : "Google sign-up failed");
    }
  };

  const sendMobileOtp = async () => {
    if (otpRequestsInFlight.current.has("mobile")) return;
    setError(null);
    if (!validMobile) return setError("Enter a valid 10-digit mobile number.");
    otpRequestsInFlight.current.add("mobile");
    setMobileOtpPending(true);
    try {
      const response = await api.requestOtp(mobile, "register");
      update({ mobile });
      setMobileOtpLength(OTP_LENGTH);
      setMobileOtpSent(true);
      setMobileResendIn(response.resend_after ?? 30);
    } catch (cause) {
      const retryAfter = rateLimitSeconds(cause);
      if (retryAfter) setMobileResendIn(retryAfter);
      setError(cause instanceof Error ? cause.message : "Could not send mobile OTP.");
    } finally {
      otpRequestsInFlight.current.delete("mobile");
      setMobileOtpPending(false);
    }
  };

  const sendEmailOtp = async () => {
    if (otpRequestsInFlight.current.has("email")) return;
    setError(null);
    if (!validEmail) return setError("Enter a valid email address.");
    otpRequestsInFlight.current.add("email");
    setEmailOtpPending(true);
    try {
      const response = await api.requestOtp(email, "register");
      update({ email });
      setEmailOtpLength(OTP_LENGTH);
      setEmailOtpSent(true);
      setEmailResendIn(response.resend_after ?? 30);
    } catch (cause) {
      const retryAfter = rateLimitSeconds(cause);
      if (retryAfter) setEmailResendIn(retryAfter);
      setError(cause instanceof Error ? cause.message : "Could not send email OTP.");
    } finally {
      otpRequestsInFlight.current.delete("email");
      setEmailOtpPending(false);
    }
  };

  const verifyMobile = async () => {
    setError(null);
    if (!new RegExp(`^\\d{${mobileOtpLength}}$`).test(mobileOtp))
      return setError(`Enter the ${mobileOtpLength}-digit mobile OTP.`);
    try {
      await api.verifyOtp(mobile, mobileOtp, "register");
      const complete = state.emailOtpVerified || emailVerified;
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
    if (!new RegExp(`^\\d{${emailOtpLength}}$`).test(emailOtp))
      return setError(`Enter the ${emailOtpLength}-digit email OTP.`);
    try {
      await api.verifyOtp(email, emailOtp, "register");
      const complete = state.mobileOtpVerified || mobileVerified;
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
      subtitle={
        mobileVerified && emailVerified
          ? "Both checks are verified. Continue below — or start fresh if this is not your registration."
          : "Verify your mobile by SMS and your email independently. Both checks are required before registration."
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Mobile OTP</span>
            {mobileVerified && (
              <span className="text-xs font-semibold text-emerald-600">Verified</span>
            )}
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
              <PrimaryButton
                onClick={sendMobileOtp}
                disabled={!validMobile || mobileOtpPending || mobileResendIn > 0}
              >
                {mobileOtpPending
                  ? "Sending…"
                  : mobileResendIn > 0
                    ? `Retry in ${mobileResendIn}s`
                    : "Send SMS OTP"}
              </PrimaryButton>
            </div>
          )}
          {!mobileVerified && mobileOtpSent && (
            <>
              <Field
                label="SMS code"
                type="text"
                value={mobileOtp}
                onChange={setMobileOtp}
                placeholder={`${mobileOtpLength}-digit code`}
                maxLength={mobileOtpLength}
              />
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  className="text-[color:var(--auction)] hover:underline disabled:text-muted-foreground"
                  disabled={mobileResendIn > 0 || mobileOtpPending}
                  onClick={sendMobileOtp}
                >
                  {mobileOtpPending
                    ? "Sending…"
                    : mobileResendIn > 0
                      ? "Resend in " + mobileResendIn + "s"
                      : "Resend SMS"}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileOtpSent(false)}
                >
                  Change
                </button>
              </div>
              <div className="mt-3">
                <PrimaryButton
                  onClick={verifyMobile}
                  disabled={mobileOtp.length !== mobileOtpLength}
                >
                  Verify mobile
                </PrimaryButton>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Email OTP</span>
            {emailVerified && (
              <span className="text-xs font-semibold text-emerald-600">Verified</span>
            )}
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
              <PrimaryButton
                onClick={sendEmailOtp}
                disabled={!validEmail || emailOtpPending || emailResendIn > 0}
              >
                {emailOtpPending
                  ? "Sending…"
                  : emailResendIn > 0
                    ? `Retry in ${emailResendIn}s`
                    : "Send email OTP"}
              </PrimaryButton>
            </div>
          )}
          {!emailVerified && emailOtpSent && (
            <>
              <Field
                label="Email code"
                type="text"
                value={emailOtp}
                onChange={setEmailOtp}
                placeholder={`${emailOtpLength}-digit code`}
                maxLength={emailOtpLength}
              />
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  className="text-[color:var(--auction)] hover:underline disabled:text-muted-foreground"
                  disabled={emailResendIn > 0 || emailOtpPending}
                  onClick={sendEmailOtp}
                >
                  {emailOtpPending
                    ? "Sending…"
                    : emailResendIn > 0
                      ? "Resend in " + emailResendIn + "s"
                      : "Resend email"}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setEmailOtpSent(false)}
                >
                  Change
                </button>
              </div>
              <div className="mt-3">
                <PrimaryButton onClick={verifyEmail} disabled={emailOtp.length !== emailOtpLength}>
                  Verify email
                </PrimaryButton>
              </div>
            </>
          )}
        </div>
      </div>

      {error && <ErrorLine>{error}</ErrorLine>}
      {mobileVerified && emailVerified && (
        <>
          <PrimaryButton
            onClick={() =>
              update({
                mobile,
                email,
                otpVerified: true,
                completed: { ...state.completed, 1: true },
                step: 2,
              })
            }
          >
            Continue to Login Details
          </PrimaryButton>
          <button
            type="button"
            onClick={() => {
              clearRegistration();
              window.location.reload();
            }}
            className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Not you? Start a fresh registration
          </button>
        </>
      )}
      {!emailVerified && (
        <>
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
            Google verifies your email. Verify mobile OTP first, then you can continue directly to
            Company Information &amp; KYC.
          </p>
        </>
      )}
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
  const [mobile, setMobile] = useState(state.mobile);
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpPending, setMobileOtpPending] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitInFlight = useRef(false);

  const username = state.email || state.mobile;

  const strength = useMemo(() => scorePassword(password), [password]);
  const matches = password.length > 0 && password === confirm;
  const strong =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  const mobileVerified = state.mobileOtpVerified;
  const mobileValid = /^[6-9]\d{9}$/.test(mobile);
  const canContinue = matches && strong && mobileVerified;

  const sendMobileOtp = async () => {
    setMobileError(null);
    if (!mobileValid) {
      setMobileError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setMobileOtpPending(true);
    try {
      await api.requestOtp(mobile, "register");
      setMobileOtpSent(true);
      update({ mobile });
    } catch (cause) {
      setMobileError(cause instanceof Error ? cause.message : "Could not send mobile OTP.");
    } finally {
      setMobileOtpPending(false);
    }
  };

  const verifyMobileOtp = async () => {
    setMobileError(null);
    if (!/^\d{4}$/.test(mobileOtp)) {
      setMobileError("Enter the 4-digit mobile OTP.");
      return;
    }
    setMobileOtpPending(true);
    try {
      await api.verifyOtp(mobile, mobileOtp, "register");
      update({ mobile, mobileOtpVerified: true, otpVerified: state.emailOtpVerified });
      setMobileOtpSent(false);
      setMobileOtp("");
    } catch (cause) {
      setMobileError(cause instanceof Error ? cause.message : "Mobile OTP verification failed.");
    } finally {
      setMobileOtpPending(false);
    }
  };

  const submit = async () => {
    if (!canContinue || submitInFlight.current) return;
    submitInFlight.current = true;
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
      submitInFlight.current = false;
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
      {!mobileVerified && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Verify mobile number</span>
            <span className="text-xs text-muted-foreground">Required before registration</span>
          </div>
          <Field
            label="Mobile Number"
            type="tel"
            value={mobile}
            onChange={(value) => {
              setMobile(value);
              setMobileOtpSent(false);
              setMobileOtp("");
              update({ mobile: value, mobileOtpVerified: false, otpVerified: false });
            }}
            placeholder="10-digit mobile"
            maxLength={10}
          />
          {!mobileOtpSent ? (
            <div className="mt-3">
              <PrimaryButton onClick={sendMobileOtp} disabled={!mobileValid || mobileOtpPending}>
                {mobileOtpPending ? "Sending…" : "Send SMS OTP"}
              </PrimaryButton>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <Field
                label="SMS code"
                type="text"
                value={mobileOtp}
                onChange={setMobileOtp}
                placeholder="4-digit code"
                maxLength={4}
              />
              <PrimaryButton onClick={verifyMobileOtp} disabled={mobileOtpPending}>
                {mobileOtpPending ? "Verifying…" : "Verify mobile"}
              </PrimaryButton>
            </div>
          )}
          {mobileError && <ErrorLine>{mobileError}</ErrorLine>}
        </div>
      )}
      {mobileVerified && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          Mobile number verified
        </div>
      )}
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
    entityType: state.entityType,
    panNumber: state.panNumber,
    turnoverBand: state.turnoverBand,
    licenseNumber: state.licenseNumber,
    contactName: state.contactName,
    contactMobile: state.contactMobile,
    contactEmail: state.contactEmail,
    bankAccount: state.bankAccount,
    bankIfsc: state.bankIfsc,
    bankName: state.bankName,
    bankAccountHolderName: state.bankAccountHolderName,
    warehouseName: state.warehouseName,
    warehouseAddress: state.warehouseAddress,
    warehouseCity: state.warehouseCity,
    warehouseState: state.warehouseState,
    warehousePincode: state.warehousePincode,
    warehouseContact: state.warehouseContact,
  });
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [warehousePincodeLoading, setWarehousePincodeLoading] = useState(false);
  const [pincodeResolved, setPincodeResolved] = useState(
    Boolean(state.pincode && state.city && state.state),
  );
  const [warehousePincodeResolved, setWarehousePincodeResolved] = useState(
    Boolean(state.warehousePincode && state.warehouseCity && state.warehouseState),
  );
  const [gstLookup, setGstLookup] = useState<Record<string, any> | null>(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);
  const [gstAddressAutofilled, setGstAddressAutofilled] = useState(false);
  const gstDebounce = useRef<number | undefined>(undefined);
  const gstRequestId = useRef(0);
  const gstLookupValue = useRef<string | null>(null);
  const [bankLookup, setBankLookup] = useState<Record<string, any> | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankHolderName, setBankHolderName] = useState("");
  const bankDebounce = useRef<number | undefined>(undefined);
  const bankRequestId = useRef(0);

  useEffect(
    () => () => {
      if (gstDebounce.current !== undefined) window.clearTimeout(gstDebounce.current);
      if (bankDebounce.current !== undefined) window.clearTimeout(bankDebounce.current);
    },
    [],
  );

  const onGstinChange = (value: string) => {
    const gstin = value
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 15);
    if (gstDebounce.current !== undefined) window.clearTimeout(gstDebounce.current);
    const requestId = ++gstRequestId.current;
    setF((previous) => ({
      ...previous,
      gstNumber: gstin,
      companyName: "",
      entityType: "",
      panNumber: "",
      ...(gstAddressAutofilled ? { registeredAddress: "" } : {}),
    }));
    setGstLookup(null);
    setGstError(null);
    setGstAddressAutofilled(false);
    if (!isGstin(gstin)) {
      gstLookupValue.current = null;
      setGstLoading(false);
      return;
    }
    // Avoid duplicate provider calls when a controlled input emits the same
    // complete value more than once during hydration or browser autofill.
    if (gstLookupValue.current === gstin) return;

    setGstLoading(true);
    gstDebounce.current = window.setTimeout(async () => {
      if (gstLookupValue.current === gstin) return;
      gstLookupValue.current = gstin;
      try {
        const response = await api.verifyGstin(gstin);
        const details = response?.data ?? response;
        if (requestId !== gstRequestId.current) return;
        if (details?.gstin_status !== "GSTIN_VERIFIED") {
          throw new Error(details?.last_error_code || "This GSTIN could not be verified.");
        }
        const address = formatGstAddress(details.gst_registered_address);
        const gstPincode =
          gstAddressPincode(details.gst_registered_address) ||
          gstAddressPincode(details);
        setF((previous) => ({
          ...previous,
          gstNumber: String(details.gstin ?? gstin).toUpperCase(),
          companyName: String(details.legal_business_name ?? "").trim(),
          entityType: String(details.entity_type_label ?? details.entity_type ?? "").trim(),
          panNumber: derivePanFromGstin(String(details.gstin ?? gstin)),
          ...(address ? { registeredAddress: address } : {}),
        }));
        setGstLookup(details);
        setGstAddressAutofilled(Boolean(address));
        setGstError(null);
        if (isIndianPincode(gstPincode)) {
          void onPincodeChange(gstPincode);
        }
      } catch (cause) {
        if (requestId !== gstRequestId.current) return;
        setGstLookup(null);
        const error = cause as Error & { status?: number };
        setGstError(
          error.status === 429
            ? "GST verification is temporarily rate-limited. Please wait a moment and try again."
            : error instanceof Error
              ? error.message
              : "GSTIN verification failed.",
        );
      } finally {
        if (requestId === gstRequestId.current) setGstLoading(false);
      }
    }, 500);
  };

  const onBankChange = (key: "bankAccount" | "bankIfsc", value: string) => {
    const normalized =
      key === "bankAccount"
        ? value.replace(/\D/g, "").slice(0, 40)
        : value
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase()
            .slice(0, 11);
    const account = key === "bankAccount" ? normalized : f.bankAccount;
    const ifsc = key === "bankIfsc" ? normalized : f.bankIfsc;

    if (bankDebounce.current !== undefined) window.clearTimeout(bankDebounce.current);
    const requestId = ++bankRequestId.current;
    setF((previous) => ({
      ...previous,
      [key]: normalized,
      bankName: "",
      bankAccountHolderName: "",
    }));
    setBankLookup(null);
    setBankError(null);
    setBankHolderName("");

    if (!isBankAccount(account) || !isIfsc(ifsc)) {
      setBankLoading(false);
      return;
    }

    setBankLoading(true);
    bankDebounce.current = window.setTimeout(async () => {
      try {
        const ifscLookup = await api.lookupIfsc(ifsc).catch(() => null);
        const ifscDetails = ifscLookup?.data ?? ifscLookup;
        const lookupBankName = String(ifscDetails?.bank_name ?? "").trim();
        if (lookupBankName) {
          setF((previous) => ({ ...previous, bankName: lookupBankName }));
        }
        const response = await api.verifyBank({
          bank_account: account,
          bank_account_confirmation: account,
          ifsc,
          name: f.companyName || f.contactName || undefined,
          phone: f.contactMobile || state.mobile || undefined,
        });
        const details = response?.data ?? response;
        if (requestId !== bankRequestId.current) return;
        if (details?.bank_verification_status !== "BANK_VERIFIED") {
          throw new Error(details?.last_error_code || "This bank account could not be verified.");
        }
        const bankName = String(details.bank_name ?? lookupBankName).trim();
        const bankAccountHolderName = String(details.bank_account_holder_name ?? "").trim();
        setF((previous) => ({ ...previous, bankName, bankAccountHolderName }));
        setBankLookup(details);
        setBankHolderName(bankAccountHolderName);
        setBankError(null);
      } catch (cause) {
        if (requestId !== bankRequestId.current) return;
        setBankLookup(null);
        setBankHolderName("");
        setBankError(cause instanceof Error ? cause.message : "Bank verification failed.");
      } finally {
        if (requestId === bankRequestId.current) setBankLoading(false);
      }
    }, 500);
  };

  const onPincodeChange = async (value: string) => {
    const pincode = value.replace(/\D/g, "").slice(0, 6);
    setF((p) => ({ ...p, pincode, city: "", state: "" }));
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
    const pincode = value.replace(/\D/g, "").slice(0, 6);
    setF((p) => ({ ...p, warehousePincode: pincode, warehouseCity: "", warehouseState: "" }));
    setWarehousePincodeResolved(false);
    if (!isIndianPincode(pincode)) return;
    setWarehousePincodeLoading(true);
    try {
      const result = await api.lookupPincode(pincode);
      setF((p) => ({ ...p, warehouseCity: result.city, warehouseState: result.state }));
      setWarehousePincodeResolved(true);
    } catch {
      setError(
        "We could not resolve the warehouse PIN code. Please enter a valid Indian PIN code.",
      );
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
  const [registrationTerms, setRegistrationTerms] = useState<{ id: number; title: string; content: string }[]>([]);
  const [termsLoading, setTermsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setTermsLoading(true);
    api.getTermsConditions(undefined, state.role, "registration")
      .then((response: any) => {
        const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        if (active) {
          setRegistrationTerms(rows.filter((item: any) => item?.content).map((item: any) => ({
            id: Number(item.id),
            title: String(item.title ?? "Terms & Conditions"),
            content: String(item.content),
          })));
        }
      })
      .catch(() => { if (active) setRegistrationTerms([]); })
      .finally(() => { if (active) setTermsLoading(false); });
    return () => { active = false; };
  }, [state.role]);

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const toggleMaterial = (m: string) =>
    setMaterials((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  const allFilled =
    Object.entries(f)
      .filter(
        ([key]) =>
          !key.startsWith("warehouse") &&
          key !== "licenseNumber" &&
          key !== "bankName" &&
          key !== "bankAccountHolderName",
      )
      .every(([, value]) => value.trim().length > 0) &&
    gstFile &&
    panFile &&
    chequeFile &&
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
  const formComplete =
    allFilled &&
    isIndianPincode(f.pincode) &&
    pincodeResolved &&
    isIndianMobile(f.contactMobile) &&
    isEmail(f.contactEmail) &&
    isGstin(f.gstNumber) &&
    gstLookup?.gstin_status === "GSTIN_VERIFIED" &&
    f.entityType.trim().length > 0 &&
    isPan(f.panNumber) &&
    isBankAccount(f.bankAccount) &&
    isIfsc(f.bankIfsc) &&
    bankLookup?.bank_verification_status === "BANK_VERIFIED" &&
    (!warehouseRequired ||
      (warehouseComplete && isIndianPincode(f.warehousePincode) && warehousePincodeResolved));

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
        business_type: f.entityType,
        pan_number: f.panNumber,
        turnover_band: f.turnoverBand,
        license_number: f.licenseNumber,
        bank_name: f.bankName,
        account_number: f.bankAccount,
        ifsc_code: f.bankIfsc,
        account_holder_name: f.bankAccountHolderName || f.contactName,
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
      const documentUploads = [
        api.uploadVendorDocument(vendorCode, "gst", "GST Certificate", gstFile!),
        api.uploadVendorDocument(vendorCode, "pan", "PAN Card", panFile!),
        api.uploadVendorDocument(vendorCode, "bank", "Cancelled Cheque", chequeFile!),
      ];
      if (licenseFile) {
        documentUploads.push(
          api.uploadVendorDocument(vendorCode, "license", "License", licenseFile),
        );
      }
      await Promise.all(documentUploads);
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
          : "Complete the required fields. A business license or permit is optional; documents are used for one-time KYC verification."
      }
    >
      <div className="rounded-xl border border-[color:var(--auction)]/30 bg-[color:var(--auction)]/5 p-4">
        <Field
          label="GSTIN"
          value={f.gstNumber}
          onChange={onGstinChange}
          maxLength={15}
          placeholder="15-character GSTIN"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Enter the GSTIN first. Scrapify verifies it through the active backend provider and fills
          the legal business details below.
        </p>
        {gstLoading && (
          <p className="mt-2 text-xs font-medium text-[color:var(--auction)]">Verifying GSTIN…</p>
        )}
        {gstLookup?.gstin_status === "GSTIN_VERIFIED" && (
          <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4" /> GSTIN verified
            </div>
            <div className="mt-2 grid gap-1 text-emerald-900/80 sm:grid-cols-3">
              <span>Entity: {f.entityType || "Detected legal entity"}</span>
              <span>Status: {gstLookup.gst_registration_status || "Active"}</span>
              <span>Provider: {gstLookup.gstin_provider || "Configured provider"}</span>
            </div>
          </div>
        )}
        {gstError && <p className="mt-2 text-xs text-destructive">{gstError}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Company Name"
          value={f.companyName}
          onChange={set("companyName")}
          disabled
          readOnly
          placeholder="Filled from verified GSTIN"
        />
        <Field
          label="Detected Entity Type"
          value={f.entityType}
          onChange={set("entityType")}
          disabled
          readOnly
          placeholder="Filled from verified GSTIN"
        />
        <Field
          label="Registered Address"
          value={f.registeredAddress}
          onChange={set("registeredAddress")}
          disabled={gstAddressAutofilled}
          readOnly={gstAddressAutofilled}
        />
        <Field
          label="PAN Number (from GSTIN)"
          value={f.panNumber}
          onChange={set("panNumber")}
          disabled
          readOnly
          placeholder="Filled from verified GSTIN"
          required
        />
        <Field
          label="PIN Code"
          value={f.pincode}
          onChange={onPincodeChange}
          maxLength={6}
          placeholder={pincodeLoading ? "Looking up…" : "6-digit PIN code"}
          required
        />
        <Field
          label="City (from PIN API)"
          value={f.city}
          onChange={set("city")}
          disabled={pincodeLoading}
          readOnly
        />
        <Field
          label="State (from PIN API)"
          value={f.state}
          onChange={set("state")}
          disabled={pincodeLoading}
          readOnly
        />
        <label className="block text-sm font-medium text-foreground">
          Annual Scrap Turnover <span className="text-[color:var(--auction)]">*</span>
          <select
            value={f.turnoverBand}
            onChange={(event) => set("turnoverBand")(event.target.value)}
            className="mt-2 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            <option value="" disabled>Select annual turnover range</option>
            <option value="&lt; ₹5 Cr">&lt; ₹5 Cr</option>
            <option value="₹5 Cr - ₹25 Cr">₹5 Cr - ₹25 Cr</option>
            <option value="₹25 Cr - ₹100 Cr">₹25 Cr - ₹100 Cr</option>
            <option value="₹100 Cr+">₹100 Cr+</option>
          </select>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Select the business&apos;s expected annual scrap turnover range.
          </span>
        </label>
        <Field
          label="Business License / Permit Number (optional)"
          value={f.licenseNumber}
          onChange={set("licenseNumber")}
        />
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
            <Field
              label="Warehouse PIN code"
              value={f.warehousePincode}
              onChange={onWarehousePincodeChange}
              maxLength={6}
              placeholder={warehousePincodeLoading ? "Looking up…" : "6-digit PIN code"}
            />
            <div className="sm:col-span-2">
              <Field
                label="Warehouse address"
                value={f.warehouseAddress}
                onChange={set("warehouseAddress")}
              />
            </div>
            <Field
              label="Warehouse city (from PIN API)"
              value={f.warehouseCity}
              onChange={set("warehouseCity")}
              disabled={warehousePincodeLoading}
              readOnly
            />
            <Field
              label="Warehouse state (from PIN API)"
              value={f.warehouseState}
              onChange={set("warehouseState")}
              disabled={warehousePincodeLoading}
              readOnly
            />
            <Field
              label="Site contact name (optional)"
              value={f.warehouseContact}
              onChange={set("warehouseContact")}
            />
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
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field
            label="Account Number"
            value={f.bankAccount}
            onChange={(value) => onBankChange("bankAccount", value)}
            type="tel"
            maxLength={40}
          />
          <Field
            label="IFSC Code"
            value={f.bankIfsc}
            onChange={(value) => onBankChange("bankIfsc", value)}
            maxLength={11}
          />
          <Field label="Bank Name (from IFSC)" value={f.bankName} onChange={() => undefined} readOnly />
          <Field
            label="Account Holder Name (from provider)"
            value={f.bankAccountHolderName}
            onChange={() => undefined}
            readOnly
          />
        </div>
        {bankLoading && (
          <p className="mt-2 text-xs text-muted-foreground">Verifying bank account…</p>
        )}
        {bankLookup?.bank_verification_status === "BANK_VERIFIED" && (
          <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700">
            Bank account verified via {bankLookup.bank_provider || "Sandbox"}.
            {bankHolderName ? ` Account holder: ${bankHolderName}.` : ""}
            {!f.bankName ? " Bank name could not be resolved from this IFSC." : ""}
          </div>
        )}
        {bankError && <ErrorLine>{bankError}</ErrorLine>}
      </div>

      <div className="mt-2 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Upload documents
        </div>
        <DropTile
          label="Business License / Permit (optional)"
          file={licenseFile}
          onFile={setLicenseFile}
        />
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
          {termsLoading ? <p>Loading the latest terms…</p> : registrationTerms.length === 0 ? (
            <p>No active registration terms are configured. Please contact support.</p>
          ) : registrationTerms.map((term) => (
            <section key={term.id} className="mb-3 last:mb-0">
              <h3 className="font-semibold text-foreground">{term.title}</h3>
              <p className="mt-1 whitespace-pre-line">{term.content}</p>
            </section>
          ))}
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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [registrationFee, setRegistrationFee] = useState<number | null>(null);
  const [registrationFeeRequired, setRegistrationFeeRequired] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoPricing, setPromoPricing] = useState<any>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [bankDetails, setBankDetails] = useState<Record<string, string> | null>(null);
  const [verificationReference, setVerificationReference] = useState("");

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
      .then((config) => {
        setRegistrationFee(config.vendor_registration_fee);
        setRegistrationFeeRequired(config.web_registration_fee_required !== false);
        setBankDetails((config as any).registration_bank_details ?? null);
      })
      .catch(() => setRegistrationFee(null));
  }, []);

  const rows: [string, string, WizardStep][] = [
    ["Mobile", state.mobile, 1],
    ["Email", state.email, 1],
    ["Company Name", state.companyName, 3],
    ["Registered Address", state.registeredAddress, 3],
    ["GSTIN", state.gstNumber, 3],
    ["Entity Type", state.entityType, 3],
    ["PAN Number", state.panNumber, 3],
    ["Business License / Permit Number", state.licenseNumber || "—", 3],
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
          ["Warehouse City / State", `${state.warehouseCity}, ${state.warehouseState}`, 3] as [
            string,
            string,
            WizardStep,
          ],
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
          <PrimaryButton
            onClick={() => {
              if (registrationFeeRequired) {
                setPhase("payment");
                return;
              }
              update({
                paymentSubmitted: true,
                vendorStatus: "pending",
                completed: { ...state.completed, 4: true },
              });
              setPhase("pending");
            }}
          >
            {registrationFeeRequired ? "Proceed to Payment" : "Submit for Review"} <ChevronRight className="h-4 w-4" />
          </PrimaryButton>
        </div>
      </FormShell>
    );
  }

  if (phase === "payment") {
    return (
      <FormShell
        title="Registration payment"
        subtitle={
          state.role === "seller"
            ? "A one-time registration fee submits your seller verification application."
            : "A one-time registration fee activates your buyer account."
        }
      >
        <div className="rounded-xl border border-[color:var(--auction)] bg-[color:var(--auction)]/5 p-4">
          <div className="font-display text-lg font-extrabold text-[color:var(--navy)]">Bank transfer registration fee</div>
          <p className="mt-1 text-sm text-muted-foreground">Transfer the amount below and upload a screenshot of the successful payment. Transaction ID is optional.</p>
        </div>

        {bankDetails && <div className="grid gap-2 rounded-xl border border-border bg-card p-4 text-sm sm:grid-cols-2">
          {[["Bank", bankDetails.bank_name], ["Account name", bankDetails.account_name], ["Account number", bankDetails.account_number], ["IFSC", bankDetails.ifsc], ["Branch", bankDetails.branch], ["Address", bankDetails.address]].map(([label, value]) => <div key={label}><span className="block text-xs font-semibold uppercase text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{value}</span></div>)}
        </div>}

        <div className="rounded-xl bg-muted p-4 text-sm text-foreground">
          Amount payable:{" "}
          <b className="font-display">
            {promoPricing?.payable_amount != null
              ? `₹${Number(promoPricing.payable_amount).toLocaleString("en-IN")}`
              : registrationFee == null
                ? "Loading…"
                : `₹${registrationFee.toLocaleString("en-IN")}`}
          </b>{" "}
          (one-time, non-refundable KYC processing fee).
        </div>

        <div className="space-y-2">
          <Field label="Promo code (optional)" value={promoCode} onChange={(value) => { setPromoCode(value.toUpperCase()); setPromoPricing(null); }} placeholder="Enter offer code" />
          <SecondaryButton
            onClick={async () => {
              if (!promoCode.trim() || !state.vendorCode) return;
              setBusy(true);
              setError(null);
              try {
                const response = await api.quoteVendorPayment(state.vendorCode, promoCode.trim());
                setPromoPricing(response.pricing ?? response.data?.pricing ?? response);
              } catch (cause) {
                setPromoPricing(null);
                setError(cause instanceof Error ? cause.message : "Promo code could not be applied.");
              } finally {
                setBusy(false);
              }
            }}
            disabled={!promoCode.trim() || !state.vendorCode || busy}
          >Apply promo code</SecondaryButton>
          {promoPricing?.discount_amount > 0 && <p className="text-xs font-semibold text-emerald-700">Discount applied: ₹{Number(promoPricing.discount_amount).toLocaleString("en-IN")}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Transaction ID (optional)" value={transactionId} onChange={setTransactionId} placeholder="Enter UTR/reference if available" />
          <label className="block text-sm font-medium text-foreground">Payment screenshot / proof *<input type="file" accept="image/*,.pdf" onChange={(event) => setPaymentProof(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-lg border border-border bg-background p-2 text-sm" /></label>
        </div>

        {error && <ErrorLine>{error}</ErrorLine>}

        <div className="flex items-center gap-3">
          <SecondaryButton onClick={() => setPhase("review")}>
            <ChevronLeft className="h-4 w-4" /> Back
          </SecondaryButton>
          <PrimaryButton
            onClick={async () => {
              if (!state.vendorCode || registrationFee == null || !paymentProof) { setError("Please upload the successful payment screenshot before submitting."); return; }
              setBusy(true);
              setError(null);
              try {
                await api.submitManualRegistrationPayment(state.vendorCode, paymentProof, transactionId, promoCode);
                update({
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
            disabled={registrationFee == null || busy || !paymentProof}
          >
            {busy ? "Submitting payment proof…" : "Submit payment proof"}
          </PrimaryButton>
        </div>
      </FormShell>
    );
  }

  if (phase === "pending") {
    return (
      <FormShell
        title="Submitted — pending admin review"
        subtitle="Your profile is under review. Verification normally takes 24–48 hours because our team checks every submitted detail. Please be patient; our team will contact you if anything else is required."
      >
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <div className="font-display text-base font-bold text-amber-900">Status: Pending</div>
          <p className="mt-1 text-amber-900/80">
            You are still logged in. You can browse the marketplace and open your profile while we review your application. Bidding, orders, and other protected actions unlock automatically after approval.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="font-semibold text-foreground">Have you received a payment verification reference?</p>
          <p className="mt-1 text-sm text-muted-foreground">Paste the reference from our email to confirm your payment.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input value={verificationReference} onChange={(event) => setVerificationReference(event.target.value.toUpperCase())} placeholder="SCRAPIFY-PAY-XXXXXXXXXX" className="min-w-[260px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <SecondaryButton disabled={!state.vendorCode || !verificationReference.trim() || busy} onClick={async () => { setBusy(true); setError(null); try { await api.verifyRegistrationPaymentReference(state.vendorCode, verificationReference); update({ paymentSubmitted: true }); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Reference could not be verified."); } finally { setBusy(false); } }}>Verify payment</SecondaryButton>
          </div>
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
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="ml-1 text-[color:var(--auction)]">*</span>}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        readOnly={readOnly}
        required={required}
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
