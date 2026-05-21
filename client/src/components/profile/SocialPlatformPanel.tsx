import { useEffect, useMemo, useState } from "react";
import { Instagram, Youtube, Check, Loader2 } from "lucide-react";
import { SocialStats } from "@/lib/api";

type Platform = "instagram" | "youtube";

interface Props {
  socialHandles: { instagram?: string; youtube?: string };
  pricing: Record<string, number> | undefined;
  socialStats: SocialStats | undefined | null;
  followerCount: number;
  inCart: boolean;
  initiallyHighlight?: boolean;
  onAddToCart: (totalPrice: number, platforms: Platform[]) => void | Promise<void>;
  isCelebTier?: boolean;
}

const fmtNum = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

const fmtPrice = (n: number): string => `₹${n.toLocaleString("en-IN")}`;

// Per-platform campaign cost. The creator delivers BOTH content formats for a
// campaign, so the platform cost is the SUM: Instagram = Reel + Story,
// YouTube = Video + Shorts. Values are margin-inclusive (5% applied server-side).
function pricePerPlatform(pricing: Record<string, number> | undefined): Record<Platform, number> {
  const p = pricing ?? {};
  const ig = (p.reel || 0) + (p.story || 0);
  const yt = (p.video || 0) + (p.shorts || 0);
  return { instagram: ig, youtube: yt };
}

export function SocialPlatformPanel({
  socialHandles, pricing, socialStats, followerCount,
  inCart, initiallyHighlight, onAddToCart, isCelebTier,
}: Props) {
  const connected: Platform[] = useMemo(() => {
    const out: Platform[] = [];
    if (socialHandles?.instagram) out.push("instagram");
    if (socialHandles?.youtube) out.push("youtube");
    return out;
  }, [socialHandles]);

  const [selected, setSelected] = useState<Set<Platform>>(() => new Set(connected));
  const [submitting, setSubmitting] = useState(false);
  const connectedKey = connected.join(",");

  useEffect(() => {
    setSelected(new Set(connectedKey ? connectedKey.split(",") as Platform[] : []));
  }, [connectedKey]);

  const prices = pricePerPlatform(pricing);
  const total = Array.from(selected).reduce((s, p) => s + (prices[p] || 0), 0);

  const toggle = (p: Platform) => {
    if (!connected.includes(p)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selected.size === 0 || total <= 0) return;
    setSubmitting(true);
    try { await onAddToCart(total, Array.from(selected)); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PlatformCard
          platform="instagram"
          handle={socialHandles?.instagram}
          followers={socialStats?.instagram?.followers ?? followerCount}
          engagementRate={socialStats?.instagram?.engagementRate}
          price={prices.instagram}
          checked={selected.has("instagram")}
          highlight={initiallyHighlight && selected.has("instagram")}
          onToggle={() => toggle("instagram")}
        />
        <PlatformCard
          platform="youtube"
          handle={socialHandles?.youtube}
          followers={socialStats?.youtube?.subscribers ?? 0}
          engagementRate={undefined}
          price={prices.youtube}
          checked={selected.has("youtube")}
          highlight={initiallyHighlight && selected.has("youtube")}
          onToggle={() => toggle("youtube")}
        />
      </div>

      {!isCelebTier && connected.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-chalk-dim">
            {total > 0 ? (
              <span className="font-bold text-chalk">{fmtPrice(total)}</span>
            ) : (
              <span className="text-chalk-faint text-xs">Select a platform above</span>
            )}
          </div>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0 || total <= 0 || submitting}
            className="purple-pill px-6 py-2.5 text-xs font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-purple"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
              inCart ? <Check className="w-3.5 h-3.5" /> : null}
            {inCart ? "Selected" : "Select Kalakaar"}
          </button>
        </div>
      )}
    </div>
  );
}

interface PCProps {
  platform: Platform;
  handle?: string;
  followers: number;
  engagementRate?: number;
  price: number;
  checked: boolean;
  highlight?: boolean;
  onToggle: () => void;
}

function PlatformCard({ platform, handle, followers, engagementRate, price, checked, highlight, onToggle }: PCProps) {
  const isConnected = !!handle;
  const Icon = platform === "instagram" ? Instagram : Youtube;
  const label = platform === "instagram" ? "Instagram" : "YouTube";
  const tone = platform === "instagram" ? "text-pink-400" : "text-red-500";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!isConnected}
      className={`group text-left rounded-2xl border p-5 transition-all duration-300 ${
        !isConnected
          ? "border-white/5 bg-charcoal/20 opacity-50 cursor-not-allowed"
          : checked
            ? `border-gold/50 bg-gradient-to-br from-gold/10 to-charcoal/40 shadow-glow-gold ${highlight ? "ring-2 ring-gold/40 ring-offset-2 ring-offset-obsidian" : ""}`
            : "premium-card !rounded-2xl"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
            checked ? "bg-gold border-gold" : "border-white/30"
          }`}>
            {checked && <Check className="w-3 h-3 text-obsidian" />}
          </span>
          <Icon className={`w-4 h-4 ${tone}`} />
          <span className="text-sm font-medium text-chalk">{label}</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
          isConnected ? "bg-green-500/15 text-green-400" : "bg-white/5 text-chalk-faint"
        }`}>
          {isConnected ? "Connected" : "Not linked"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Followers" value={followers ? fmtNum(followers) : "—"} />
        <Stat label="ER%" value={engagementRate != null ? `${engagementRate}%` : "—"} />
        <Stat
          label={platform === "instagram" ? "Reel + Story" : "Video + Shorts"}
          value={price > 0 ? fmtPrice(price) : "—"}
        />
      </div>

      {handle && (
        <p className="text-[11px] text-chalk-dim mt-3 truncate">@{handle.replace("@", "")}</p>
      )}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bento-card-dark rounded-lg p-2 text-center">
      <p className="text-[10px] text-chalk-faint mb-0.5">{label}</p>
      <p className="text-xs font-bold text-chalk leading-none">{value}</p>
    </div>
  );
}
