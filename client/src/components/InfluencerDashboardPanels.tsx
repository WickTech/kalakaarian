import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { keys } from '@/lib/queryKeys';

export { WalletTab } from "./WalletTab";

const DURATIONS = [
  { key: "monthly", label: "Monthly",  silver: 119, gold: 199 },
  { key: "6mo",     label: "6 Months", silver: 99,  gold: 149 },
  { key: "12mo",    label: "12 Months", silver: 79,  gold: 99  },
] as const;
type Duration = typeof DURATIONS[number]["key"];

const SILVER_FEATURES = [
  "Priority campaign access before free creators",
  "Higher visibility in brand search results",
  "Faster profile approval & onboarding",
  "Dedicated campaign notifications on WhatsApp/Email",
  "Limited AI-powered profile optimization tools",
  "Monthly analytics & performance insights",
  "Access to verified brand campaigns only",
  "Early access to new platform features",
];

const GOLD_FEATURES = [
  "Top priority access to high-paying campaigns",
  "Premium profile ranking across the platform",
  "Dedicated creator success manager/support",
  "Lowest platform commission rates",
  "AI-powered brand match recommendations",
  "Fast-track payouts & payment priority",
  "Exclusive invite-only campaigns & premium brands",
  "Advanced analytics dashboard with audience insights",
  "Personal branding consultation/content strategy sessions",
  "Gold verified badge with premium credibility boost",
];

interface MembershipProps { membershipStatus: { tier: string; active?: boolean } | null; }
export function MembershipTab({ membershipStatus }: MembershipProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [accepted, setAccepted] = useState(false);
  const [duration, setDuration] = useState<Duration>("monthly");

  const current = DURATIONS.find((d) => d.key === duration)!;

  const upgrade = async (plan: "gold" | "silver") => {
    try {
      const order = await api.createMembershipOrder(plan);
      if (!order.orderId || !order.keyId) {
        await api.purchaseMembership(plan);
        qc.invalidateQueries({ queryKey: keys.membership.status() });
        toast({ title: "Success", description: `${plan} membership activated!` }); return;
      }
      await openRazorpayCheckout({
        orderId: order.orderId, amount: order.amount, currency: order.currency, keyId: order.keyId,
        name: `Kalakaarian ${plan.charAt(0).toUpperCase() + plan.slice(1)} Membership`,
        prefill: { name: user?.name, email: user?.email },
        onSuccess: async (paymentId, orderId, signature) => {
          await api.purchaseMembership(plan, { razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: signature });
          qc.invalidateQueries({ queryKey: keys.membership.status() });
          toast({ title: "Payment successful!", description: `${plan} membership activated.` });
        },
        onDismiss: () => toast({ title: "Payment cancelled" }),
      });
    } catch { toast({ title: "Error", description: "Failed to process payment", variant: "destructive" }); }
  };

  const plans = [
    { plan: "silver" as const, price: current.silver, features: SILVER_FEATURES, label: "Silver Club" },
    { plan: "gold"   as const, price: current.gold,   features: GOLD_FEATURES,   label: "Gold Club" },
  ];

  return (
    <div className="space-y-4">
      <div className="bento-card p-4 border border-purple-500/20 bg-purple-500/5 rounded-xl">
        <p className="text-xs text-chalk-dim mb-2 font-semibold">Membership Terms</p>
        <p className="text-xs text-chalk-faint mb-3">Membership fees are non-refundable. By activating, you agree to Kalakaarian's <a href="/terms" target="_blank" className="text-purple-400 hover:underline">Terms & Conditions</a>.</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="accent-purple-600" />
          <span className="text-xs text-chalk-dim">I agree to the membership terms</span>
        </label>
      </div>

      <div className="flex gap-2 flex-wrap">
        {DURATIONS.map((d) => (
          <button
            key={d.key}
            onClick={() => setDuration(d.key)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              duration === d.key
                ? "bg-purple-600 text-white"
                : "border border-white/10 text-chalk-dim hover:text-chalk"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {plans.map(({ plan, price, features, label }) => (
        <div key={plan} className={`rounded-xl p-6 membership-${plan}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-chalk text-lg">{label}</h3>
            <span className="text-xs text-chalk-dim">₹{price}/month</span>
          </div>
          <ul className="space-y-1.5 mb-4">
            {features.map((f) => (
              <li key={f} className="text-sm text-chalk-dim flex items-start gap-2">
                <span className={plan === "gold" ? "text-gold" : "text-blue-400"}>✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => upgrade(plan)}
            disabled={!accepted || (membershipStatus?.tier === plan && !!membershipStatus?.active)}
            className={`w-full py-2.5 text-sm rounded-full font-bold disabled:opacity-40 disabled:cursor-not-allowed ${plan === "gold" ? "gold-pill" : "purple-pill"}`}
          >
            {membershipStatus?.tier === plan && membershipStatus?.active
              ? "✓ Active"
              : `Activate ${label} — ₹${price}/mo`}
          </button>
        </div>
      ))}
    </div>
  );
}

