import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

const COOLDOWN_S = 60;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => { document.title = "Forgot Password — Kalakaarian"; }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword(email.trim().toLowerCase());
      setSent(true);
      setCooldown(COOLDOWN_S);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-obsidian overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-fuchsia-600/5 to-pink-600/10 pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 text-chalk-dim hover:text-chalk text-xs mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </button>

        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center gap-2">
            <img src="/k-logo-no-bg.png" alt="Kalakaarian" className="h-10 w-auto" />
            <span className="font-mono text-sm uppercase tracking-[0.3em] font-bold text-chalk">KALAKAARIAN</span>
          </Link>
          <p className="text-chalk-dim text-sm mt-3">Reset your password</p>
        </div>

        <div className="bento-card p-6 space-y-5">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
              <h2 className="font-display text-xl font-bold text-chalk">Check your inbox</h2>
              <p className="text-sm text-chalk-dim leading-relaxed">
                If an account exists for that email, we sent a password reset link.
                It expires in 20 minutes.
              </p>
              <p className="text-xs text-chalk-faint">
                Did not get it? Check spam, then try again
                {cooldown > 0 ? ` in ${cooldown}s` : ""}.
              </p>
              <button
                disabled={cooldown > 0 || loading}
                onClick={() => { setSent(false); setError(""); }}
                className="text-xs text-gold hover:underline disabled:opacity-40 disabled:no-underline"
              >
                Send another link
              </button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-display text-xl font-bold text-chalk mb-1">Forgot password?</h2>
                <p className="text-sm text-chalk-dim">Enter the email associated with your account.</p>
              </div>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-chalk-dim mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk-faint" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="dark-input w-full pl-10 pr-4 py-3 text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="purple-pill w-full py-3 text-sm disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <p className="text-center text-xs text-chalk-faint">
                Remembered it? <Link to="/login" className="text-gold hover:underline">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
