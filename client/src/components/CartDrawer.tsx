import { useState, useEffect } from "react";
import { X, ShoppingCart, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CartItem } from "@/lib/store";
import { api } from "@/lib/api";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  total: number;
  campaignName: string;
  campaignId: string;
  campaignDescription: string;
  setCampaign: (name: string, id?: string) => void;
  setCampaignDescription: (desc: string) => void;
}

function formatPrice(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function CartDrawer({ open, onClose, items, removeFromCart, clearCart, total, campaignName, campaignId, campaignDescription, setCampaign, setCampaignDescription }: CartDrawerProps) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Array<{ id: string; title: string }>>([]);
  useEffect(() => {
    if (open) {
      api.getCampaigns().then(setCampaigns).catch(() => setCampaigns([]));
    }
  }, [open]);

  const handleSelectCampaign = (id: string, title: string) => {
    setCampaign(title, id);
  };

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-charcoal border-l border-white/10 flex flex-col shadow-premium-lg fade-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20">
              <ShoppingCart className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-chalk">Cart</p>
              <p className="text-[11px] text-chalk-dim">{items.length} {items.length === 1 ? "creator" : "creators"}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Campaign Selector */}
        <div className="border-b border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Campaign:</span>
          </div>
          {campaignName ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-secondary px-3 py-2 rounded-md">
                <span className="text-sm font-medium">{campaignName}</span>
                <button onClick={() => setCampaign("", "")} className="text-xs text-muted-foreground hover:text-destructive">Change</button>
              </div>
              <textarea
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder="Campaign description (optional)"
                rows={2}
                className="w-full px-3 py-2 text-xs border border-border rounded-md bg-card focus:outline-none focus:border-primary resize-none"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {campaigns.length > 0 && (
                <select
                  onChange={(e) => {
                    const camp = campaigns.find(c => c.id === e.target.value);
                    if (camp) handleSelectCampaign(camp.id, camp.title);
                  }}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-card focus:outline-none focus:border-primary"
                >
                  <option value="">Select existing campaign...</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 && (
            <p className="font-mono text-xs text-muted-foreground text-center py-8">NO ASSETS IN CART</p>
          )}
          {items.map((item) => (
            <div key={item.influencer.id} className="border border-border p-3 flex items-center gap-3">
              <img src={item.influencer.photo} alt={item.influencer.name} className="w-10 h-10 object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{item.influencer.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{item.influencer.handle}</p>
              </div>
              <span className="font-mono text-sm text-terminal font-bold">
                {item.influencer.price ? formatPrice(item.influencer.price) : "—"}
              </span>
              <button onClick={() => removeFromCart(item.influencer.id)} className="p-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 p-5 space-y-4 bg-obsidian/40">
          {campaignName && (
            <div className="text-xs text-chalk-dim">
              Campaign: <span className="font-medium text-chalk">{campaignName}</span>
            </div>
          )}
          <div className="space-y-2">
            <Row label="Subtotal" value={formatPrice(total)} />
            <Row label="Platform Fee (8%)" value={formatPrice(Math.round(total * 0.08))} muted />
            <Row label="GST (18%)" value={formatPrice(Math.round(total * 1.08 * 0.18))} muted />
            <div className="divider-soft my-2" />
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] tracking-[0.18em] uppercase text-chalk-faint">Grand Total</span>
              <span className="stat-numeral text-2xl text-gold">{formatPrice(Math.round(total * 1.08 * 1.18))}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="purple-pill w-full py-3 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-purple"
          >
            Checkout →
          </button>
          <button onClick={clearCart} className="btn-outline w-full py-2 text-xs">
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[11px] tracking-wider uppercase text-chalk-faint">{label}</span>
      <span className={`text-sm ${muted ? "text-chalk-dim" : "text-chalk"}`}>{value}</span>
    </div>
  );
}
