import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { INDIA_STATES } from "@/lib/constants";
import { TermsModal } from "@/components/TermsModal";

const INDUSTRIES = [
  "Fashion", "Technology", "Food & Beverage", "Health & Wellness",
  "Finance", "Entertainment", "Retail", "Education", "Other",
];

interface BrandForm {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  industry: string;
  state: string;
}

export default function BrandRegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState<BrandForm>({
    companyName: "", contactName: "", email: "", phone: "",
    password: "", confirmPassword: "", industry: "", state: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const set =
    (key: keyof BrandForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { companyName, contactName, email, phone, password, confirmPassword, industry, state } = form;
    if (!companyName || !contactName || !email || !phone || !password || !confirmPassword || !industry || !state) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setShowTerms(true);
  };

  const doRegister = async () => {
    const { companyName, contactName, email, phone, password, industry } = form;
    setLoading(true);
    try {
      await register({
        email,
        phone,
        password,
        name: contactName,
        role: "brand",
        companyName,
        industry,
        termsAccepted: true,
      });
      navigate("/brand/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
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
        <Link
          to="/login"
          className="flex items-center gap-2 text-sm text-chalk-dim hover:text-chalk mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <h1 className="font-display text-3xl font-bold text-chalk mb-1">Brand Registration</h1>
        <p className="text-chalk-dim text-sm mb-6">
          Create your account to start discovering creators.
        </p>

        <form onSubmit={onSubmit} className="bento-card p-6 space-y-4">
          {(
            [
              { key: "contactName", label: "Full Name", type: "text", ph: "Jane Doe" },
              { key: "email", label: "Work Email", type: "email", ph: "you@brand.com" },
              { key: "phone", label: "WhatsApp Number", type: "tel", ph: "+91 9876543210" },
              { key: "companyName", label: "Brand / Company Name", type: "text", ph: "Acme Corp" },
              { key: "password", label: "Password", type: "password", ph: "Min 8 characters" },
              { key: "confirmPassword", label: "Confirm Password", type: "password", ph: "Re-enter password" },
            ] as const
          ).map(({ key, label, type, ph }) => (
            <div key={key}>
              <label className="block text-sm text-chalk-dim mb-1.5">{label} *</label>
              <input
                type={type}
                value={form[key]}
                onChange={set(key)}
                className="dark-input w-full px-4 py-3 text-sm"
                placeholder={ph}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm text-chalk-dim mb-1.5">Industry *</label>
            <select value={form.industry} onChange={set("industry")} className="dark-select w-full px-4 py-3 text-sm">
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-chalk-dim mb-1.5">State *</label>
            <select value={form.state} onChange={set("state")} className="dark-select w-full px-4 py-3 text-sm">
              <option value="">Select state</option>
              {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="purple-pill w-full py-3 text-sm mt-2 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account →"}
          </button>

          <p className="text-center text-sm text-chalk-dim">
            Already have an account?{" "}
            <Link to="/login" className="text-gold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
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
