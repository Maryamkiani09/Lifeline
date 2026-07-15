import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getTokens, setTokens, clearTokens } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, username, role, ... }
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    const tokens = getTokens();
    if (!tokens?.access) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get("/api/auth/me/");
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // Used after any register/login endpoint returns {access, refresh, ...}
  const applyTokensAndLoadUser = async (tokens) => {
    setTokens({ access: tokens.access, refresh: tokens.refresh });
    await loadCurrentUser();
  };

  const login = async (username, password) => {
    const data = await api.post("/api/auth/login/", { username, password }, { auth: false });
    await applyTokensAndLoadUser(data);
    return data;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, applyTokensAndLoadUser, refreshUser: loadCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
