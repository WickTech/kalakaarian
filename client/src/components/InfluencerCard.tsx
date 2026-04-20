import { ShoppingCart, Check, MapPin, Instagram, Youtube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Influencer } from "@/lib/store";

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

const tierColors: Record<string, string> = {
  nano: "bg-nano",
  micro: "bg-micro",
  mid: "bg-micro",
  macro: "bg-macro",
  mega: "bg-macro",
};

interface InfluencerCardProps {
  influencer: Influencer;
  isInCart: boolean;
  onAddToCart: (i: Influencer) => void;
}

export function InfluencerCard({ influencer, isInCart, onAddToCart }: InfluencerCardProps) {
  const navigate = useNavigate();
  const hasLocation = influencer.city && influencer.city.trim() !== "";
  const hasNiche = influencer.genre && influencer.genre.trim() !== "";

  return (
    <div 
      onClick={() => navigate(`/influencer/${influencer.id}`)}
      className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all group animate-scale-in cursor-pointer"
    >
      <div className="relative p-4 pb-0">
        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium text-primary-foreground capitalize ${tierColors[influencer.tier] || 'bg-secondary'}`}>
          {influencer.tier}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={influencer.photo || DEFAULT_AVATAR}
              alt={influencer.name}
              className="w-14 h-14 rounded-full border-2 border-border object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
            />
            {influencer.isOnline && (
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" title="Online" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{influencer.name}</h3>
            {influencer.handle && (
              <p className="text-xs text-muted-foreground">{influencer.handle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 text-center">
        <div>
          <p className="font-bold text-sm">{influencer.followers ? formatFollowers(influencer.followers) : "0"}</p>
          <p className="text-[10px] text-muted-foreground">Followers</p>
        </div>
        <div>
          <p className="font-bold text-sm">{influencer.avgViews || 0}</p>
          <p className="text-[10px] text-muted-foreground">Avg Views</p>
        </div>
        <div>
          <p className="font-bold text-sm">{influencer.avgLikes || 0}</p>
          <p className="text-[10px] text-muted-foreground">Avg Likes</p>
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {(influencer.platform === "instagram" || 
            (Array.isArray(influencer.platform) && influencer.platform.includes("instagram"))) && (
            <Instagram className="w-4 h-4 text-accent" />
          )}
          {(influencer.platform === "youtube" || 
            (Array.isArray(influencer.platform) && influencer.platform.includes("youtube"))) && (
            <Youtube className="w-4 h-4 text-destructive" />
          )}
          {hasNiche && (
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
              {influencer.genre}
            </span>
          )}
        </div>
        <button
          onClick={() => onAddToCart(influencer)}
          disabled={isInCart}
          className={`p-2 rounded-md transition-colors ${
            isInCart
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:border-primary hover:text-primary"
          }`}
        >
          {isInCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
        </button>
      </div>

      {hasLocation && (
        <div className="px-4 pb-3 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{influencer.city}</span>
        </div>
      )}
    </div>
  );
}

function formatFollowers(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}
