import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Instagram, Youtube } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/hooks/useAuth";
import { INDIA_STATES } from "@/lib/constants";
import { TermsModal } from "@/components/TermsModal";

const GENRES = ["Food", "Tech", "Fashion", "Travel", "Fitness", "Beauty", "Gaming", "Lifestyle", "Finance", "Education", "Comedy", "Music"];
const STEPS = ["Basic Info", "Genre", "Platforms", "Rates", "Location"];

const GENDER_AVATARS: Record<string, string> = {
  male: "https://api.dicebear.com/7.x/avataaars/svg?seed=male&accessories=&top=shortFlat&facialHair=beardLight",
  female: "https://api.dicebear.com/7.x/avataaars/svg?seed=female&accessories=round&top=longButNotTooLong",
  non_binary: "https://api.dicebear.com/7.x/avataaars/svg?seed=nb&accessories=sunglasses",
  prefer_not_to_say: "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
};

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const showGoogle = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "your-google-client-id.apps.googleusercontent.com";

function parseIgHandle(raw: string): string {
  const m = raw.match(/instagram\.com\/([^/?#\s]+)/i);
  if (m) return m[1].replace(/^@/, "");
  return raw.replace(/^@/, "").trim();
}

function parseYtHandle(raw: string): string {
  const m = raw.match(/youtube\.com\/@([^/?#\s]+)/i) || raw.match(/youtube\.com\/c\/([^/?#\s]+)/i) || raw.match(/youtube\.com\/user\/([^/?#\s]+)/i);
  if (m) return m[1];
  return raw.replace(/^@/, "").trim();
}

interface InfluencerForm {
  name: string; email: string; phone: string; password: string; confirmPassword: string;
  gender: string; genres: string[]; instagram: string; youtube: string;
  reelRate: string; storyRate: string; longVideoRate: string; shortsRate: string; bio: string;
  city: string; state: string;
}

export default function InfluencerRegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [form, setForm] = useState<InfluencerForm>({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    gender: "", genres: [], instagram: "", youtube: "",
    reelRate: "", storyRate: "", longVideoRate: "", shortsRate: "", bio: "",
    city: "", state: "",
  });

  const set = (key: keyof InfluencerForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const toggleGenre = (g: string) =>
    setForm((p) => ({ ...p, genres: p.genres.includes(g) ? p.genres.filter((x) => x !== g) : [...p.genres, g] }));

  const normalizeIg = () => setForm(p => ({ ...p, instagram: parseIgHandle(p.instagram) }));
  const normalizeYt = () => setForm(p => ({ ...p, youtube: parseYtHandle(p.youtube) }));

  const validate = (): boolean => {
    if (step === 0) {
      if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword || !form.gender) {
        setError("All fields are required."); return false;
      }
      if (form.password.length < 8) { setError("Password must be at least 8 characters."); return false; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return false; }
    }
    if (step === 1 && form.genres.length === 0) { setError("Select at least one genre."); return false; }
    if (step === 2 && !form.instagram && !form.youtube) { setError("At least one platform handle is required."); return false; }
    return true;
  };

  const next = () => { if (validate()) { setError(""); setStep((s) => s + 1); } };
  const back = () => { setError(""); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    if (!form.city || !form.state) { setError("City and state are required."); return; }
    setLoading(true);
    try {
      const profileImage = GENDER_AVATARS[form.gender] || GENDER_AVATARS.prefer_not_to_say;
      await register({
        email: form.email, phone: form.phone, password: form.password, name: form.name,
        role: "influencer",
        gender: (form.gender as 'male' | 'female' | 'non_binary' | 'prefer_not_to_say') || undefined,
        niches: form.genres as never[],
        platform: [...(form.instagram ? ["instagram"] : []), ...(form.youtube ? ["youtube"] : [])],
        tier: "micro", bio: form.bio,
        socialHandles: { instagram: form.instagram || undefined, youtube: form.youtube || undefined },
        profileImage, city: form.city,
        pricing: {
          reelRate: Number(form.reelRate) || 0,
          storyRate: Number(form.storyRate) || 0,
          longVideoRate: Number(form.longVideoRate) || 0,
          shortsRate: Number(form.shortsRate) || 0,
        },
        termsAccepted: true,
      });
      navigate("/influencer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (cr: { credential?: string }) => {
    if (!cr.credential) return;
    setLoading(true);
    try {
      await loginWithGoogle(cr.credential, "influencer");
      navigate("/influencer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-obsidian overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-fuchsia-600/5 to-pink-600/10 pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <Link to="/login" className="flex items-center gap-2 text-sm text-chalk-dim hover:text-chalk mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          {/* Left nav — step checklist */}
          <aside className="md:sticky md:top-20 self-start">
            <nav className="space-y-1 p-2 rounded-xl border border-white/10 bg-white/[0.02]">
              {STEPS.map((label, i) => {
                const done = i < step;
                const current = i === step;
                const clickable = done; // only previous steps clickable
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => clickable && setStep(i)}
                    disabled={!clickable && !current}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      current
                        ? "bg-purple-600/15 text-chalk border border-purple-500/30"
                        : done
                        ? "text-chalk-dim hover:text-chalk hover:bg-white/5 cursor-pointer"
                        : "text-chalk-faint cursor-not-allowed"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      done ? "bg-green-500/20 text-green-300"
                        : current ? "bg-purple-500/20 text-purple-300"
                        : "bg-white/5 text-chalk-faint"
                    }`}>
                      {done ? "✓" : i + 1}
                    </span>
                    {label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="bento-card p-6">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-chalk">Basic Information</h2>

              {showGoogle && (
                <>
                  <div className="flex justify-center">
                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google sign-in failed")}
                      text="signup_with" shape="pill" theme="filled_black" size="large" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-chalk-faint">or fill in your details</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                </>
              )}

              {([
                { key: "name", label: "Full Name", type: "text", ph: "Priya Sharma" },
                { key: "email", label: "Email", type: "email", ph: "priya@example.com" },
                { key: "phone", label: "WhatsApp Number", type: "tel", ph: "+91 9876543210" },
                { key: "password", label: "Password", type: "password", ph: "Min 8 characters" },
                { key: "confirmPassword", label: "Confirm Password", type: "password", ph: "Re-enter password" },
              ] as const).map(({ key, label, type, ph }) => (
                <div key={key}>
                  <label className="block text-sm text-chalk-dim mb-1.5">{label} *</label>
                  <input type={type} value={form[key]} onChange={set(key)} className="dark-input w-full px-4 py-3 text-sm" placeholder={ph} />
                </div>
              ))}
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">Gender *</label>
                <select value={form.gender} onChange={set("gender")} className="dark-select w-full px-4 py-3 text-sm">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non_binary">Non-binary</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 1: Genre */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-chalk">Your Content Genre</h2>
              <p className="text-sm text-chalk-dim">Select all that apply — brands filter by this</p>
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

          {/* Step 2: Platforms */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-chalk">Connect Your Platforms</h2>
                <p className="text-sm text-chalk-dim mt-1">At least one required. Paste a profile URL or enter your handle.</p>
              </div>

              {/* Instagram */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                    <Instagram className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-chalk">Instagram</p>
                    <p className="text-[11px] text-chalk-faint">Paste URL or @handle</p>
                  </div>
                </div>
                <input
                  value={form.instagram}
                  onChange={set("instagram")}
                  onBlur={normalizeIg}
                  className="dark-input w-full px-4 py-3 text-sm"
                  placeholder="instagram.com/yourhandle or @yourhandle"
                />
                {form.instagram && (
                  <p className="text-xs text-green-400">
                    Handle: <span className="font-medium">@{form.instagram.replace(/^@/, "")}</span>
                    {" · "}
                    <a href={`https://instagram.com/${form.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">View profile ↗</a>
                  </p>
                )}
              </div>

              {/* YouTube */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Youtube className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-chalk">YouTube</p>
                    <p className="text-[11px] text-chalk-faint">Paste URL or @handle</p>
                  </div>
                </div>
                <input
                  value={form.youtube}
                  onChange={set("youtube")}
                  onBlur={normalizeYt}
                  className="dark-input w-full px-4 py-3 text-sm"
                  placeholder="youtube.com/@yourhandle or @yourhandle"
                />
                {form.youtube && (
                  <p className="text-xs text-green-400">
                    Handle: <span className="font-medium">@{form.youtube.replace(/^@/, "")}</span>
                    {" · "}
                    <a href={`https://youtube.com/@${form.youtube.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="text-red-400 hover:underline">View channel ↗</a>
                  </p>
                )}
              </div>

              <p className="text-xs text-chalk-faint bg-white/[0.03] rounded-lg px-3 py-2.5 border border-white/5">
                🔗 After signup you can connect via Instagram OAuth and Google OAuth from your dashboard to enable live analytics sync.
              </p>
            </div>
          )}

          {/* Step 3: Rates */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-chalk">Set Your Rates</h2>
              <p className="text-xs text-chalk-faint">Base rates. A 5% creator commercial fee applies on branded content.</p>
              {form.instagram && (
                <div>
                  <p className="text-xs text-chalk-dim uppercase tracking-widest mb-2 flex items-center gap-1.5"><Instagram className="w-3 h-3 text-pink-400" /> Instagram</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-chalk-dim mb-1.5">Reel (₹)</label>
                      <input type="number" value={form.reelRate} onChange={set("reelRate")} className="dark-input w-full px-3 py-2.5 text-sm" placeholder="15000" /></div>
                    <div><label className="block text-xs text-chalk-dim mb-1.5">Story (₹)</label>
                      <input type="number" value={form.storyRate} onChange={set("storyRate")} className="dark-input w-full px-3 py-2.5 text-sm" placeholder="5000" /></div>
                  </div>
                </div>
              )}
              {form.youtube && (
                <div>
                  <p className="text-xs text-chalk-dim uppercase tracking-widest mb-2 flex items-center gap-1.5"><Youtube className="w-3 h-3 text-red-400" /> YouTube</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-chalk-dim mb-1.5">Long Video (₹)</label>
                      <input type="number" value={form.longVideoRate} onChange={set("longVideoRate")} className="dark-input w-full px-3 py-2.5 text-sm" placeholder="25000" /></div>
                    <div><label className="block text-xs text-chalk-dim mb-1.5">Shorts (₹)</label>
                      <input type="number" value={form.shortsRate} onChange={set("shortsRate")} className="dark-input w-full px-3 py-2.5 text-sm" placeholder="8000" /></div>
                  </div>
                </div>
              )}
              {!form.instagram && !form.youtube && (
                <p className="text-sm text-amber-400">Go back and add at least one platform handle to set rates.</p>
              )}
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">Bio (optional)</label>
                <textarea value={form.bio} onChange={set("bio")} rows={3} maxLength={300}
                  className="dark-input w-full px-4 py-3 text-sm resize-none" placeholder="Tell brands about your content style..." />
              </div>
            </div>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-chalk">Your Location</h2>
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">City *</label>
                <input value={form.city} onChange={set("city")} className="dark-input w-full px-4 py-3 text-sm" placeholder="Mumbai" />
              </div>
              <div>
                <label className="block text-sm text-chalk-dim mb-1.5">State *</label>
                <select value={form.state} onChange={set("state")} className="dark-select w-full px-4 py-3 text-sm">
                  <option value="">Select state</option>
                  {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-xs text-chalk-faint">Country: India</p>
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
              <button onClick={next} className="flex-1 purple-pill py-3 text-sm">Continue →</button>
            ) : (
              <button onClick={() => setShowTerms(true)} disabled={loading} className="flex-1 gold-pill py-3 text-sm disabled:opacity-50">
                {loading ? "Creating Account..." : "Complete Profile ✓"}
              </button>
            )}
          </div>
        </div>
        </div>
      </div>

      {showTerms && (
        <TermsModal
          onAccept={() => { setShowTerms(false); handleSubmit(); }}
          onClose={() => setShowTerms(false)}
        />
      )}
    </main>
  );
}
