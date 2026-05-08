import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, InfluencerProfile } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { ExternalLink } from "lucide-react";

export { WalletTab } from "./WalletTab";

type Platform = "instagram" | "youtube";

export function UploadTab() {
  const { toast } = useToast();
  const [link1, setLink1] = useState("");
  const [link2, setLink2] = useState("");
  const [campaignLink, setCampaignLink] = useState("");
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set(["instagram"]));
  const [confirmed, setConfirmed] = useState(false);

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) { next.delete(p); } else { next.add(p); }
      return next;
    });
  };

  const submit = async () => {
    if (!link1.trim() || !confirmed || platforms.size === 0) {
      toast({ title: "Please fill all required fields", variant: "destructive" }); return;
    }
    try {
      const pArr = Array.from(platforms);
      await api.uploadVideo(link1.trim(), pArr[0]);
      if (link2.trim()) await api.uploadVideo(link2.trim(), pArr[pArr.length - 1]);
      toast({ title: "Submitted!", description: "Your content is under review." });
      setLink1(""); setLink2(""); setCampaignLink(""); setConfirmed(false);
    } catch { toast({ title: "Error", description: "Failed to submit content", variant: "destructive" }); }
  };

  return (
    <div className="bento-card p-6 space-y-4">
      <h2 className="font-display font-bold text-chalk">Submit Content</h2>
      <div>
        <p className="text-xs text-chalk-dim mb-2">Platform *</p>
        <div className="flex gap-2">
          {(["instagram", "youtube"] as const).map((p) => (
            <button key={p} type="button" onClick={() => togglePlatform(p)}
              className={`px-4 py-2 rounded-full text-xs border transition-all ${platforms.has(p) ? "border-gold text-gold bg-gold/10" : "border-white/10 text-chalk-dim"}`}>
              {p === "instagram" ? "📸 Instagram" : "▶️ YouTube"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm text-chalk-dim mb-1.5">Content Link 1 * (Drive / Post URL)</label>
        <input value={link1} onChange={(e) => setLink1(e.target.value)}
          className="dark-input w-full px-4 py-3 text-sm" placeholder="https://drive.google.com/..." />
      </div>
      <div>
        <label className="block text-sm text-chalk-dim mb-1.5">Content Link 2 (optional)</label>
        <input value={link2} onChange={(e) => setLink2(e.target.value)}
          className="dark-input w-full px-4 py-3 text-sm" placeholder="https://youtube.com/..." />
      </div>
      <div>
        <label className="block text-sm text-chalk-dim mb-1.5">Campaign Link (optional)</label>
        <input value={campaignLink} onChange={(e) => setCampaignLink(e.target.value)}
          className="dark-input w-full px-4 py-3 text-sm" placeholder="Campaign brief or reference link" />
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="w-4 h-4 rounded accent-purple-600" />
        <span className="text-sm text-chalk-dim">I confirm this content is ready for brand review</span>
      </label>
      <button onClick={submit} className="purple-pill w-full py-3 text-sm">✅ Submit for Review</button>
    </div>
  );
}

interface MembershipProps { membershipStatus: { tier: string; active?: boolean } | null; }
export function MembershipTab({ membershipStatus }: MembershipProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [accepted, setAccepted] = useState(false);

  const upgrade = async (plan: string) => {
    try {
      const order = await api.createMembershipOrder(plan);
      if (!order.orderId || !order.keyId) {
        await api.purchaseMembership(plan);
        qc.invalidateQueries({ queryKey: ["membership-status"] });
        toast({ title: "Success", description: `${plan} membership activated!` }); return;
      }
      await openRazorpayCheckout({
        orderId: order.orderId, amount: order.amount, currency: order.currency, keyId: order.keyId,
        name: `Kalakaarian ${plan.charAt(0).toUpperCase() + plan.slice(1)} Membership`,
        prefill: { name: user?.name, email: user?.email },
        onSuccess: async (paymentId, orderId, signature) => {
          await api.purchaseMembership(plan, { razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: signature });
          qc.invalidateQueries({ queryKey: ["membership-status"] });
          toast({ title: "Payment successful!", description: `${plan} membership activated.` });
        },
        onDismiss: () => toast({ title: "Payment cancelled" }),
      });
    } catch { toast({ title: "Error", description: "Failed to process payment", variant: "destructive" }); }
  };

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
      {[
        { plan: "gold", price: "₹149/month", features: ["Top visibility", "Profile banner", "Priority selection", "Advanced analytics"] },
        { plan: "silver", price: "₹79/month", features: ["2-3× more selection", "Notifications", "Basic analytics", "Community access"] },
      ].map(({ plan, price, features }) => (
        <div key={plan} className={`rounded-xl p-6 membership-${plan}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-chalk text-lg capitalize">{plan}</h3>
            <span className="text-xs text-chalk-dim">{price}</span>
          </div>
          <ul className="space-y-1.5 mb-4">
            {features.map((f) => <li key={f} className="text-sm text-chalk-dim flex items-center gap-2"><span className={plan === "gold" ? "text-gold" : "text-blue-400"}>✓</span> {f}</li>)}
          </ul>
          <button onClick={() => upgrade(plan)}
            disabled={!accepted || (membershipStatus?.tier === plan && !!membershipStatus?.active)}
            className={`w-full py-2.5 text-sm rounded-full font-bold disabled:opacity-40 disabled:cursor-not-allowed ${plan === "gold" ? "gold-pill" : "purple-pill"}`}>
            {membershipStatus?.tier === plan && membershipStatus?.active ? "✓ Active" : `Activate ${plan.charAt(0).toUpperCase() + plan.slice(1)}`}
          </button>
        </div>
      ))}
    </div>
  );
}

interface SettingsProps { profile: InfluencerProfile | null; }
export function SettingsTab({ profile }: SettingsProps) {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  return (
    <div className="bento-card p-6 space-y-5">
      <h2 className="font-display font-bold text-chalk">Account Settings</h2>
      <div>
        <label className="block text-sm text-chalk-dim mb-1.5">Change Email</label>
        <div className="flex gap-2">
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            className="dark-input flex-1 px-4 py-3 text-sm" placeholder="new@email.com" />
          <button className="purple-pill px-4 py-2 text-sm" onClick={() => toast({ title: "Updated" })}>Update</button>
        </div>
      </div>
      <div>
        <label className="block text-sm text-chalk-dim mb-1.5">Change WhatsApp</label>
        <div className="flex gap-2">
          <span className="dark-input px-3 py-3 text-sm text-chalk-dim flex-shrink-0">+91</span>
          <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
            className="dark-input flex-1 px-4 py-3 text-sm" placeholder="9876543210" />
          <button className="purple-pill px-4 py-2 text-sm" onClick={() => toast({ title: "OTP Sent" })}>OTP</button>
        </div>
      </div>
      <div className="border-t border-white/5 pt-4">
        <a href={profile?.socialHandles?.instagram ? `https://instagram.com/${profile.socialHandles.instagram.replace("@", "")}` : "#"}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-chalk-dim hover:text-chalk transition-colors">
          <ExternalLink className="w-4 h-4" /> View Public Profile
        </a>
      </div>
    </div>
  );
}
