import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/business-verification")({
  component: BusinessVerificationPage,
});

function BusinessVerificationPage() {
  const [status, setStatus] = useState<any>({});
  const [identityStatus, setIdentityStatus] = useState<any>(null);
  const [gstin, setGstin] = useState("");
  const [account, setAccount] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [identityLoading, setIdentityLoading] = useState(false);

  const load = () =>
    api
      .getBusinessVerification()
      .then((r) => {
        const data = r.data ?? r;
        setStatus(data);
        if (data.identity_verification) {
          setIdentityStatus(data.identity_verification);
        }
      })
      .catch((e) => setMessage(e.message));

  const loadIdentityStatus = useCallback(() => {
    api
      .getIdentityVerificationStatus()
      .then((r) => setIdentityStatus(r.data ?? r))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    loadIdentityStatus();
    handleDigiLockerReturn();
  }, []);

  const handleDigiLockerReturn = async () => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get("state");
    const code = params.get("code");
    const error = params.get("error");

    if (!state) return;

    window.history.replaceState({}, "", window.location.pathname);

    setIdentityLoading(true);
    setMessage("");
    try {
      const r = await api.handleDigiLockerCallback(
        state,
        code || undefined,
        error || undefined,
      );
      setIdentityStatus(r.data ?? r);
      if ((r.data ?? r).status === "VERIFIED") {
        setMessage("Identity verified successfully through DigiLocker.");
      }
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "DigiLocker verification could not be completed.",
      );
      loadIdentityStatus();
    } finally {
      setIdentityLoading(false);
    }
  };

  const startDigiLocker = async () => {
    setIdentityLoading(true);
    setMessage("");
    try {
      const callbackUrl = `${window.location.origin}/business-verification`;
      const r = await api.initiateDigiLocker(callbackUrl);

      if (r.already_verified) {
        setIdentityStatus(r.data ?? r);
        setMessage("Identity is already verified.");
        return;
      }

      const authUrl = (r.data ?? r).authorization_url;
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Could not start DigiLocker verification.",
      );
    } finally {
      setIdentityLoading(false);
    }
  };

  const retryDigiLocker = async () => {
    setIdentityLoading(true);
    setMessage("");
    try {
      const callbackUrl = `${window.location.origin}/business-verification`;
      const r = await api.retryDigiLocker(callbackUrl);

      if (r.already_verified) {
        setIdentityStatus(r.data ?? r);
        return;
      }

      const authUrl = (r.data ?? r).authorization_url;
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Could not restart DigiLocker verification.",
      );
    } finally {
      setIdentityLoading(false);
    }
  };

  const submitGstin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const r = await api.verifyGstin(gstin, name);
      setStatus(r.data ?? r);
      setMessage("GSTIN verification submitted.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "GSTIN verification failed.",
      );
    }
  };

  const submitBank = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const r = await api.verifyBank({
        bank_account: account,
        bank_account_confirmation: confirm,
        ifsc,
        name,
      });
      setStatus(r.data ?? r);
      setMessage("Bank verification submitted.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Bank verification failed.",
      );
    }
  };

  const idStatus = identityStatus?.status ?? "NOT_STARTED";
  const isIdentityVerified = idStatus === "VERIFIED";
  const canRetryIdentity =
    idStatus === "CANCELLED" ||
    idStatus === "FAILED" ||
    idStatus === "EXPIRED" ||
    idStatus === "NOT_STARTED";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl font-extrabold">
          Business verification
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          GSTIN, bank, and identity checks run through the platform
          verification service. Never enter credentials or upload secrets here.
        </p>

        {message && (
          <p className="mt-4 rounded-md border p-3 text-sm">{message}</p>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* GSTIN */}
          <section className="card-soft p-5">
            <h2 className="font-display text-lg font-bold">GSTIN</h2>
            <p className="mt-2 text-sm">
              Status: <b>{status.gstin_status ?? "NOT_STARTED"}</b>
            </p>
            <form onSubmit={submitGstin} className="mt-4 space-y-3">
              <Input
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="15-character GSTIN"
                maxLength={15}
                required
              />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Business name (optional)"
              />
              <Button type="submit">Verify GSTIN</Button>
            </form>
          </section>

          {/* Bank */}
          <section className="card-soft p-5">
            <h2 className="font-display text-lg font-bold">Bank account</h2>
            <p className="mt-2 text-sm">
              Status:{" "}
              <b>{status.bank_verification_status ?? "NOT_STARTED"}</b> ·{" "}
              {status.bank_account_masked ?? "No account stored"}
            </p>
            <form onSubmit={submitBank} className="mt-4 space-y-3">
              <Input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Bank account number"
                required
              />
              <Input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm bank account number"
                required
              />
              <Input
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value)}
                placeholder="IFSC"
                maxLength={11}
                required
              />
              <Button type="submit">Verify bank account</Button>
            </form>
          </section>
        </div>

        {/* Identity Verification — DigiLocker */}
        <section className="mt-6 card-soft p-5">
          <h2 className="font-display text-lg font-bold">
            Identity Verification
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verify your identity securely through DigiLocker.
          </p>

          {isIdentityVerified ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">
                  ✓
                </span>
                <span className="font-semibold text-green-700">
                  DigiLocker Verified
                </span>
              </div>
              {identityStatus.identity_name && (
                <p className="text-sm">
                  Name: <b>{identityStatus.identity_name}</b>
                </p>
              )}
              {identityStatus.aadhaar_masked && (
                <p className="text-sm">
                  Aadhaar: <b>{identityStatus.aadhaar_masked}</b>
                </p>
              )}
              {identityStatus.verified_at && (
                <p className="text-xs text-muted-foreground">
                  Verified:{" "}
                  {new Date(identityStatus.verified_at).toLocaleDateString(
                    "en-IN",
                    { day: "numeric", month: "short", year: "numeric" },
                  )}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm">
                Status: <b>{idStatus}</b>
              </p>
              {identityStatus?.failure_code && (
                <p className="text-sm text-red-600">
                  {identityStatus.failure_code === "DIGILOCKER_AUTH_CANCELLED"
                    ? "You cancelled the DigiLocker authorization. You can try again."
                    : identityStatus.failure_code ===
                        "DIGILOCKER_ACCESS_DENIED"
                      ? "DigiLocker access was denied. You can try again."
                      : identityStatus.failure_code ===
                          "DIGILOCKER_SESSION_EXPIRED"
                        ? "The verification session expired. Please start again."
                        : "Verification could not be completed. Please try again."}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                You will be redirected to DigiLocker to authorize identity
                verification. Scrapify does not collect your Aadhaar OTP or
                DigiLocker credentials.
              </p>
              {canRetryIdentity ? (
                <Button
                  onClick={
                    idStatus === "NOT_STARTED"
                      ? startDigiLocker
                      : retryDigiLocker
                  }
                  disabled={identityLoading}
                >
                  {identityLoading
                    ? "Connecting..."
                    : idStatus === "NOT_STARTED"
                      ? "Verify with DigiLocker"
                      : "Try Again"}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Verification is in progress. Please complete the DigiLocker
                  authorization.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Overall Status */}
        <div className="mt-6 card-soft p-5">
          <h2 className="font-display text-lg font-bold">
            Overall KYB status
          </h2>
          <p className="mt-2 text-2xl font-extrabold">
            {status.overall_kyb_status ?? "NOT_STARTED"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Bank account details are displayed only in masked form. If a
            provider result needs review, the Admin team can record an
            auditable decision.
          </p>
        </div>
      </main>
    </div>
  );
}
