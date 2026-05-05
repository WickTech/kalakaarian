import { Link, useNavigate } from "react-router-dom";
import { Edit, ExternalLink, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { api, Proposal, InfluencerProfile, InfluencerAnalytics } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { openRazorpayCheckout } from "@/lib/razorpay";

type Tab = "analytics" | "wallet" | "upload" | "membership" | "settings";

const TABS: { key: Tab; label: string }[] = [
  { key: "analytics", label: "📈 Analytics" },
  { key: "wallet", label: "💰 Wallet" },
  { key: "upload", label: "🎥 Upload" },
  { key: "membership", label: "🎖 Membership" },
  { key: "settings", label: "⚙️ Settings" },
];

const STATUS_STYLE: Record<string, string> = {
  submitted: "text-gold border-gold/30",
  accepted: "text-green-400 border-green-400/30",
  rejected: "text-red-400 border-red-400/30",
};

export default function InfluencerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("analytics");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [analytics, setAnalytics] = useState<InfluencerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadLink, setUploadLink] = useState("");
  const [uploadPlatform, setUploadPlatform] = useState<"instagram" | "youtube">("instagram");
  const [uploadConfirmed, setUploadConfirmed] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<{ tier: string; active: boolean } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [membershipTermsAccepted, setMembershipTermsAccepted] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getProposals().catch(() => []),
      api.getInfluencerProfile().catch(() => null),
      api.getInfluencerAnalytics().catch(() => null),
      api.getMembershipStatus().catch(() => null),
    ]).then(([p, prof, ana, mem]) => {
      setProposals(p); setProfile(prof); setAnalytics(ana);
      setMembershipStatus(mem); setIsOnline(prof?.isOnline || false);
    }).catch(() => toast({ title: "Error", description: "Failed to load data", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const handleMembershipUpgrade = async (plan: string) => {
    try {
      const order = await api.createMembershipOrder(plan);
      if (!order.orderId || !order.keyId) {
        await api.purchaseMembership(plan);
        const updated = await api.getMembershipStatus();
        setMembershipStatus(updated);
        toast({ title: "Success", description: `${plan} membership activated!` });
        return;
      }
      await openRazorpayCheckout({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        name: `Kalakaarian ${plan.charAt(0).toUpperCase() + plan.slice(1)} Membership`,
        prefill: { name: user?.name, email: user?.email },
        onSuccess: async (paymentId, orderId, signature) => {
          await api.purchaseMembership(plan, { razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: signature });
          const updated = await api.getMembershipStatus();
          setMembershipStatus(updated);
          toast({ title: "Payment successful!", description: `${plan} membership activated.` });
        },
        onDismiss: () => toast({ title: "Payment cancelled" }),
      });
    } catch {
      toast({ title: "Error", description: "Failed to process payment", variant: "destructive" });
    }
  };

  const togglePresence = async () => {
    const next = !isOnline;
    await api.updatePresence(next);
    setIsOnline(next);
  };

  const submitUpload = async () => {
    if (!uploadLink || !uploadConfirmed) { toast({ title: "Please fill all fields", variant: "destructive" }); return; }
    try {
      await api.uploadVideo(uploadLink, uploadPlatform);
      toast({ title: "Submitted!", description: "Your content is under review." });
      setUploadLink(""); setUploadConfirmed(false);
    } catch {
      toast({ title: "Error", description: "Failed to submit content", variant: "destructive" });
    }
  };

  const stats = {
    total: proposals.length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    earnings: analytics?.totalEarnings || proposals.filter((p) => p.status === "accepted").reduce((s, p) => s + p.bidAmount, 0),
  };

  if (loading) return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Profile Hero */}
        <div className="bento-card p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img src={profile?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt="avatar" className="w-16 h-16 rounded-full object-cover bg-charcoal" />
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-obsidian ${isOnline ? "bg-green-400" : "bg-chalk-faint"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-chalk text-xl">{profile?.name || user?.name}</h1>
                {membershipStatus?.active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">{membershipStatus.tier?.toUpperCase()}</span>
                )}
              </div>
              <p className="text-xs text-chalk-dim mt-0.5">{profile?.niches?.join(", ") || "—"} · {profile?.city || "—"}</p>
              <p className="text-xs text-chalk-faint mt-0.5">{(profile?.followerCount || 0).toLocaleString("en-IN")} followers</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-chalk-dim">Active</span>
              <button onClick={togglePresence} className={`w-10 h-5 rounded-full transition-all ${isOnline ? "bg-green-500" : "bg-white/10"}`}>
                <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${isOnline ? "translate-x-4" : ""}`} />
              </button>
              <Link to="/profile/edit" className="p-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk transition-colors">
                <Edit className="w-3.5 h-3.5" />
              </Link>
              <button onClick={() => { logout(); navigate("/"); }} className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors" title="Logout">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${tab === key ? "bg-purple-600 text-white" : "border border-white/10 text-chalk-dim hover:text-chalk"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "analytics" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Proposals", value: stats.total },
                { label: "Accepted", value: stats.accepted },
                { label: "Acceptance %", value: stats.total ? `${Math.round((stats.accepted / stats.total) * 100)}%` : "—" },
                { label: "Total Earned", value: `₹${stats.earnings.toLocaleString("en-IN")}` },
              ].map(({ label, value }) => (
                <div key={label} className="bento-card p-4 text-center">
                  <p className="result-numeral text-xl">{value}</p>
                  <p className="text-xs text-chalk-dim mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="bento-card overflow-hidden">
              <div className="p-4 border-b border-white/5"><h2 className="font-display font-bold text-chalk text-sm">Collaborations</h2></div>
              {proposals.length === 0 ? (
                <div className="p-8 text-center text-chalk-dim text-sm">
                  No proposals yet. <Link to="/campaigns" className="text-gold hover:underline">Browse campaigns →</Link>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-white/5">
                    {["Campaign", "Bid Amount", "Date", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-chalk-faint font-medium">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {proposals.slice(0, 10).map((p) => (
                      <tr key={p._id} className="border-b border-white/5 hover:bg-white/2">
                        <td className="px-4 py-2.5 text-chalk">{p.campaignTitle || "—"}</td>
                        <td className="px-4 py-2.5 text-chalk">₹{p.bidAmount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2.5 text-chalk-dim">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full border ${STATUS_STYLE[p.status] || "text-chalk-dim border-white/10"}`}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === "wallet" && (
          <div className="space-y-4">
            <div className="wallet-card p-6 rounded-xl">
              <p className="text-xs text-chalk-dim mb-1">Total Earnings</p>
              <p className="font-display font-bold text-3xl text-chalk">₹{stats.earnings.toLocaleString("en-IN")}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bento-card p-4">
                <p className="text-xs text-chalk-dim">⏳ Pending</p>
                <p className="font-bold text-xl text-chalk mt-1">₹{proposals.filter((p) => p.status === "pending").reduce((s, p) => s + p.bidAmount, 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="bento-card p-4">
                <p className="text-xs text-chalk-dim">✅ Approved</p>
                <p className="font-bold text-xl text-chalk mt-1">₹{stats.earnings.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <button disabled={stats.earnings === 0} className="purple-pill w-full py-3 text-sm disabled:opacity-40">
              Withdraw Earnings
            </button>
            <p className="text-xs text-chalk-faint text-center">Withdrawals enabled only after campaign approval</p>
          </div>
        )}

        {tab === "upload" && (
          <div className="bento-card p-6 space-y-4">
            <h2 className="font-display font-bold text-chalk">Submit Content</h2>
            <div className="flex gap-2">
              {(["instagram", "youtube"] as const).map((p) => (
                <button key={p} onClick={() => setUploadPlatform(p)}
                  className={`px-4 py-2 rounded-full text-xs border transition-all ${uploadPlatform === p ? "border-gold text-gold bg-gold/10" : "border-white/10 text-chalk-dim"}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-chalk-dim mb-1.5">Content Link / Drive URL</label>
              <input value={uploadLink} onChange={(e) => setUploadLink(e.target.value)}
                className="dark-input w-full px-4 py-3 text-sm" placeholder="https://drive.google.com/..." />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={uploadConfirmed} onChange={(e) => setUploadConfirmed(e.target.checked)} className="w-4 h-4 rounded accent-purple-600" />
              <span className="text-sm text-chalk-dim">I confirm the content is submitted and ready for review</span>
            </label>
            <button onClick={submitUpload} className="purple-pill w-full py-3 text-sm">✅ Task Completed</button>
            <p className="text-xs text-chalk-faint">After submission, our team reviews. If changes needed, you'll be notified via WhatsApp & Email.</p>
          </div>
        )}

        {tab === "membership" && (
          <div className="space-y-4">
            <div className="bento-card p-4 border border-purple-500/20 bg-purple-500/5 rounded-xl">
              <p className="text-xs text-chalk-dim mb-2 font-semibold">Membership Terms</p>
              <p className="text-xs text-chalk-faint mb-3">Membership fees are non-refundable. By activating, you agree to Kalakaarian&apos;s <a href="/terms" target="_blank" className="text-purple-400 hover:underline">Terms & Conditions</a>. Membership grants visibility benefits and does not guarantee campaign selection.</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={membershipTermsAccepted} onChange={(e) => setMembershipTermsAccepted(e.target.checked)} className="accent-purple-600" />
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
                  {features.map((f) => (
                    <li key={f} className="text-sm text-chalk-dim flex items-center gap-2">
                      <span className={plan === "gold" ? "text-gold" : "text-blue-400"}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleMembershipUpgrade(plan)}
                  disabled={!membershipTermsAccepted || (membershipStatus?.tier === plan && membershipStatus.active)}
                  className={`w-full py-2.5 text-sm rounded-full font-bold disabled:opacity-40 disabled:cursor-not-allowed ${plan === "gold" ? "gold-pill" : "purple-pill"}`}>
                  {membershipStatus?.tier === plan && membershipStatus.active ? "✓ Active" : `Activate ${plan.charAt(0).toUpperCase() + plan.slice(1)}`}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "settings" && (
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
        )}
      </div>
    </main>
  );
}
