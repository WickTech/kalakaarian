import { useState } from "react";
import { ShoppingCart, Check, Users } from "lucide-react";
import { Influencer } from "@/lib/store";

interface InfluencerCardProps {
  influencer: Influencer;
  isInCart: boolean;
  onAddToCart: (i: Influencer) => void;
}

function formatNum(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatPrice(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export function InfluencerCard({ influencer, isInCart, onAddToCart }: InfluencerCardProps) {
  const [hoverFollowers, setHoverFollowers] = useState(false);

  return (
    <div className="border border-border bg-card group hover:border-terminal transition-colors">
      {/* Photo */}
      <div className="aspect-square overflow-hidden relative">
        <img
          src={influencer.photo}
          alt={influencer.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 right-2">
          <span className="font-mono text-[10px] uppercase tracking-widest bg-background/90 border border-border px-2 py-0.5 text-foreground">
            {influencer.genre}
          </span>
        </div>
        <div className="absolute bottom-2 left-2">
          <span className="font-mono text-[10px] uppercase tracking-widest bg-background/90 border border-border px-2 py-0.5 text-muted-foreground">
            {influencer.city}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold leading-tight">{influencer.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{influencer.handle}</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="grid grid-cols-3 border border-border divide-x divide-border">
          <div className="p-2 text-center">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Reach</p>
            <p
              className="font-mono text-sm font-bold relative cursor-pointer"
              onMouseEnter={() => setHoverFollowers(true)}
              onMouseLeave={() => setHoverFollowers(false)}
            >
              {hoverFollowers ? (
                <span className="text-neon-red">{formatNum(influencer.activeFollowers)}</span>
              ) : (
                <span>{formatNum(influencer.followers)}</span>
              )}
            </p>
          </div>
          <div className="p-2 text-center">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Avg Views</p>
            <p className="font-mono text-sm font-bold">{formatNum(influencer.avgViews)}</p>
          </div>
          <div className="p-2 text-center">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Avg Likes</p>
            <p className="font-mono text-sm font-bold">{formatNum(influencer.avgLikes)}</p>
          </div>
        </div>

        {/* Gender & Fake */}
        <div className="grid grid-cols-2 gap-1">
          <div className="border border-border p-1.5">
            <p className="font-mono text-[9px] uppercase text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> Gender
            </p>
            <p className="font-mono text-[10px]">
              M:{influencer.genderSplit.male}% F:{influencer.genderSplit.female}%
            </p>
          </div>
          <div className="border border-border p-1.5">
            <p className="font-mono text-[9px] uppercase text-muted-foreground">Fake</p>
            <p className="font-mono text-[10px] text-neon-red font-bold">
              {((influencer.fakeFollowers / influencer.followers) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Price & Cart */}
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="font-mono text-lg font-bold text-terminal">
            {influencer.price ? formatPrice(influencer.price) : "GET IN TOUCH"}
          </span>
          {influencer.price !== null && (
            <button
              onClick={() => onAddToCart(influencer)}
              disabled={isInCart}
              className={`p-2 border transition-colors ${
                isInCart
                  ? "border-terminal bg-terminal text-primary-foreground"
                  : "border-border hover:border-terminal hover:text-terminal"
              }`}
            >
              {isInCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
