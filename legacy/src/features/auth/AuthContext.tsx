import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { SessionUser } from "../../types";
import { api } from "../../lib/api";
interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshUser = useCallback(async () => {
    setLoading(true);
    const result = await api.get<{ user: SessionUser }>("/api/auth/me");
    setUser(result.error ? null : result.data?.user ?? null);
    setLoading(false);
  }, []);
  useEffect(() => {
    void refreshUser();
    const revalidate = () => { if (document.visibilityState === "visible") void refreshUser(); };
    window.addEventListener("pageshow", revalidate);
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    const timer = window.setInterval(revalidate, 60_000);
    return () => {
      window.removeEventListener("pageshow", revalidate);
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
      window.clearInterval(timer);
    };
  }, [refreshUser]);
  const logout = async () => {
    setError(null);
    const result = await api.post("/api/auth/logout");
    if (result.error) { setError("Could not sign out. Please try again."); return; }
    setUser(null);
    window.location.assign("/");
  };
  return <AuthContext.Provider value={{ user, loading, error, logout, refreshUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
