import { X, ShoppingCart } from "lucide-react";
import { CartItem } from "@/lib/store";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  total: number;
}

function formatPrice(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export function CartDrawer({ open, onClose, items, removeFromCart, clearCart, total }: CartDrawerProps) {
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
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Total</span>
            <span className="font-mono text-lg text-terminal font-bold">{formatPrice(total)}</span>
          </div>
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
