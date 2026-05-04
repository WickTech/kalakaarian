import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<"creator" | "brand">("creator");

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const showGoogle =
    GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "your-google-client-id.apps.googleusercontent.com";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (cr: { credential?: string }) => {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle(cr.credential, role === "creator" ? "influencer" : "brand");
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed.");
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
        {/* Back button */}
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-chalk-dim hover:text-chalk text-xs mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </button>

        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center gap-2">
            <img src="/k-logo-no-bg.png" alt="Kalakaarian" className="h-10 w-auto" />
            <span className="font-mono text-sm uppercase tracking-[0.3em] font-bold text-chalk">KALAKAARIAN</span>
          </Link>
          <p className="text-chalk-dim text-sm mt-3">Welcome back</p>
        </div>

        {/* Role toggle */}
        <div className="flex rounded-full border border-white/10 overflow-hidden mb-5 text-xs">
          {(["creator", "brand"] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex-1 py-2 font-medium transition-all capitalize ${role === r ? "bg-white/10 text-chalk" : "text-chalk-dim"}`}>
              {r === "creator" ? "I'm a Creator" : "I'm a Brand"}
            </button>
          ))}
        </div>

        <div className="bento-card p-6 space-y-5">
          {showGoogle && (
            <>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google login failed")}
                  useOneTap
                  theme="filled_blue"
                  shape="rectangular"
                  width="336"
                />
              </div>
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="mx-4 text-xs text-chalk-faint uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-white/10" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-chalk-dim mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="dark-input w-full px-4 py-3 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-chalk-dim mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="dark-input w-full px-4 py-3 text-sm pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-chalk-faint hover:text-chalk transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="purple-pill w-full py-3 text-sm disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="text-center text-sm text-chalk-dim">
            {role === "creator" ? (
              <p>New here? <Link to="/influencer-register" className="text-gold hover:underline font-medium">Join as Creator</Link></p>
            ) : (
              <p>New here? <Link to="/brand-register" className="text-gold hover:underline font-medium">Register as Brand</Link></p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
