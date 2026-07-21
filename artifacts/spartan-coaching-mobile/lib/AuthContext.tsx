import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchMeMobile,
  loginMobile,
  logoutMobile,
  type MobileAuthUser,
} from "@/lib/api";

type AuthContextValue = {
  user: MobileAuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  canUseFieldKit: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: MobileAuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await fetchMeMobile();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginMobile(email, password);
    setUser({
      member: data.member,
      organization: data.organization,
      fieldKit: data.fieldKit,
    });
  }, []);

  const logout = useCallback(async () => {
    await logoutMobile();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user?.member,
      canUseFieldKit: !!user?.fieldKit?.allowed,
      refresh,
      login,
      logout,
      setUser,
    }),
    [user, isLoading, refresh, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}
