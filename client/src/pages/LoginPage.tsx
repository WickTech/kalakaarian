import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Star } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "signup-role">("login");
  const [form, setForm] = useState<LoginFormData>({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const showGoogleLogin = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "your-google-client-id.apps.googleusercontent.com";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle(credentialResponse.credential);
      navigate("/dashboard");
    } catch (err) {
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (selectedRole: "brand" | "influencer") => {
    if (selectedRole === "brand") {
      navigate("/brand-register");
    } else {
      navigate("/influencer-register");
    }
  };

  if (mode === "signup-role") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-12">
        <div className="w-full max-w-5xl space-y-6">
          <Link 
            to="#" 
            onClick={() => setMode("login")}
            className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="text-center text-white">
            <h1 className="text-3xl font-black sm:text-4xl">Create your account</h1>
            <p className="mt-2 text-white/90">Choose how you want to use Kalakaarian</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card 
              className="border-0 bg-white/95 shadow-xl cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
              onClick={() => handleRoleSelect("influencer")}
            >
              <CardHeader>
                <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Star className="h-5 w-5" />
                </div>
                <CardTitle>I'm an Influencer</CardTitle>
                <CardDescription>List your profile and get discovered by top brands</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-95">
                  Sign up as Influencer
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="border-0 bg-white/95 shadow-xl cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => handleRoleSelect("brand")}
            >
              <CardHeader>
                <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <CardTitle>I'm a Brand</CardTitle>
                <CardDescription>Find the perfect influencers for your campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-95">
                  Sign up as Brand
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Kalakaarian</p>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue to your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showGoogleLogin && (
              <>
                <div className="flex flex-col items-center justify-center space-y-4 pt-2">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Google login failed")}
                    useOneTap
                    theme="filled_blue"
                    shape="rectangular"
                    width="100%"
                  />
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-muted" />
                  <span className="mx-4 flex-shrink text-xs uppercase text-muted-foreground">Or continue with</span>
                  <div className="flex-grow border-t border-muted" />
                </div>
              </>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button 
                type="button"
                onClick={() => setMode("signup-role")} 
                className="font-semibold text-purple-700 hover:text-purple-900"
              >
                Sign Up
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
