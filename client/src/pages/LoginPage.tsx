import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
  const [loginRole, setLoginRole] = useState<"brand" | "influencer">("brand");

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

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    console.log('Google credential received:', credentialResponse);
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle(credentialResponse.credential);
      navigate("/dashboard");
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : "Google login failed. Please try again.");
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
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl">
          <Link 
            to="#" 
            onClick={() => setMode("login")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-muted-foreground">Choose how you want to use Kalakaarian</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => handleRoleSelect("influencer")}
            >
              <CardHeader>
                <CardTitle className="text-lg">I'm an Influencer</CardTitle>
                <CardDescription>List your profile and get discovered by top brands</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full brand-gradient brand-gradient-hover text-primary-foreground">
                  Sign up as Influencer
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => handleRoleSelect("brand")}
            >
              <CardHeader>
                <CardTitle className="text-lg">I'm a Brand</CardTitle>
                <CardDescription>Find the perfect influencers for your campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full brand-gradient brand-gradient-hover text-primary-foreground">
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
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-2xl font-bold brand-text mb-2">Kalakaarian</h1>
          </Link>
          <p className="text-muted-foreground">Welcome back</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex rounded-lg bg-secondary p-1 mb-6">
              <button
                type="button"
                onClick={() => setLoginRole("brand")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  loginRole === "brand" 
                    ? "brand-gradient text-primary-foreground shadow-sm" 
                    : "text-muted-foreground"
                }`}
              >
                Brand
              </button>
              <button
                type="button"
                onClick={() => setLoginRole("influencer")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  loginRole === "influencer" 
                    ? "brand-gradient text-primary-foreground shadow-sm" 
                    : "text-muted-foreground"
                }`}
              >
                Influencer
              </button>
            </div>

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

              <Button type="submit" className="w-full brand-gradient brand-gradient-hover text-primary-foreground" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button 
                type="button"
                onClick={() => setMode("signup-role")} 
                className="font-medium text-primary hover:underline"
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
