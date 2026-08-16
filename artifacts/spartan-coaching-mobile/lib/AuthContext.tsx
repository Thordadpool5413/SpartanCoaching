import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchMeMobile,
  loginMobile,
  logoutMobile,
  type MobileAuthUser,
} from "@/lib/api";
import { hasEliteMembership, resolveMembershipTier, type MembershipTier } from "@workspace/field-kit-catalog";

type AuthContextValue = {
  user: MobileAuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  canUseFieldKit: boolean;
  canUseElite: boolean;
  membershipTier: MembershipTier;
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
      // Keep last known session on network/5xx (fetchMeMobile only nulls on 401).
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
    () => {
      const membershipInput = {
        billingPlan: user?.organization?.billingPlan,
        organizationType: user?.organization?.type,
        memberRole: user?.member?.role,
      };
      return {
        user,
        isLoading,
        isAuthenticated: !!user?.member,
        canUseFieldKit: !!user?.fieldKit?.allowed,
        canUseElite: !!user?.fieldKit?.allowed && hasEliteMembership(membershipInput),
        membershipTier: resolveMembershipTier(membershipInput),
        refresh,
        login,
        logout,
        setUser,
      };
    },
    [user, isLoading, refresh, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}
