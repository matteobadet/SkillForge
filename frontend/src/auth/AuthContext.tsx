import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, apiJson, clearTokens, getAccessToken, setTokens } from "../api/client";

export interface User {
  id: string;
  email: string;
  pseudo: string;
  avatarUrl: string | null;
  role: "Admin" | "Utilisateur";
  createdAt: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, pseudo: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await apiJson<User>("/api/users/me");
      setUser(me);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiJson<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.accessToken, data.refreshToken);
    // The login response's avatarUrl is always null (resolved asynchronously
    // only by GET /api/users/me) — refetch to get the real profile.
    await refreshUser();
  };

  const register = async (email: string, password: string, pseudo: string) => {
    const data = await apiJson<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, pseudo }),
    });
    setTokens(data.accessToken, data.refreshToken);
    await refreshUser();
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("skillforge.refreshToken");
    if (refreshToken) {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
