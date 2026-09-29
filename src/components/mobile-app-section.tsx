import { useEffect, useState } from "react";
import { Smartphone, Bell, Shield, Zap, TrendingUp, QrCode } from "lucide-react";
import { api } from "@/lib/api-client";

interface MobileAppConfig {
  app_store_url: string;
  play_store_url: string;
  app_tagline: string;
  app_description: string;
}

export function MobileAppSection() {
  const [config, setConfig] = useState<MobileAppConfig>({
    app_store_url: "",
    play_store_url: "",
    app_tagline: "Bid on the go — anytime, anywhere",
    app_description:
      "Browse live auctions, place bids in real-time, track orders, and manage your auction portfolio — all from your mobile device.",
  });

  useEffect(() => {
    api
      .getPlatformConfig()
      .then((res) => {
        const ma = (res as any)?.mobile_app;
        if (ma) {
          setConfig((prev) => ({
            app_store_url: ma.app_store_url || prev.app_store_url,
            play_store_url: ma.play_store_url || prev.play_store_url,
            app_tagline: ma.app_tagline || prev.app_tagline,
            app_description: ma.app_description || prev.app_description,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const features = [
    { icon: TrendingUp, label: "Live bidding" },
    { icon: Bell, label: "Instant alerts" },
    { icon: Shield, label: "Secure payments" },
    { icon: Zap, label: "Quick registration" },
    { icon: Smartphone, label: "Offline access" },
    { icon: QrCode, label: "QR scanning" },
  ];

  const hasStoreLinks = config.app_store_url || config.play_store_url;

  return (
    <section className="relative overflow-hidden border-t border-border bg-[color:var(--navy)]">

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Content */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--auction)]/30 bg-[color:var(--auction)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--auction)]">
              <Smartphone className="h-3.5 w-3.5" />
              Scrapify Mobile App
            </span>

            <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
              {config.app_tagline.includes("—")
                ? <>
                    {config.app_tagline.split("—")[0]}—
                    <br className="hidden sm:block" />
                    <span className="text-[color:var(--auction)]">{config.app_tagline.split("—")[1].trim()}</span>
                  </>
                : <>{config.app_tagline}</>
              }
            </h2>

            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/60">
              {config.app_description}
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 backdrop-blur"
                >
                  <f.icon className="h-5 w-5 text-[color:var(--auction)]" />
                  <span className="text-center text-[10px] font-medium leading-tight text-white/50">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            {hasStoreLinks && (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {config.app_store_url && (
                  <a
                    href={config.app_store_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Download on the</div>
                      <div className="text-base font-bold leading-tight text-gray-900">App Store</div>
                    </div>
                  </a>
                )}
                {config.play_store_url && (
                  <a
                    href={config.play_store_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.3 2.3-8.636-8.632z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Get it on</div>
                      <div className="text-base font-bold leading-tight text-gray-900">Google Play</div>
                    </div>
                  </a>
                )}
              </div>
            )}

            {!hasStoreLinks && (
              <div className="mt-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--auction)]/20 bg-[color:var(--auction)]/5 px-4 py-2 text-sm font-medium text-[color:var(--auction)]">
                  <Bell className="h-4 w-4" />
                  Coming soon on App Store &amp; Google Play
                </span>
              </div>
            )}
          </div>

          {/* Right: Phone mockup */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-8 rounded-full bg-[color:var(--auction)]/10 blur-3xl" />

              {/* Phone frame */}
              <div className="relative mx-auto w-[280px] rounded-[3rem] border-[6px] border-gray-700 bg-gray-900 p-2 shadow-2xl sm:w-[300px]">
                {/* Notch */}
                <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-gray-900" />

                {/* Screen content */}
                <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-b from-[color:var(--navy)] to-[color:var(--navy)]/90">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pb-1 pt-8 text-[10px] font-semibold text-white/70">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-[2px]">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-[10px] rounded-sm bg-white/70" style={{ width: 3 }} />
                        ))}
                      </div>
                      <svg className="h-3.5 w-3.5 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 4h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 2 0v1h6V3a1 1 0 0 1 2 0v1z" opacity="0.3"/>
                      </svg>
                    </div>
                  </div>

                  {/* App header */}
                  <div className="flex items-center gap-2 px-5 py-3">
                    <img
                      src="/scrapify-auction-app-icon.png"
                      alt="Scrapify"
                      className="h-8 w-8 rounded-lg"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Scrapify Auctions</div>
                      <div className="text-[9px] text-white/40">Enterprise Auctions</div>
                    </div>
                  </div>

                  {/* Mock auction cards */}
                  <div className="space-y-2.5 px-4 pb-6">
                    {[
                      { title: "HMS Ferrous Scrap", bid: "₹42,00,000", status: "LIVE", color: "#EF4444" },
                      { title: "Copper Wire Lot", bid: "₹18,50,000", status: "Upcoming", color: "#F97316" },
                      { title: "IT Equipment Bulk", bid: "₹6,25,000", status: "Open", color: "#22C55E" },
                    ].map((card) => (
                      <div
                        key={card.title}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 backdrop-blur"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-[11px] font-semibold text-white/90">
                              {card.title}
                            </div>
                            <div className="mt-0.5 text-[10px] text-white/40">Forward Auction</div>
                          </div>
                          <span
                            className="rounded-full px-2 py-0.5 text-[8px] font-bold text-white"
                            style={{ backgroundColor: card.color }}
                          >
                            {card.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div>
                            <div className="text-[8px] uppercase text-white/30">Current Bid</div>
                            <div className="text-sm font-extrabold text-[color:var(--auction)]">
                              {card.bid}
                            </div>
                          </div>
                          <button className="rounded-lg bg-[color:var(--auction)] px-3 py-1 text-[9px] font-bold text-white">
                            Bid Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom nav mockup */}
                  <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                    <div className="flex justify-around">
                      {["Home", "Auctions", "Bids", "Profile"].map((tab, i) => (
                        <div key={tab} className="flex flex-col items-center gap-0.5">
                          <div
                            className={`h-4 w-4 rounded-md ${i === 1 ? "bg-[color:var(--auction)]" : "bg-white/10"}`}
                          />
                          <span
                            className={`text-[8px] font-medium ${i === 1 ? "text-[color:var(--auction)]" : "text-white/30"}`}
                          >
                            {tab}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -left-4 top-16 rounded-xl border border-white/10 bg-[color:var(--navy)] px-3 py-2 shadow-xl backdrop-blur sm:-left-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                    <Shield className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white">KYC Verified</div>
                    <div className="text-[8px] text-white/40">Secure bidding</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-2 bottom-28 rounded-xl border border-white/10 bg-[color:var(--navy)] px-3 py-2 shadow-xl backdrop-blur sm:-right-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--auction)]/20">
                    <TrendingUp className="h-4 w-4 text-[color:var(--auction)]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white">Live Alerts</div>
                    <div className="text-[8px] text-white/40">Never miss a bid</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
