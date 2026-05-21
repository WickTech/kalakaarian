import { useState } from "react";
import { api } from "@/lib/api";
import { emailWarning } from "@/lib/emailValidation";
import { BRAND_INDUSTRIES } from "@/lib/industries";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  email?: string;
  onComplete: () => void;
}

export function BrandCompletionModal({ email, onComplete }: Props) {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const warning = email ? emailWarning(email) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !industry || !whatsapp.trim()) {
      setError("All fields are required.");
      return;
    }
    if (industry === "Other" && !customIndustry.trim()) {
      setError("Please enter your industry.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.updateBrandProfile({
        companyName: companyName.trim(),
        industry: industry === "Other" ? customIndustry.trim() : industry,
        website: website.trim() || undefined,
        phone: whatsapp.replace(/\D/g, ""),
      });
      onComplete();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md bento-card p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-chalk">Complete your brand profile</h2>
            <p className="text-sm text-chalk-dim mt-1">Required before accessing the marketplace</p>
          </div>
        </div>

        {warning && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-chalk-dim mb-1.5">Company Name *</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="dark-input w-full px-4 py-3 text-sm"
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm text-chalk-dim mb-1.5">Industry *</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="dark-select w-full px-4 py-3 text-sm">
              <option value="">Select industry</option>
              {BRAND_INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            {industry === "Other" && (
              <input
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                className="dark-input w-full px-4 py-3 text-sm mt-2"
                placeholder="Type your industry"
              />
            )}
          </div>
          <div>
            <label className="block text-sm text-chalk-dim mb-1.5">Brand Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="dark-input w-full px-4 py-3 text-sm"
              placeholder="https://acme.com"
            />
          </div>
          <div>
            <label className="block text-sm text-chalk-dim mb-1.5">WhatsApp Number *</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="dark-input w-full px-4 py-3 text-sm"
              placeholder="+91 9876543210"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="purple-pill w-full py-3 text-sm disabled:opacity-50">
            {loading ? "Saving…" : "Complete Profile →"}
          </button>
        </form>
      </div>
    </div>
  );
}
