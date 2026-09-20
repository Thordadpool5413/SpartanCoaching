import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  refresh: (options?: { force?: boolean }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: MobileAuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_CACHE_KEY = "spartan_mobile_auth_cache_v1";

async function readCachedUser(): Promise<MobileAuthUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MobileAuthUser;
    return parsed?.member?.id ? parsed : null;
  } catch {
    return null;
  }
}

async function cacheUser(user: MobileAuthUser | null): Promise<void> {
  try {
    if (user) {
      await SecureStore.setItemAsync(AUTH_CACHE_KEY, JSON.stringify(user), {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      await SecureStore.deleteItemAsync(AUTH_CACHE_KEY);
    }
  } catch {
    // A cache failure must never block authentication.
  }
}

function shouldClaimApplePurchase(data: MobileAuthUser) {
  return data.organization?.type === "personal";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const lastRefreshAt = useRef(0);

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    if (refreshInFlight.current) return refreshInFlight.current;
    if (!options?.force && Date.now() - lastRefreshAt.current < 15_000) return;

    const request = (async () => {
      try {
        const me = await fetchMeMobile();
        setUser(me);
        void cacheUser(me);
        setActiveSyncMember(me?.member.id ?? null);
        if (me?.member.id) void syncMemberData(me.member.id);
        lastRefreshAt.current = Date.now();
      } catch {
        // Keep last known session on network/5xx (fetchMeMobile only nulls on 401).
      } finally {
        setIsLoading(false);
        refreshInFlight.current = null;
      }
    })();

    refreshInFlight.current = request;
    return request;
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      const cached = await readCachedUser();
      if (active && cached) {
        // Render a last-known account shell immediately, then verify it in the background.
        setUser(cached);
        setActiveSyncMember(cached.member.id);
        setIsLoading(false);
        void syncMemberData(cached.member.id);
      }
      if (active) void refresh({ force: true });
    })();

    return () => {
      active = false;
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginMobile(email, password);
    const nextUser = {
      member: data.member,
      organization: data.organization,
      fieldKit: data.fieldKit,
    };
    setUser(nextUser);
    void cacheUser(nextUser);
    setActiveSyncMember(data.member.id);
    void syncMemberData(data.member.id);
    try {
      if (shouldClaimApplePurchase(data) && await claimCurrentApplePurchases()) {
        const refreshed = await fetchMeMobile();
        if (refreshed) {
          setUser(refreshed);
          void cacheUser(refreshed);
        }
      }
    } catch {
      // Signing in must still succeed if StoreKit is temporarily unavailable.
    }
  }, []);

  const register = useCallback(async (input: { name: string; email: string; password: string }) => {
    const data = await registerMobile(input);
    const nextUser = {
      member: data.member,
      organization: data.organization,
      fieldKit: data.fieldKit,
    };
    setUser(nextUser);
    void cacheUser(nextUser);
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
    void cacheUser(null);
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
