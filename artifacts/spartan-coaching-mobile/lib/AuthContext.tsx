import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  fetchMeMobile,
  getSessionToken,
  loginMobile,
  logoutMobile,
  refreshSessionMobile,
  type MobileAuthUser,
} from "@/lib/api";

/** Throttle session token rotation (matches server session lifetime intent). */
const SESSION_REFRESH_MIN_MS = 60 * 60 * 1000;

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
  const lastSessionRefreshRef = useRef(0);

  const maybeRotateSession = useCallback(async () => {
    const now = Date.now();
    if (now - lastSessionRefreshRef.current < SESSION_REFRESH_MIN_MS) return;
    const token = await getSessionToken();
    if (!token) return;
    try {
      await refreshSessionMobile();
      lastSessionRefreshRef.current = now;
    } catch {
      // Rotation is best-effort; fetchMe still decides auth state.
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      await maybeRotateSession();
      const me = await fetchMeMobile();
      setUser(me);
    } catch {
      // Keep last known session on network/5xx (fetchMeMobile only nulls on 401).
    } finally {
      setIsLoading(false);
    }
  }, [maybeRotateSession]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === "active") {
        void refresh();
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginMobile(email, password);
    lastSessionRefreshRef.current = Date.now();
    setUser({
      member: data.member,
      organization: data.organization,
      fieldKit: data.fieldKit,
    });
  }, []);

  const logout = useCallback(async () => {
    await logoutMobile();
    lastSessionRefreshRef.current = 0;
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
