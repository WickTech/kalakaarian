import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

type TierKey = "nano" | "micro" | "macro" | "celeb";

const TIERS: Array<{ key: TierKey; label: string; range: string }> = [
  { key: "nano", label: "Nano", range: "1K – 10K" },
  { key: "micro", label: "Micro", range: "10K – 100K" },
  { key: "macro", label: "Macro", range: "100K – 1M" },
  { key: "celeb", label: "Celebrity", range: "1M+" },
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
          <p className="text-chalk text-xl md:text-2xl font-bold max-w-xl mx-auto">
            Browse by tier to match your campaign goals and budget.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {TIERS.map((tier, idx) => {
            const inventory = counts[tier.key] ?? 0;
            return (
              <button
                key={tier.key}
                onClick={() => navigate(`/marketplace?tier=${tier.key}`)}
                style={{ animationDelay: `${idx * 60}ms` }}
                className="group premium-card text-left p-8 flex flex-col gap-6 fade-up w-full"
              >
                <h2 className="text-5xl font-bold text-chalk text-center w-full">{tier.label}</h2>

                <div className="flex-1 flex flex-col items-center justify-center gap-5">
                  <div className="text-center">
                    <p className="text-xs tracking-[0.18em] uppercase text-chalk-faint mb-1.5">Followers</p>
                    <p className="text-2xl font-bold text-chalk">{tier.range}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs tracking-[0.18em] uppercase text-chalk-faint mb-1.5">Kalakaars</p>
                    <p className="text-2xl font-bold text-chalk">{inventory > 0 ? inventory : "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/5 text-sm text-gold transition-all group-hover:gap-3">
                  <span className="font-light tracking-wide text-chalk">Explore {tier.label}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 text-gold" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button onClick={() => navigate("/marketplace")} className="btn-outline px-10 py-3.5 text-sm">
            View All Kalakaars
          </button>
        </div>
      </div>
    </div>
  );
}
