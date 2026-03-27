import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState<LoginFormData>({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loginMethod === "email") {
      if (!form.email.trim() || !form.password.trim()) {
        setError("Please enter both email/username and password.");
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
    }
  };

  const handlePhoneLogin = async () => {
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    setError("");
    setOtpLoading(true);

    try {
      await api.loginWithPhone(phone);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.verifyPhoneOTP(phone, otp);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError("Google login failed. Please try again.");
      return;
    }

    setGoogleLoading(true);
    setError("");

    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate("/role-select");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

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
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                width="100%"
                text="signin_with"
                shape="rectangular"
              />
            </GoogleOAuthProvider>

            {googleLoading && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={loginMethod === "email" ? "default" : "outline"}
                className="flex-1"
                onClick={() => { setLoginMethod("email"); setError(""); setOtpSent(false); }}
              >
                Email / Username
              </Button>
              <Button
                type="button"
                variant={loginMethod === "phone" ? "default" : "outline"}
                className="flex-1"
                onClick={() => { setLoginMethod("phone"); setError(""); setOtpSent(false); }}
              >
                <Phone className="h-4 w-4 mr-2" />
                Phone
              </Button>
            </div>

            {loginMethod === "email" ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email or Username</Label>
                  <Input
                    id="email"
                    type="text"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="you@example.com or username"
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
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                {!otpSent ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button className="w-full" onClick={handlePhoneLogin} disabled={otpLoading}>
                      {otpLoading ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value)}
                        placeholder="123456"
                        maxLength={6}
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button className="w-full" onClick={handleVerifyOTP} disabled={loading}>
                      {loading ? "Verifying..." : "Verify & Login"}
                    </Button>
                    <Button variant="link" className="w-full" onClick={() => { setOtpSent(false); setOtp(""); }}>
                      Change phone number
                    </Button>
                  </>
                )}
              </div>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link to="/role-select" className="font-semibold text-purple-700 hover:text-purple-900">
                Get Started
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
