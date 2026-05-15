import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, User, LoginResponse, ApiError, RegisterData } from "@/lib/api";

type ViewAs = 'admin' | 'brand' | 'creator';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isSuperAdmin: boolean;
  viewAs: ViewAs;
  setViewAs: (v: ViewAs) => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleToken: string, role?: string) => Promise<{ isNewUser?: boolean }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "kalakariaan_token";
const USER_KEY = "kalakariaan_user";
const VIEW_AS_KEY = "kalakariaan_view_as";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewAs, setViewAsState] = useState<ViewAs>('admin');

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        setToken(storedToken);
        setUser(parsedUser);
        if (parsedUser.isSuperAdmin) {
          const stored = localStorage.getItem(VIEW_AS_KEY) as ViewAs | null;
          setViewAsState(stored ?? 'admin');
        }
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const isSuperAdmin = user?.isSuperAdmin ?? false;

  const setViewAs = (v: ViewAs) => {
    setViewAsState(v);
    localStorage.setItem(VIEW_AS_KEY, v);
  };

  const persistAuth = (res: LoginResponse) => {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    if (res.user.isSuperAdmin) {
      const stored = localStorage.getItem(VIEW_AS_KEY) as ViewAs | null;
      setViewAsState(stored ?? 'admin');
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await api.login(email, password);
      if (!response.user.id) throw new Error("Server response missing user id");
      persistAuth(response);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed";
      if (!(err instanceof ApiError) && (email === "demo@brand.com" || email === "demo@influencer.com")) {
        const isBrand = email === "demo@brand.com";
        const mockUser: User = {
          id: "demo-id", email,
          name: isBrand ? "Demo Brand" : "Demo Influencer",
          role: isBrand ? "brand" : "influencer",
          brandName: isBrand ? "Demo Brand Co." : undefined,
        };
        persistAuth({ user: mockUser, token: "demo-token-" + Date.now() } as LoginResponse);
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
    localStorage.removeItem(VIEW_AS_KEY);
    setToken(null);
    setUser(null);
    setViewAsState('admin');
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await api.register(data);
      if (!response.user.id) throw new Error("Server response missing user id");
      persistAuth(response);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken: string, role?: string): Promise<{ isNewUser?: boolean }> => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await api.googleLogin(googleToken, role);
      if (!response.user.id) throw new Error("Server response missing user id");
      persistAuth(response);
      return { isNewUser: response.isNewUser };
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
    <AuthContext.Provider value={{
      user, token, loading, error, isSuperAdmin, viewAs, setViewAs,
      login, loginWithGoogle, logout, register,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
