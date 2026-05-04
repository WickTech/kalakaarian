import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, FileText } from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import { api } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";

function formatPrice(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, campaignName, campaignId, campaignDescription, clearCart, total } = useCartContext();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const fee = Math.round(total * 0.08);
  const grand = total + fee;

  const handlePay = async () => {
    setProcessing(true);
    setError("");
    try {
      const order = await api.cartCheckout({ campaignId: campaignId || undefined, campaignDescription: campaignDescription || undefined });
      if (!order.orderId || !order.keyId) {
        clearCart();
        navigate("/brand/dashboard");
        return;
      }
      await openRazorpayCheckout({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        name: "Kalakaarian — Cart Checkout",
        onSuccess: async () => { clearCart(); navigate("/brand/dashboard"); },
        onDismiss: () => {},
      });
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-border hover:border-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-foreground">Checkout</span>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-5">
        {/* Campaign Section */}
        <div className="border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mb-3">
            <FileText className="w-4 h-4" />
            Campaign
          </div>
          {campaignName ? (
            <>
              <p className="font-semibold text-foreground">{campaignName}</p>
              {campaignDescription && (
                <p className="text-sm text-muted-foreground">{campaignDescription}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">No campaign selected</p>
          )}
        </div>

        {/* Creators */}
        <div className="border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
            <ShoppingCart className="w-4 h-4" /> Selected Creators ({items.length})
          </div>
          {items.map((item) => (
            <div key={item.influencer.id} className="flex items-center gap-3">
              <img src={item.influencer.photo} alt={item.influencer.name} className="w-9 h-9 rounded-full object-cover bg-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.influencer.name}</p>
                <p className="text-xs text-muted-foreground">{item.influencer.handle || "—"}</p>
              </div>
              <span className="text-sm font-mono font-bold text-primary">
                {item.influencer.price ? formatPrice(item.influencer.price) : "TBD"}
              </span>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="border border-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(total)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Platform Fee (8%)</span><span>{formatPrice(fee)}</span></div>
          <div className="h-px bg-border my-1" />
          <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">{formatPrice(grand)}</span></div>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          onClick={handlePay}
          disabled={items.length === 0 || processing}
          className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {processing ? "Processing..." : `Pay ${formatPrice(grand)}`}
        </button>
      </div>
    </div>
  );
}
