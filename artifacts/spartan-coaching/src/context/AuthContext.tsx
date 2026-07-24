import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthMember = {
  id: number;
  email: string;
  name: string;
  title?: string | null;
  role: string;
  organizationId: number;
  status: string;
  lastLoginAt?: string | null;
  jobRole?: string | null;
  territoryNote?: string | null;
  topObjections?: string | null;
  checklistProgress?: Record<string, boolean | string>;
  checklistDone?: number;
  activated?: boolean;
};

export type AuthOrganization = {
  id: number;
  name: string;
  type: string;
  seatLimit: number;
  status: string;
  trialEndsAt?: string | null;
  activatedAt?: string | null;
  seatCount?: number;
  // Billing (Phase 1+)
  billingPlan?: string | null;
  billingStatus?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  billableSeats?: number | null;
  contractRef?: string | null;
  hasStripeCustomer?: boolean;
  hasStripeSubscription?: boolean;
};

export type FieldKitState = {
  allowed: boolean;
  reason?: string | null;
  trialEndsAt?: string | null;
  hoursRemaining?: number | null;
};

type AuthContextValue = {
  member: AuthMember | null;
  organization: AuthOrganization | null;
  fieldKit: FieldKitState | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  canUseFieldKit: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<{
    member: AuthMember;
    organization: AuthOrganization | null;
    fieldKit: FieldKitState;
  }>;
  logout: () => Promise<void>;
  setSessionFromResponse: (data: {
    member: AuthMember;
    organization: AuthOrganization | null;
    fieldKit: FieldKitState;
  }) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(): Promise<{
  member: AuthMember;
  organization: AuthOrganization | null;
  fieldKit: FieldKitState;
} | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load session");
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<AuthMember | null>(null);
  const [organization, setOrganization] = useState<AuthOrganization | null>(null);
  const [fieldKit, setFieldKit] = useState<FieldKitState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apply = useCallback(
    (data: {
      member: AuthMember;
      organization: AuthOrganization | null;
      fieldKit: FieldKitState;
    } | null) => {
      if (!data) {
        setMember(null);
        setOrganization(null);
        setFieldKit(null);
        return;
      }
      setMember(data.member);
      setOrganization(data.organization);
      setFieldKit(data.fieldKit);
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const data = await fetchMe();
      apply(data);
    } catch {
      apply(null);
    } finally {
      setIsLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      const session = {
        member: data.member as AuthMember,
        organization: (data.organization ?? null) as AuthOrganization | null,
        fieldKit: data.fieldKit as FieldKitState,
      };
      apply(session);
      return session;
    },
    [apply],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      apply(null);
    }
  }, [apply]);

  const setSessionFromResponse = useCallback(
    (data: {
      member: AuthMember;
      organization: AuthOrganization | null;
      fieldKit: FieldKitState;
    }) => {
      apply(data);
    },
    [apply],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      member,
      organization,
      fieldKit,
      isLoading,
      isAuthenticated: !!member,
      canUseFieldKit: !!fieldKit?.allowed,
      refresh,
      login,
      logout,
      setSessionFromResponse,
    }),
    [
      member,
      organization,
      fieldKit,
      isLoading,
      refresh,
      login,
      logout,
      setSessionFromResponse,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
