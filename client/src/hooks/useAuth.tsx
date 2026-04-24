import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, User, LoginResponse, ApiError, RegisterData } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "token";
const USER_KEY = "user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          // Normalise legacy stored users that only have `id` (pre-fix sessions)
          const parsed = JSON.parse(storedUser) as User & { id?: string };
          const hydrated: User = { ...parsed, _id: parsed._id || parsed.id || "" };
          setUser(hydrated);
        }
      } catch (err) {
        console.error("Failed to parse stored auth data:", err);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await api.login(email, password);
      // Normalise: server login returns `id` not `_id`; ensure _id is always set
      const rawLogin = response.user as User & { id?: string };
      const resolvedLoginId = rawLogin._id || rawLogin.id;
      if (!resolvedLoginId) throw new Error("Server response missing user id");
      const loginUser: User = { ...rawLogin, _id: resolvedLoginId };
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(loginUser));
      setToken(response.token);
      setUser(loginUser);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed";
      // Demo bypass only for network failures (no server response), not auth errors
      if (!(err instanceof ApiError) && (email === "demo@brand.com" || email === "demo@influencer.com")) {
        const isBrand = email === "demo@brand.com";
        const mockUser: User = {
          _id: "demo-id",
          email: email,
          name: isBrand ? "Demo Brand" : "Demo Influencer",
          role: isBrand ? "brand" : "influencer",
          brandName: isBrand ? "Demo Brand Co." : undefined,
        };
        const mockToken = "demo-token-" + Date.now();
        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        setToken(mockToken);
        setUser(mockUser);
        return;
      }
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await api.register(data);
      // Normalise: server returns both `id` and `_id`; ensure _id is always set
      const raw = response.user as User & { id?: string };
      const resolvedId = raw._id || raw.id;
      if (!resolvedId) throw new Error("Server response missing user id");
      const user: User = { ...raw, _id: resolvedId };
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setToken(response.token);
      setUser(user);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await api.googleLogin(googleToken);
      // Normalise: server googleLogin returns `id` not `_id`; ensure _id is always set
      const rawGoogle = response.user as User & { id?: string };
      const resolvedGoogleId = rawGoogle._id || rawGoogle.id;
      if (!resolvedGoogleId) throw new Error("Server response missing user id");
      const googleUser: User = { ...rawGoogle, _id: resolvedGoogleId };
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(googleUser));
      setToken(response.token);
      setUser(googleUser);
    } catch (err) {
      console.error('Google login API error:', err);
      const message = err instanceof ApiError ? err.message : "Google login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, loginWithGoogle, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
