import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchMeMobile,
  loginMobile,
  logoutMobile,
  registerMobile,
  type MobileAuthUser,
} from "@/lib/api";
import { hasContractedOrganizationAdminAccess, hasEliteMembership, resolveMembershipTier, type MembershipTier } from "@workspace/field-kit-catalog";
import { claimCurrentApplePurchases } from "@/lib/applePurchaseSession";
import { setActiveSyncMember, syncMemberData } from "@/lib/memberSync";

type AuthContextValue = {
  user: MobileAuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  canUseFieldKit: boolean;
  canUseElite: boolean;
  canManageOrganization: boolean;
  membershipTier: MembershipTier;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: MobileAuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function shouldClaimApplePurchase(data: MobileAuthUser) {
  return data.organization?.type === "personal";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await fetchMeMobile();
      setUser(me);
      setActiveSyncMember(me?.member.id ?? null);
      if (me?.member.id) void syncMemberData(me.member.id);
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
    setActiveSyncMember(data.member.id);
    void syncMemberData(data.member.id);
    try {
      if (shouldClaimApplePurchase(data) && await claimCurrentApplePurchases()) {
        const refreshed = await fetchMeMobile();
        if (refreshed) setUser(refreshed);
      }
    } catch {
      // Signing in must still succeed if StoreKit is temporarily unavailable.
    }
  }, []);

  const register = useCallback(async (input: { name: string; email: string; password: string }) => {
    const data = await registerMobile(input);
    setUser({
      member: data.member,
      organization: data.organization,
      fieldKit: data.fieldKit,
    });
    setActiveSyncMember(data.member.id);
    void syncMemberData(data.member.id);
    try {
      if (shouldClaimApplePurchase(data) && await claimCurrentApplePurchases()) {
        const refreshed = await fetchMeMobile();
        if (refreshed) setUser(refreshed);
      }
    } catch {
      // Account creation must still succeed. Restore remains available in app.
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutMobile();
    setUser(null);
    setActiveSyncMember(null);
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
        canManageOrganization: hasContractedOrganizationAdminAccess({
          memberRole: user?.member?.role,
          organizationType: user?.organization?.type,
          organizationStatus: user?.organization?.status,
          billingPlan: user?.organization?.billingPlan,
        }),
        membershipTier: resolveMembershipTier(membershipInput),
        refresh,
        login,
        register,
        logout,
        setUser,
      };
    },
    [user, isLoading, refresh, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}
