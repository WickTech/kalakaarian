import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LandingProps {
  dark: boolean;
  toggleTheme: () => void;
  cartCount: number;
  onCartOpen: () => void;
}

const tiers = [
  {
    key: "nano",
    label: "NANO",
    range: "2K — 30K REACH",
    cpm: "AVG CPM: ₹12",
    desc: "INVENTORY: 30 ASSETS",
    color: "border-terminal",
  },
  {
    key: "micro",
    label: "MICRO",
    range: "31K — 250K REACH",
    cpm: "AVG CPM: ₹8",
    desc: "INVENTORY: 30 ASSETS",
    color: "border-terminal",
  },
  {
    key: "macro",
    label: "MACRO",
    range: "251K — 5M REACH",
    cpm: "AVG CPM: ₹5",
    desc: "INVENTORY: 30 ASSETS",
    color: "border-terminal",
  },
  {
    key: "celebrity",
    label: "CELEBRITY",
    range: "5M+ REACH",
    cpm: "PRICING: CONTACT",
    desc: "INVENTORY: 10 ASSETS",
    color: "border-destructive",
  },
];

export default function Landing({ dark, toggleTheme, cartCount, onCartOpen }: LandingProps) {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-sm uppercase tracking-[0.3em] font-bold">
            <span className="text-terminal">■</span> INFLUENCE.MARKET
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle dark={dark} toggle={toggleTheme} />
          <button onClick={onCartOpen} className="border border-border p-2 hover:border-terminal transition-colors relative">
            <span className="font-mono text-xs">CART</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-terminal text-primary-foreground font-mono text-[10px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2x2 Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2">
        {tiers.map((tier) => (
          <div
            key={tier.key}
            onClick={() => navigate(`/marketplace?tier=${tier.key}`)}
            className="border border-border flex flex-col items-center justify-center p-8 cursor-pointer group hover:bg-card transition-all relative overflow-hidden"
          >
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-terminal transition-colors" />
            <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-muted-foreground mb-2">
              {tier.range}
            </span>
            <h2 className="font-mono text-3xl md:text-5xl font-bold tracking-tight mb-4 group-hover:text-terminal transition-colors">
              {tier.label}
            </h2>
            <p className="font-mono text-xs text-muted-foreground mb-1">{tier.cpm}</p>
            <p className="font-mono text-[10px] text-muted-foreground mb-6">{tier.desc}</p>
            <button className="border border-border px-6 py-2 font-mono text-xs uppercase tracking-widest group-hover:border-terminal group-hover:text-terminal transition-colors">
              EXPLORE TIER →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
