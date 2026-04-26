import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const INDUSTRIES = [
  "Fashion",
  "Technology",
  "Food & Beverage",
  "Health & Wellness",
  "Finance",
  "Entertainment",
  "Retail",
  "Education",
  "Other",
];

interface BrandForm {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  industry: string;
}

export default function BrandRegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState<BrandForm>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    password: "",
    industry: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set =
    (key: keyof BrandForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { companyName, contactName, email, phone, password, industry } = form;
    if (!companyName || !contactName || !email || !phone || !password || !industry) {
      setError("All fields are required.");
      return;
    }
    setError("");
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
      });
      navigate("/brand/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-obsidian flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
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
            <select
              value={form.industry}
              onChange={set("industry")}
              className="dark-select w-full px-4 py-3 text-sm"
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
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
    </main>
  );
}
