import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/hooks/useAuth";
import { TermsModal } from "@/components/TermsModal";
import { emailWarning } from "@/lib/emailValidation";

const INDUSTRIES = [
  "Fashion", "Technology", "Food & Beverage", "Health & Wellness",
  "Finance", "Entertainment", "Retail", "Education", "Beauty", "Travel", "Other",
];

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const showGoogle = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "your-google-client-id.apps.googleusercontent.com";

interface BrandForm {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  industry: string;
}

export default function BrandRegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [form, setForm] = useState<BrandForm>({
    companyName: "", contactName: "", email: "", phone: "",
    password: "", confirmPassword: "", industry: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const set = (key: keyof BrandForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const { companyName, contactName, email, phone, password, confirmPassword, industry } = form;
    if (!companyName || !contactName || !email || !phone || !password || !confirmPassword || !industry) {
      setError("All fields are required."); return false;
    }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return false; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return false; }
    return true;
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) { setError(""); setShowTerms(true); }
  };

  const doRegister = async () => {
    const { companyName, contactName, email, phone, password, industry } = form;
    setLoading(true);
    try {
      await register({ email, phone, password, name: contactName, role: "brand", companyName, industry, termsAccepted: true });
      navigate("/brand/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (cr: { credential?: string }) => {
    if (!cr.credential) return;
    setLoading(true);
    try {
      await loginWithGoogle(cr.credential, "brand");
      navigate("/brand/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-obsidian overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-fuchsia-600/5 to-pink-600/10 pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 text-sm text-chalk-dim hover:text-chalk mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-chalk leading-tight">Brand Registration</h1>
            <p className="text-chalk-dim text-xs">Start discovering creators for your campaigns</p>
          </div>
        </div>

        <div className="bento-card p-6 mt-6 space-y-5">
          {showGoogle && (
            <>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google sign-in failed")}
                  text="signup_with"
                  shape="pill"
                  theme="filled_black"
                  size="large"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-chalk-faint">or register with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {([
              { key: "contactName", label: "Your Full Name", type: "text", ph: "Jane Doe" },
              { key: "companyName", label: "Brand / Company Name", type: "text", ph: "Acme Corp" },
              { key: "phone", label: "WhatsApp Number", type: "tel", ph: "+91 9876543210" },
              { key: "password", label: "Password", type: "password", ph: "Min 8 characters" },
              { key: "confirmPassword", label: "Confirm Password", type: "password", ph: "Re-enter password" },
            ] as const).map(({ key, label, type, ph }) => (
              <div key={key}>
                <label className="block text-sm text-chalk-dim mb-1.5">{label} *</label>
                <input type={type} value={form[key]} onChange={set(key)}
                  className="dark-input w-full px-4 py-3 text-sm" placeholder={ph} />
              </div>
            ))}

            <div>
              <label className="block text-sm text-chalk-dim mb-1.5">Work Email *</label>
              <input type="email" value={form.email} onChange={set("email")}
                className="dark-input w-full px-4 py-3 text-sm" placeholder="you@brand.com" />
              {emailWarning(form.email) && (
                <p className="text-amber-400 text-xs mt-1">{emailWarning(form.email)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-chalk-dim mb-1.5">Industry *</label>
              <select value={form.industry} onChange={set("industry")} className="dark-select w-full px-4 py-3 text-sm">
                <option value="">Select your industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="purple-pill w-full py-3 text-sm disabled:opacity-50">
              {loading ? "Creating Account..." : "Create Brand Account →"}
            </button>

            <p className="text-center text-sm text-chalk-dim">
              Already have an account?{" "}
              <Link to="/login" className="text-gold hover:underline">Sign in</Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-chalk-faint mt-4">
          After registration you can connect your Instagram & YouTube accounts from your dashboard.
        </p>
      </div>

      {showTerms && (
        <TermsModal
          role="brand"
          onAccept={() => { setShowTerms(false); doRegister(); }}
          onClose={() => setShowTerms(false)}
        />
      )}
    </main>
  );
}
