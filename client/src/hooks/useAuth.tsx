import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, User, LoginResponse, ApiError, RegisterData } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleToken: string, role?: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "kalakariaan_token";
const USER_KEY = "kalakariaan_user";

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
          setUser(JSON.parse(storedUser) as User);
        }
      } catch {
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
      if (!response.user.id) throw new Error("Server response missing user id");
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed";
      if (!(err instanceof ApiError) && (email === "demo@brand.com" || email === "demo@influencer.com")) {
        const isBrand = email === "demo@brand.com";
        const mockUser: User = {
          id: "demo-id",
          email,
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
      if (!response.user.id) throw new Error("Server response missing user id");
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken: string, role?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await api.googleLogin(googleToken, role);
      if (!response.user.id) throw new Error("Server response missing user id");
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
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
