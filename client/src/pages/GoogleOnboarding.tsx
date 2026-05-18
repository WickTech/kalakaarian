import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError } from "@/lib/api";

const NICHES = ["Food", "Tech", "Fashion", "Travel", "Fitness", "Beauty", "Gaming", "Lifestyle", "Finance", "Education", "Comedy", "Music"];
const INDUSTRIES = ["Fashion", "Technology", "Food & Beverage", "Health & Wellness", "Finance", "Entertainment", "Retail", "Education", "Beauty", "Travel", "Other"];

const USER_KEY = "kalakariaan_user";

export default function GoogleOnboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [role, setRole] = useState<"brand" | "influencer">("brand");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === "brand" || user?.role === "influencer") {
      setRole(user.role);
    }
  }, [user]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingCompleted !== false) return <Navigate to="/" replace />;

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter(x => x !== value) : [...list, value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (role === "brand" && (!companyName.trim() || !industry)) {
      setError("Company name and industry are required.");
      return;
    }
    if (role === "influencer" && (niches.length === 0 || !city.trim() || platforms.length === 0)) {
      setError("Please pick at least one niche, one platform, and your city.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.completeGoogleOnboarding({
        role,
        ...(role === "brand"
          ? { companyName: companyName.trim(), industry }
          : { city: city.trim(), niches, platform: platforms, bio: bio.trim() }),
      });
      // Update stored user in-place; token is still valid.
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      // Full reload so AuthContext re-reads localStorage and route guards re-evaluate.
      window.location.href = role === "brand" ? "/brand/welcome" : `/influencer/${response.user.id}`;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to complete onboarding.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-obsidian px-4 py-10 flex items-start justify-center">
      <div className="w-full max-w-lg">
        <h1 className="font-display text-2xl font-bold text-chalk mb-2">Finish setting up your account</h1>
        <p className="text-sm text-chalk-dim mb-6">A few quick details so we can show you the right experience.</p>

        <form onSubmit={handleSubmit} className="bento-card p-6 space-y-5">
          <div>
            <label className="block text-sm text-chalk-dim mb-1.5">I am a *</label>
            <div className="flex rounded-full border border-white/10 overflow-hidden text-xs">
              {(["brand", "influencer"] as const).map(r => (
                <button type="button" key={r} onClick={() => setRole(r)}
                  className={`flex-1 py-2 font-medium capitalize ${role === r ? "bg-white/10 text-chalk" : "text-chalk-dim"}`}>
                  {r === "brand" ? "Brand" : "Creator"}
                </button>
              ))}
            </div>
          </div>

          {role === "brand" && (
            <>
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">Company Name *</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="dark-input w-full px-4 py-3 text-sm" placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">Industry *</label>
                <select value={industry} onChange={e => setIndustry(e.target.value)} className="dark-select w-full px-4 py-3 text-sm">
                  <option value="">Select your industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </>
          )}

          {role === "influencer" && (
            <>
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">Niches *</label>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map(n => (
                    <button type="button" key={n} onClick={() => toggle(niches, setNiches, n)}
                      className={`goal-chip px-3 py-1.5 text-xs ${niches.includes(n) ? "selected" : ""}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">City *</label>
                <input value={city} onChange={e => setCity(e.target.value)} className="dark-input w-full px-4 py-3 text-sm" placeholder="Mumbai" />
              </div>
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">Platforms *</label>
                <div className="flex gap-2">
                  {(["instagram", "youtube"] as const).map(p => (
                    <button type="button" key={p} onClick={() => toggle(platforms, setPlatforms, p)}
                      className={`goal-chip px-4 py-2 text-xs capitalize ${platforms.includes(p) ? "selected" : ""}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">Bio (optional)</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={300}
                  className="dark-input w-full px-4 py-3 text-sm resize-none" placeholder="Tell brands about your content..." />
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="purple-pill w-full py-3 text-sm disabled:opacity-50">
            {submitting ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </main>
  );
}
