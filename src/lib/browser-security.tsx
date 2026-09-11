import type { ReactNode } from "react";

export type SecurityAssessment = {
  allowed: boolean;
  browser: string;
  device: "desktop" | "tablet" | "mobile-phone" | "unknown";
};

export function assessBrowser(): SecurityAssessment {
  if (typeof navigator === "undefined") return { allowed: true, browser: "server", device: "unknown" };
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();
  const touch = navigator.maxTouchPoints || 0;
  const ipad = ua.includes("ipad") || (platform.includes("mac") && touch > 1);
  const phone = ua.includes("iphone") || ua.includes("ipod") || (ua.includes("android") && ua.includes("mobile"));
  const browser = ua.includes("edg/") ? "Microsoft Edge" : ua.includes("firefox/") ? "Mozilla Firefox" : ua.includes("crios/") || ua.includes("chrome/") ? "Google Chrome" : ua.includes("safari/") && !ua.includes("chrome/") ? "Apple Safari" : "Unsupported browser";
  const device = phone ? "mobile-phone" : ipad || (ua.includes("android") && !ua.includes("mobile")) ? "tablet" : browser === "Unsupported browser" ? "unknown" : "desktop";
  return { allowed: browser !== "Unsupported browser" && !phone, browser, device };
}

export function SecurityGate({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const assessment = assessBrowser();
  const blocked = !assessment.allowed || (admin && assessment.device !== "desktop" && assessment.device !== "tablet");
  if (!blocked) return <>{children}</>;
  const mobile = assessment.device === "mobile-phone" || (admin && assessment.device === "tablet");
  return <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center"><div className="max-w-lg"><h1 className="text-2xl font-bold text-foreground">{mobile ? "Mobile access blocked" : "Browser not supported"}</h1><p className="mt-3 text-muted-foreground">{mobile ? "This platform is not available on mobile browsers. Please use the Scrapify mobile application." : "For security and compatibility, use Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari."}</p></div></div>;
}

export function initBrowserSecurity() {
  if (typeof window === "undefined") return () => {};
  const style = document.createElement("style");
  style.textContent = `@media print { .security-protected-content { display:none !important } .security-print-warning { display:block !important } } .security-print-warning{display:none}`;
  document.head.appendChild(style);
  const onVisibility = () => document.documentElement.classList.toggle("security-page-hidden", document.visibilityState !== "visible");
  document.addEventListener("visibilitychange", onVisibility);
  return () => { document.removeEventListener("visibilitychange", onVisibility); style.remove(); };
}
