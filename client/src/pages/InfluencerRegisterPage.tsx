import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const GENRES = [
  "Food", "Tech", "Fashion", "Travel", "Fitness",
  "Beauty", "Gaming", "Lifestyle", "Finance", "Education", "Comedy", "Music",
];
const COUNTRIES = ["India", "UAE", "USA", "UK", "Singapore"];
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

const STEPS = ["Basic Info", "Genre", "Platforms", "Rates", "Location"];

interface InfluencerForm {
  name: string; email: string; phone: string; password: string;
  genres: string[]; instagram: string; youtube: string;
  reelRate: string; storyRate: string; longVideoRate: string; shortsRate: string; bio: string;
  city: string; state: string; country: string;
}

export default function InfluencerRegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<InfluencerForm>({
    name: "", email: "", phone: "", password: "",
    genres: [], instagram: "", youtube: "",
    reelRate: "", storyRate: "", longVideoRate: "", shortsRate: "", bio: "",
    city: "", state: "", country: "India",
  });

  const set = (key: keyof InfluencerForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const toggleGenre = (g: string) =>
    setForm((p) => ({
      ...p,
      genres: p.genres.includes(g) ? p.genres.filter((x) => x !== g) : [...p.genres, g],
    }));

  const validate = (): boolean => {
    if (step === 0 && (!form.name || !form.email || !form.phone || !form.password)) {
      setError("All fields are required."); return false;
    }
    if (step === 1 && form.genres.length === 0) {
      setError("Select at least one genre."); return false;
    }
    if (step === 2 && !form.instagram && !form.youtube) {
      setError("At least one platform handle is required."); return false;
    }
    return true;
  };

  const next = () => { if (validate()) { setError(""); setStep((s) => s + 1); } };
  const back = () => { setError(""); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    if (!form.city || !form.country) { setError("City and country are required."); return; }
    setLoading(true);
    try {
      await register({
        email: form.email, phone: form.phone, password: form.password, name: form.name,
        role: "influencer",
        niches: form.genres as never[],
        platform: [
          ...(form.instagram ? ["instagram"] : []),
          ...(form.youtube ? ["youtube"] : []),
        ],
        tier: "micro", bio: form.bio,
        socialHandles: { instagram: form.instagram || undefined, youtube: form.youtube || undefined },
        profileImage: DEFAULT_AVATAR,
        city: form.city,
        pricing: {
          reelRate: Number(form.reelRate) || 0,
          storyRate: Number(form.storyRate) || 0,
          longVideoRate: Number(form.longVideoRate) || 0,
          shortsRate: Number(form.shortsRate) || 0,
        },
      });
      navigate("/influencer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-obsidian px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <Link to="/login" className="flex items-center gap-2 text-sm text-chalk-dim hover:text-chalk mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "step-done" : i === step ? "step-active" : "step-pending"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs ${i === step ? "text-chalk" : "text-chalk-faint"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-white/10 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="bento-card p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-chalk">Basic Information</h2>
              {([
                { key: "name", label: "Full Name", type: "text", ph: "Priya Sharma" },
                { key: "email", label: "Email", type: "email", ph: "priya@example.com" },
                { key: "phone", label: "WhatsApp Number", type: "tel", ph: "+91 9876543210" },
                { key: "password", label: "Password", type: "password", ph: "Min 8 characters" },
              ] as const).map(({ key, label, type, ph }) => (
                <div key={key}>
                  <label className="block text-sm text-chalk-dim mb-1.5">{label} *</label>
                  <input type={type} value={form[key]} onChange={set(key)} className="dark-input w-full px-4 py-3 text-sm" placeholder={ph} />
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-chalk">Your Genre</h2>
              <p className="text-sm text-chalk-dim">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button key={g} type="button" onClick={() => toggleGenre(g)}
                    className={`goal-chip px-4 py-2 text-sm ${form.genres.includes(g) ? "selected" : ""}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-chalk">Connect Platforms</h2>
              <p className="text-sm text-chalk-dim">At least one handle required</p>
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">📸 Instagram Handle</label>
                <input value={form.instagram} onChange={set("instagram")} className="dark-input w-full px-4 py-3 text-sm" placeholder="@priyasharma" />
              </div>
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">▶️ YouTube Channel URL</label>
                <input value={form.youtube} onChange={set("youtube")} className="dark-input w-full px-4 py-3 text-sm" placeholder="youtube.com/@priyasharma" />
              </div>
              <p className="text-xs text-chalk-faint">Connecting platforms enables auto-pulling of real analytics.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-chalk">Set Your Rates</h2>
              <p className="text-xs text-chalk-faint">5% platform markup added automatically at checkout</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "reelRate", label: "Instagram Reel (₹)", ph: "15000" },
                  { key: "storyRate", label: "Story (₹)", ph: "5000" },
                  { key: "longVideoRate", label: "YouTube Long (₹)", ph: "25000" },
                  { key: "shortsRate", label: "Shorts (₹)", ph: "8000" },
                ] as const).map(({ key, label, ph }) => (
                  <div key={key}>
                    <label className="block text-xs text-chalk-dim mb-1.5">{label}</label>
                    <input type="number" value={form[key]} onChange={set(key)} className="dark-input w-full px-3 py-2.5 text-sm" placeholder={ph} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">Bio (optional)</label>
                <textarea value={form.bio} onChange={set("bio")} rows={3} maxLength={300}
                  className="dark-input w-full px-4 py-3 text-sm resize-none" placeholder="Tell brands about your content style..." />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-chalk">Your Location</h2>
              {([
                { key: "city", label: "City", ph: "Mumbai" },
                { key: "state", label: "State", ph: "Maharashtra" },
              ] as const).map(({ key, label, ph }) => (
                <div key={key}>
                  <label className="block text-sm text-chalk-dim mb-1.5">{label} *</label>
                  <input value={form[key]} onChange={set(key)} className="dark-input w-full px-4 py-3 text-sm" placeholder={ph} />
                </div>
              ))}
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">Country *</label>
                <select value={form.country} onChange={set("country")} className="dark-select w-full px-4 py-3 text-sm">
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={back} className="flex-1 py-3 text-sm rounded-full border border-white/10 text-chalk-dim hover:text-chalk transition-colors">
                Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={next} className="flex-1 purple-pill py-3 text-sm">
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="flex-1 gold-pill py-3 text-sm disabled:opacity-50">
                {loading ? "Creating Account..." : "Complete Profile ✓"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
