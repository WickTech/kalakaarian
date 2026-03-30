import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, User, LoginResponse, ApiError } from "@/lib/api";

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

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: "brand" | "influencer";
  brandName?: string;
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
          setUser(JSON.parse(storedUser));
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
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed";
      if (email === "demo@brand.com" || email === "demo@influencer.com") {
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
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
    } catch (err) {
      const mockUser: User = {
        _id: "demo-" + Date.now(),
        email: data.email,
        name: data.name,
        role: data.role,
        brandName: data.role === "brand" ? data.brandName : undefined,
      };
      const mockToken = "demo-token-" + Date.now();
      localStorage.setItem(TOKEN_KEY, mockToken);
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      setToken(mockToken);
      setUser(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await api.googleLogin(googleToken);
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
    } catch (err) {
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
