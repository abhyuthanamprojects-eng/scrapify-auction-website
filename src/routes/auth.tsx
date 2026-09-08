import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Gavel } from "lucide-react";
import { api } from "@/lib/api-client";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign In — Scrapify Auctions" },
      {
        name: "description",
        content:
          "Sign in to access Scrapify Auctions sourcing, live forward/reverse auctions, and vendor portal.",
      },
      { property: "og:title", content: "Sign In — Scrapify Auctions" },
      {
        property: "og:description",
        content: "Access buyer bidding rooms or the enterprise console.",
      },
    ],
  }),
  component: AuthPage,
});

type Role = "buyer" | "seller";

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [role, setRole] = useState<Role>("buyer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const workspaceFor = (user: any) => {
    const role = String(user?.role ?? user?.roles?.[0] ?? "").toLowerCase();
    if (role === "seller") return "/console" as const;
    if (role === "buyer") return "/portal" as const;
    return null;
  };

  const target = (redirect: string | null, workspace: "/console" | "/portal") => {
    if (!redirect || !redirect.startsWith("/")) return workspace;

    const allowedPrefixes =
      workspace === "/console"
        ? ["/console", "/seller", "/lots"]
        : [
            "/portal",
            "/dashboard",
            "/lots",
            "/live",
            "/results",
            "/my-bids",
            "/wallet",
            "/terms",
            "/rfx",
            "/inspection",
            "/emd",
            "/auction-register",
            "/awards",
            "/award",
            "/fallback-offer",
            "/payable-summary",
            "/refund-tracker",
            "/emd-ledger",
          ];

    return allowedPrefixes.some(
      (prefix) => redirect === prefix || redirect.startsWith(`${prefix}/`),
    )
      ? redirect
      : workspace;
  };

  useEffect(() => {
    const token = api.getToken();
    if (!token) return;

    let active = true;
    void api.me().then((response) => {
      const workspace = workspaceFor(response.user ?? response.data?.user ?? response.data);
      if (active && workspace) {
        navigate({ to: target(search.redirect ?? null, workspace) });
      }
    }).catch(() => {
      // A stale public token or an admin token must not enter a public route.
      api.setToken(null);
    });

    return () => {
      active = false;
    };
  }, [navigate, search.redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const response = await api.register({ name: fullName, email, phone, password, role });
        const workspace = workspaceFor(response.user ?? response.data?.user ?? response.data);
        if (!workspace) {
          api.setToken(null);
          throw new Error("This account cannot use the public workspace.");
        }
        window.dispatchEvent(new CustomEvent("scrapify:auth"));
        navigate({ to: target(search.redirect ?? null, workspace) });
        return;
      } else {
        const response = await api.login(email, password);
        const workspace = workspaceFor(response.user ?? response.data?.user ?? response.data);
        if (!workspace) {
          api.setToken(null);
          throw new Error(
            "This account must sign in through the Admin Portal."
          );
        }
        window.dispatchEvent(new CustomEvent("scrapify:auth"));
        navigate({ to: target(search.redirect ?? null, workspace) });
        return;
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setError(
        code === "ADMIN_LOGIN_NOT_ALLOWED_HERE"
          ? "This is an internal account. Use the separate Admin Portal to sign in."
          : err instanceof Error
            ? err.message
            : "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--navy)] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white">
            <img src="/scrapify-auction-app-icon.png" alt="Scrapify Auctions" className="h-full w-full object-contain" />
          </span>
          Scrapify<span className="text-[color:var(--gold-soft)]">Auction</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <h1 className="font-display text-2xl font-extrabold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {mode === "signin"
              ? "Sign in to bid or manage your lots."
              : "Choose buyer to bid, or seller to list scrap."}
          </p>

          {mode === "signup" && (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {(["buyer", "seller"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                    role === r
                      ? "border-[color:var(--auction)] bg-[color:var(--auction)]/10"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  <div className="font-display text-sm font-bold capitalize">{r}</div>
                  <div className="text-xs text-white/60">
                    {r === "buyer"
                      ? "Bid on live scrap lots"
                      : "List and sell scrap"}
                  </div>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            {mode === "signup" && (
              <Field
                label="Full name"
                type="text"
                value={fullName}
                onChange={setFullName}
                required
              />
            )}
            {mode === "signup" && (
              <Field label="Mobile" type="tel" value={phone} onChange={setPhone} required />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} required />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              required
              minLength={6}
            />

            {error && (
              <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-[color:var(--auction)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.7)] transition-colors hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-white/60">
            {mode === "signin" ? (
              <>
                New to Scrapify?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[color:var(--auction)] hover:underline"
                >
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="font-semibold text-[color:var(--auction)] hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {mode === "signin" && (
            <div className="mt-4 border-t border-white/10 pt-4 text-center text-xs text-white/50">
              Internal staff?{" "}
              <a
                href="https://admin.scrapifyauctions.com/login"
                className="font-semibold text-[color:var(--gold-soft)] hover:underline"
              >
                Open Admin Portal
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-white/60">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[color:var(--auction)]"
      />
    </label>
  );
}
