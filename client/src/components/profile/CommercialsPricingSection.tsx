import { Instagram, Youtube, Lock } from "lucide-react";

interface CommercialsPricingProps {
  pricing: Record<string, number>;
  onChange: (key: string, value: number) => void;
  locked?: boolean;
  unlockDate?: Date | null;
}

function PriceInput({
  label, fieldKey, value, onChange, disabled,
}: { label: string; fieldKey: string; value: number; onChange: (k: string, v: number) => void; disabled?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs text-chalk-dim">{label}</label>
      <div className={`flex items-center gap-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 ${disabled ? "opacity-60" : ""}`}>
        <span className="px-3 py-2.5 text-sm text-chalk-dim border-r border-white/10 shrink-0">₹</span>
        <input
          type="number"
          min={0}
          value={value || ""}
          placeholder="0"
          disabled={disabled}
          onChange={(e) => onChange(fieldKey, Number(e.target.value) || 0)}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent text-chalk outline-none disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

export function CommercialsPricingSection({ pricing, onChange, locked, unlockDate }: CommercialsPricingProps) {
  return (
    <div className="space-y-4">
      {locked && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-200">Commercials locked for 6 months</p>
            <p className="text-xs text-amber-100/80 mt-0.5">
              Your rates are visible to you and brands but cannot be edited
              {unlockDate ? ` until ${unlockDate.toLocaleDateString('en-IN')}` : ''}.
            </p>
          </div>
        </div>
      )}
      {/* Instagram */}
      <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Instagram className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-semibold text-chalk">Instagram</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PriceInput label="Reels" fieldKey="reel" value={pricing.reel ?? 0} onChange={onChange} disabled={locked} />
          <PriceInput label="Stories" fieldKey="story" value={pricing.story ?? 0} onChange={onChange} disabled={locked} />
        </div>
      </div>

      {/* YouTube */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Youtube className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-chalk">YouTube</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PriceInput label="Video" fieldKey="video" value={pricing.video ?? 0} onChange={onChange} disabled={locked} />
          <PriceInput label="Shorts" fieldKey="shorts" value={pricing.shorts ?? 0} onChange={onChange} disabled={locked} />
        </div>
      </div>

    </div>
  );
}
