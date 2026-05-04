import { useState, useEffect } from "react";
import { X, ShoppingCart, Plus, FileText } from "lucide-react";
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
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export function CartDrawer({ open, onClose, items, removeFromCart, clearCart, total, campaignName, campaignId, campaignDescription, setCampaign, setCampaignDescription }: CartDrawerProps) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Array<{ id: string; title: string }>>([]);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  useEffect(() => {
    if (open) {
      api.getCampaigns().then(setCampaigns).catch(() => setCampaigns([]));
    }
  }, [open]);

  const handleSelectCampaign = (id: string, title: string) => {
    setCampaign(title, id);
    setShowNewCampaign(false);
  };

  const handleCreateCampaign = () => {
    if (newCampaignName.trim()) {
      setCampaign(newCampaignName.trim(), "");
      setNewCampaignName("");
      setShowNewCampaign(false);
    }
  };

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-terminal" />
            <span className="font-mono text-sm uppercase tracking-widest text-foreground">Cart ({items.length})</span>
          </div>
          <button onClick={onClose} className="p-1 border border-border hover:border-terminal">
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
          ) : showNewCampaign ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter campaign name"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-card focus:outline-none focus:border-primary"
                onKeyDown={(e) => e.key === "Enter" && handleCreateCampaign()}
              />
              <div className="flex gap-2">
                <button onClick={handleCreateCampaign} className="flex-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  Create
                </button>
                <button onClick={() => setShowNewCampaign(false)} className="flex-1 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-secondary">
                  Cancel
                </button>
              </div>
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
              <button
                onClick={() => setShowNewCampaign(true)}
                className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs border border-dashed border-border rounded-md hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="w-3 h-3" /> Create New Campaign
              </button>
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
        <div className="border-t border-border p-4 space-y-3">
          {campaignName && (
            <div className="text-xs text-muted-foreground">
              Campaign: <span className="font-medium text-foreground">{campaignName}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Subtotal</span>
              <span className="font-mono text-sm text-foreground">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Platform Fee (8%)</span>
              <span className="font-mono text-sm text-muted-foreground">{formatPrice(Math.round(total * 0.08))}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Grand Total</span>
              <span className="font-mono text-lg text-terminal font-bold">{formatPrice(Math.round(total * 1.08))}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full border border-terminal py-2 font-mono text-xs uppercase tracking-widest text-terminal hover:bg-terminal hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Checkout →
          </button>
          <button
            onClick={clearCart}
            className="w-full border border-border py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}
