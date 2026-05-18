import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Settings, Building2, Mail, Phone, Globe, Tag, FileText, LayoutDashboard } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

function InfoRow({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="p-1.5 rounded-lg bg-white/[0.04] shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-chalk-faint" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] tracking-[0.14em] uppercase text-chalk-faint mb-0.5">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-sm text-purple-400 hover:text-purple-300 truncate block transition-colors">{value}</a>
        ) : (
          <p className="text-sm text-chalk truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { document.title = "My Profile — Kalakaarian"; }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["brand-profile"],
    queryFn: () => api.getBrandSettings(),
    staleTime: 5 * 60_000,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["brand-campaigns"],
    queryFn: () => api.getCampaigns(),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  const brandProfile = profile?.profile;
  const authUser = profile?.user;
  const displayName = brandProfile?.companyName || authUser?.name || user?.name || "Brand";
  const email = brandProfile?.email || authUser?.email || user?.email || "";
  const phone = brandProfile?.phone || authUser?.phone || "";
  const logoUrl = (brandProfile as { logo_url?: string; logo?: string } | undefined)?.logo_url || brandProfile?.logo;
  const openCampaigns = campaigns.filter(c => c.status === "open").length;

  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-obsidian py-10 px-4">
      <div className="mx-auto max-w-xl space-y-5">

        {/* Hero card */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl border border-white/15 bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt="logo" className="h-full w-full object-cover" />
                  : <span className="text-xl font-bold text-chalk-dim">{initials}</span>}
              </div>
              <div>
                <h1 className="text-xl font-bold text-chalk leading-tight">{displayName}</h1>
                {brandProfile?.industry && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium">
                    <Tag className="w-2.5 h-2.5" />{brandProfile.industry}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate("/account")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-white/10 text-chalk-dim hover:bg-white/5 hover:text-chalk transition-all"
            >
              <Settings className="w-3 h-3" /> Account
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Campaigns", value: campaigns.length },
              { label: "Open", value: openCampaigns },
              { label: "Industry", value: brandProfile?.industry ? "✓" : "—" },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg bg-white/[0.03] border border-white/5 p-3 text-center">
                <p className="text-lg font-bold text-chalk">{stat.value}</p>
                <p className="text-[10px] text-chalk-faint tracking-wide uppercase mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-semibold text-chalk uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-purple-400" /> Contact Info
          </p>
          {email && <InfoRow icon={Mail} label="Email" value={email} />}
          {phone && <InfoRow icon={Phone} label="Phone" value={phone} />}
          {brandProfile?.website && <InfoRow icon={Globe} label="Website" value={brandProfile.website} href={brandProfile.website} />}
          {brandProfile?.industry && <InfoRow icon={Tag} label="Industry" value={brandProfile.industry} />}
          {!email && !phone && !brandProfile?.website && (
            <p className="text-xs text-chalk-faint py-3">No contact info yet. <button onClick={() => navigate("/profile/edit")} className="text-purple-400 hover:underline">Add details →</button></p>
          )}
        </div>

        {/* Description */}
        {brandProfile?.description && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold text-chalk uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" /> About
            </p>
            <p className="text-sm text-chalk-dim leading-relaxed">{brandProfile.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/brand/dashboard", { state: { tab: "campaigns" } })}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm text-chalk hover:bg-white/5 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => navigate("/account/personal")}
            className="flex-1 purple-pill py-2.5 text-sm font-bold flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" /> Edit Profile
          </button>
        </div>

      </div>
    </div>
  );
}
