import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "signup-role">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      await loginWithGoogle(cr.credential);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "signup-role") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-obsidian p-4">
        <div className="w-full max-w-xl">
          <button
            onClick={() => setMode("login")}
            className="flex items-center gap-2 text-sm text-chalk-dim hover:text-chalk mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </button>
          <h1 className="font-display text-3xl font-bold text-chalk mb-2 text-center">
            Create your account
          </h1>
          <p className="text-chalk-dim text-center mb-8">Choose how you want to use Kalakaarian</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div
              className="bento-card p-6 cursor-pointer"
              onClick={() => navigate("/influencer-register")}
            >
              <div className="text-2xl mb-3">🎬</div>
              <h3 className="font-display font-bold text-chalk text-lg mb-2">I'm a Creator</h3>
              <p className="text-chalk-dim text-sm mb-4">
                List your profile and get discovered by top brands
              </p>
              <button className="purple-pill w-full py-2 text-sm">Sign up as Creator</button>
            </div>
            <div
              className="bento-card p-6 cursor-pointer"
              onClick={() => navigate("/brand-register")}
            >
              <div className="text-2xl mb-3">🚀</div>
              <h3 className="font-display font-bold text-chalk text-lg mb-2">I'm a Brand</h3>
              <p className="text-chalk-dim text-sm mb-4">
                Find the perfect creators for your campaigns
              </p>
              <button className="gold-pill w-full py-2 text-sm">Sign up as Brand</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-obsidian p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl font-bold text-chalk tracking-tight">
            K KALAKAARIAN
          </Link>
          <p className="text-chalk-dim text-sm mt-1">Welcome back</p>
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="dark-input w-full px-4 py-3 text-sm"
                placeholder="••••••••"
              />
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

          <p className="text-center text-sm text-chalk-dim">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signup-role")}
              className="text-gold hover:underline font-medium"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
