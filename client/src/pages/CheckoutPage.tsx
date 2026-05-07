import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, FileText, CheckCircle2 } from "lucide-react";
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
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [paid, setPaid] = useState(false);
  const fee = Math.round(total * 0.08);
  const grand = total + fee;

  const handlePay = async () => {
    setProcessing(true);
    setError("");
    try {
      const order = await api.cartCheckout({ campaignId: campaignId || undefined, campaignDescription: campaignDescription || undefined });
      if (!order.orderId || !order.keyId) {
        clearCart();
        setPaid(true);
        return;
      }
      await openRazorpayCheckout({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        name: "Kalakaarian — Cart Checkout",
        onSuccess: async () => { clearCart(); setPaid(true); },
        onDismiss: () => {},
      });
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (paid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground text-sm">Your campaign is live and creators have been notified.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate("/marketplace")}
              className="w-full py-3 rounded-xl border border-border font-medium hover:bg-muted transition-colors">
              Explore More Creators
            </button>
            <button onClick={() => navigate("/brand/dashboard", { state: { tab: "campaigns" } })}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              Your Campaigns →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 space-y-5">
        <h1 className="font-semibold text-lg">Checkout</h1>
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

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAgreed}
            onChange={(e) => setTermsAgreed(e.target.checked)}
            className="mt-0.5 accent-purple-600 w-4 h-4 flex-shrink-0"
          />
          <span className="text-sm text-muted-foreground">
            I agree to the{" "}
            <a href="/terms" target="_blank" className="text-purple-600 hover:underline">
              campaign execution terms
            </a>{" "}
            (24–48h delivery, escrow payment, auto-approval policy)
          </span>
        </label>

        <button
          onClick={handlePay}
          disabled={items.length === 0 || processing || !termsAgreed}
          className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {processing ? "Processing..." : `Pay ${formatPrice(grand)}`}
        </button>
      </div>
    </div>
  );
}
