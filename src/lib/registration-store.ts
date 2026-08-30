// Client-side mock store for the bidder registration wizard.
// All state persists in localStorage — no backend calls.

export type WizardStep = 1 | 2 | 3 | 4;

export type VendorStatus = "none" | "pending" | "approved" | "rejected" | "suspended";

export const MATERIALS = [
  "Ferrous",
  "Non-Ferrous",
  "E-Waste",
  "Paper",
  "Plastic",
  "Rubber",
] as const;

export type RegistrationState = {
  step: WizardStep;
  completed: Record<WizardStep, boolean>;
  // Step 1
  mobile: string;
  email: string;
  otpVerified: boolean;
  googleLinked: boolean;
  // Step 2
  password: string;
  confirmPassword: string;
  // Step 3
  companyName: string;
  registeredAddress: string;
  gstNumber: string;
  panNumber: string;
  licenseNumber: string;
  materialInterest: string[];
  contactName: string;
  contactMobile: string;
  contactEmail: string;
  bankAccount: string;
  bankIfsc: string;
  bankName: string;
  gstFile: string | null;
  panFile: string | null;
  chequeFile: string | null;
  licenseFile: string | null;
  termsAccepted: boolean;
  // Step 4
  paymentMethod: "RTGS" | "NEFT" | "UPI" | null;
  paymentSubmitted: boolean;
  approved: boolean;
  vendorStatus: VendorStatus;
  statusReason: string;
};

const KEY = "scrapify.registration.v1";

export const emptyRegistration = (): RegistrationState => ({
  step: 1,
  completed: { 1: false, 2: false, 3: false, 4: false },
  mobile: "",
  email: "",
  otpVerified: false,
  googleLinked: false,
  password: "",
  confirmPassword: "",
  companyName: "",
  registeredAddress: "",
  gstNumber: "",
  panNumber: "",
  licenseNumber: "",
  materialInterest: [],
  contactName: "",
  contactMobile: "",
  contactEmail: "",
  bankAccount: "",
  bankIfsc: "",
  bankName: "",
  gstFile: null,
  panFile: null,
  chequeFile: null,
  licenseFile: null,
  termsAccepted: false,
  paymentMethod: null,
  paymentSubmitted: false,
  approved: false,
  vendorStatus: "none",
  statusReason: "",
});

export function loadRegistration(): RegistrationState {
  if (typeof window === "undefined") return emptyRegistration();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyRegistration();
    return { ...emptyRegistration(), ...JSON.parse(raw) };
  } catch {
    return emptyRegistration();
  }
}

export function saveRegistration(state: RegistrationState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("scrapify:registration"));
}

export function clearRegistration() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("scrapify:registration"));
}

// Interested (pre-login) list — per lot id
const INTEREST_KEY = "scrapify.interested.v1";

export function getInterested(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(INTEREST_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function toggleInterested(lotId: string): boolean {
  const list = getInterested();
  const has = list.includes(lotId);
  const next = has ? list.filter((x) => x !== lotId) : [...list, lotId];
  window.localStorage.setItem(INTEREST_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("scrapify:interested"));
  return !has;
}

export function isApprovedBidder(): boolean {
  return loadRegistration().vendorStatus === "approved";
}

export function isRegistrationPending(): boolean {
  const s = loadRegistration();
  return s.paymentSubmitted && !s.approved;
}