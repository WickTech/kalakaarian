import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TIERS = [
  {
    key: "nano",
    label: "Nano",
    cssClass: "tier-nano",
    range: "1K – 10K followers",
    desc: "Hyper-engaged communities, authentic voice, niche audiences.",
  },
  {
    key: "micro",
    label: "Micro",
    cssClass: "tier-micro",
    range: "10K – 100K followers",
    desc: "Niche authority with strong community trust and cost-effective reach.",
  },
  {
    key: "macro",
    label: "Macro",
    cssClass: "tier-macro",
    range: "100K – 1M followers",
    desc: "Wide reach with professional content and brand-safe delivery.",
  },
  {
    key: "celeb",
    label: "Celebrity",
    cssClass: "tier-celebrity",
    range: "1M+ followers",
    desc: "Maximum exposure with verified stars and premium audiences.",
  },
] as const;

export default function BrandWelcome() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Welcome — Kalakaarian";
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Find Your Perfect Creators
          </h1>
          <p className="text-muted-foreground text-lg">
            Browse by tier to match your campaign goals and budget.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {TIERS.map((tier) => (
            <button
              key={tier.key}
              onClick={() => navigate(`/marketplace?tier=${tier.key}`)}
              className="group text-left rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <span
                className={`self-start text-xs font-bold px-3 py-1 rounded-full ${tier.cssClass}`}
              >
                {tier.label.toUpperCase()}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{tier.range}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {tier.desc}
                </p>
              </div>
              <span className="text-xs font-medium text-primary group-hover:underline">
                Explore {tier.label} →
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => navigate("/marketplace")}
            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            View All Creators
          </button>
        </div>
      </div>
    </div>
  );
}
