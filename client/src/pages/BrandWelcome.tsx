import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

type TierKey = "nano" | "micro" | "macro" | "celeb";

const TIERS: Array<{
  key: TierKey;
  label: string;
  range: string;
  cpm: string;
}> = [
  { key: "nano", label: "Nano", range: "1K – 10K", cpm: "₹500 – ₹2K" },
  { key: "micro", label: "Micro", range: "10K – 100K", cpm: "₹2K – ₹15K" },
  { key: "macro", label: "Macro", range: "100K – 1M", cpm: "₹15K – ₹1L" },
  { key: "celeb", label: "Celebrity", range: "1M+", cpm: "₹1L+" },
];

export default function BrandWelcome() {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Welcome — Kalakaarian"; }, []);

  const { data: counts = {} } = useQuery<Record<string, number>>({
    queryKey: ["tier-counts"],
    queryFn: () => api.getTierCounts(),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,168,67,0.08),transparent_50%)] pointer-events-none" />
      <div className="w-full max-w-6xl relative">
        <div className="text-center mb-16 fade-up">
          <p className="section-eyebrow mb-5">Influence.Market</p>
          <h1 className="section-title text-5xl md:text-6xl mb-5">
            Find Your Perfect Creators
          </h1>
          <p className="text-chalk-dim text-base md:text-lg font-light max-w-xl mx-auto">
            Browse by tier to match your campaign goals and budget.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {TIERS.map((tier, idx) => {
            const inventory = counts[tier.key] ?? 0;
            return (
              <button
                key={tier.key}
                onClick={() => navigate(`/marketplace?tier=${tier.key}`)}
                style={{ animationDelay: `${idx * 60}ms` }}
                className="group premium-card text-left p-7 flex flex-col gap-6 fade-up"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="section-title text-3xl">{tier.label}</h2>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-chalk-faint">
                    {inventory} {inventory === 1 ? "creator" : "creators"}
                  </span>
                </div>

                <div className="space-y-4 flex-1">
                  <Stat label="Reach Range" value={tier.range} />
                  <Stat label="Avg CPM" value={tier.cpm} />
                  <Stat label="Inventory" value={`${inventory.toLocaleString("en-IN")} live`} />
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/5 text-sm text-gold transition-all group-hover:gap-3">
                  <span className="font-light tracking-wide">Explore {tier.label}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button onClick={() => navigate("/marketplace")} className="btn-outline px-10 py-3.5 text-sm">
            View All Creators
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] tracking-[0.18em] uppercase text-chalk-faint">{label}</span>
      <span className="text-sm font-medium text-chalk">{value}</span>
    </div>
  );
}
