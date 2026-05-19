import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type ValidState = "loading" | "ok" | "expired" | "used" | "invalid";

const passwordScore = (p: string): { score: 0 | 1 | 2 | 3 | 4; label: string } => {
  if (!p) return { score: 0, label: "" };
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (p.length >= 14) s = Math.min(4, s + 1) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Very strong"];
  return { score: s as 0 | 1 | 2 | 3 | 4, label: labels[s] };
};

const strongRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [valid, setValid] = useState<ValidState>("loading");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => { document.title = "Reset Password — Kalakaarian"; }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!token || !/^[a-f0-9]{64}$/.test(token)) { setValid("invalid"); return; }
      try {
        const res = await api.validateResetToken(token);
        if (cancel) return;
        if (res.valid) setValid("ok");
        else setValid(res.reason ?? "invalid");
      } catch {
        if (!cancel) setValid("invalid");
      }
    })();
    return () => { cancel = true; };
  }, [token]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(t);
  }, [done, navigate]);

  const strength = useMemo(() => passwordScore(pw), [pw]);
  const meetsRules = strongRe.test(pw);
  const matches = pw.length > 0 && pw === pw2;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !meetsRules || !matches) return;
    setError("");
    setLoading(true);
    try {
      await api.resetPassword(token, pw);
      setDone(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not update password. Try again.";
      setError(msg);
      if (err instanceof ApiError && /invalid or expired/i.test(err.message)) {
        setValid("expired");
      }
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = ["bg-red-500", "bg-red-400", "bg-amber-400", "bg-lime-400", "bg-green-500"][strength.score];

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
          <p className="text-chalk-dim text-sm mt-3">Set a new password</p>
        </div>

        <div className="bento-card p-6 space-y-5">
          {valid === "loading" && (
            <div className="text-center py-8 text-chalk-dim">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
              <p className="text-sm">Validating link...</p>
            </div>
          )}

          {(valid === "expired" || valid === "used" || valid === "invalid") && !done && (
            <div className="text-center py-4 space-y-4">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
              <h2 className="font-display text-xl font-bold text-chalk">
                {valid === "expired" && "Link expired"}
                {valid === "used" && "Link already used"}
                {valid === "invalid" && "Invalid link"}
              </h2>
              <p className="text-sm text-chalk-dim leading-relaxed">
                {valid === "expired" && "Reset links expire after 20 minutes. Request a new one."}
                {valid === "used" && "This link was already used. Request a new one if you need to reset again."}
                {valid === "invalid" && "This reset link is invalid or malformed."}
              </p>
              <Link to="/forgot-password" className="purple-pill inline-block px-6 py-2 text-sm">
                Request new link
              </Link>
            </div>
          )}

          {valid === "ok" && !done && (
            <>
              <div>
                <h2 className="font-display text-xl font-bold text-chalk mb-1">Create new password</h2>
                <p className="text-sm text-chalk-dim">8+ chars, with upper, lower, number, special.</p>
              </div>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-chalk-dim mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      autoFocus
                      className="dark-input w-full px-4 py-3 text-sm pr-10"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-chalk-faint hover:text-chalk transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pw && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded ${i < strength.score ? strengthColor : "bg-white/10"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-chalk-faint mt-1">{strength.label}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-chalk-dim mb-1.5">Confirm password</label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    className="dark-input w-full px-4 py-3 text-sm"
                    placeholder="••••••••"
                  />
                  {pw2 && !matches && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !meetsRules || !matches}
                  className="purple-pill w-full py-3 text-sm disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            </>
          )}

          {done && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
              <h2 className="font-display text-xl font-bold text-chalk">Password updated</h2>
              <p className="text-sm text-chalk-dim">All other sessions were signed out. Redirecting to login...</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
