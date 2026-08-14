/**
 * Single mission engine — Home, Command hub, and workflow empty states
 * must derive primary CTA from here so product story never fights itself.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { apiGet, fetchOnboardingMobile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import {
  formatTrialRemaining,
  isChecklistDone,
  START_HERE,
  visibleChecklist,
  type ChecklistDef,
} from "@/lib/onboarding";
import { openToolHref } from "@/lib/toolDeepLinks";

export type MissionShell = "logged_out" | "locked" | "entitled";

export type WorkflowCall = {
  id: string;
  version: number;
  purpose: string;
  status: string;
  schedule: { startsAt: string; durationMinutes: number };
};

export type TodayResponse = {
  calls: WorkflowCall[];
  plans: Array<{ id: string; callId: string; version: number; status: string }>;
  actions: Array<{ id: string; title: string; status: string; dueAt?: string }>;
  syncJobs: Array<{ id: string; status: string }>;
};

export type MissionPrimary = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  /** expo-router target */
  href: { pathname: string; params?: Record<string, string> };
  kind: "role" | "checklist" | "command" | "subscribe" | "login" | "activation";
};

export type MissionState = {
  shell: MissionShell;
  loading: boolean;
  jobRole: string;
  checklist: Record<string, boolean | string>;
  checklistItems: ChecklistDef[];
  nextChecklistItem: ChecklistDef | null;
  progressPct: number;
  trialLabel: string | null;
  firstName: string;
  today: TodayResponse | null;
  todayLoading: boolean;
  todayError: string | null;
  primary: MissionPrimary | null;
  secondary: Array<{ title: string; href: { pathname: string; params?: Record<string, string> } }>;
  refreshAll: () => Promise<void>;
  setJobRoleLocal: (role: string) => void;
  setChecklistLocal: (c: Record<string, boolean | string>) => void;
};

const emptyToday: TodayResponse = { calls: [], plans: [], actions: [], syncJobs: [] };

export function useMission(): MissionState {
  const { canUseFieldKit, isAuthenticated, user, refresh } = useAuth();
  const [jobRole, setJobRole] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean | string>>({});
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState<string | null>(null);

  const shell: MissionShell = !isAuthenticated
    ? "logged_out"
    : canUseFieldKit
      ? "entitled"
      : "locked";

  const loadOnboarding = useCallback(async () => {
    if (!canUseFieldKit && !isAuthenticated) {
      setOnboardingLoading(false);
      return;
    }
    if (!isAuthenticated) {
      setOnboardingLoading(false);
      return;
    }
    try {
      const data = await fetchOnboardingMobile();
      setJobRole(data.member.jobRole || "");
      setChecklist(data.member.checklistProgress || {});
    } catch {
      // keep local
    } finally {
      setOnboardingLoading(false);
    }
  }, [canUseFieldKit, isAuthenticated]);

  const loadToday = useCallback(async () => {
    if (!canUseFieldKit) {
      setToday(null);
      return;
    }
    setTodayLoading(true);
    setTodayError(null);
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const data = await apiGet<TodayResponse>(
        `/api/v1/sales-workflow/today?from=${encodeURIComponent(start.toISOString())}&to=${encodeURIComponent(end.toISOString())}`,
      );
      setToday(data);
    } catch {
      setTodayError("Could not load today's calls.");
      setToday(emptyToday);
    } finally {
      setTodayLoading(false);
    }
  }, [canUseFieldKit]);

  const refreshAll = useCallback(async () => {
    await refresh();
    await Promise.all([loadOnboarding(), loadToday()]);
  }, [refresh, loadOnboarding, loadToday]);

  useFocusEffect(
    useCallback(() => {
      void loadOnboarding();
      void loadToday();
    }, [loadOnboarding, loadToday]),
  );

  useEffect(() => {
    void loadOnboarding();
  }, [loadOnboarding]);

  const checklistItems = useMemo(() => visibleChecklist(jobRole), [jobRole]);
  const nextChecklistItem =
    checklistItems.find((i) => !isChecklistDone(checklist, i.id)) ?? null;
  const doneCount = checklistItems.filter((i) => isChecklistDone(checklist, i.id)).length;
  const progressPct = checklistItems.length
    ? Math.round((doneCount / checklistItems.length) * 100)
    : 0;
  const trialLabel = formatTrialRemaining(user?.fieldKit?.hoursRemaining);
  const firstName = user?.member?.name?.split(" ")[0] || "";
  const needsRole = canUseFieldKit && !jobRole;

  const primary = useMemo((): MissionPrimary | null => {
    if (shell === "logged_out") {
      return {
        title: "Client login",
        subtitle: "Unlock Hospice Sales Pro tools on this iPhone.",
        ctaLabel: "Sign in",
        href: { pathname: "/login" },
        kind: "login",
      };
    }
    if (shell === "locked") {
      return {
        title: "Unlock Hospice Sales Pro",
        subtitle: "Subscribe or restore access to run live tools.",
        ctaLabel: "Open Account",
        href: { pathname: "/(tabs)/account" },
        kind: "subscribe",
      };
    }
    // entitled
    if (needsRole) {
      return {
        title: "Pick your role",
        subtitle: "Personalizes checklist and recommended tools.",
        ctaLabel: "Choose role on Home",
        href: { pathname: "/(tabs)" },
        kind: "role",
      };
    }
    // Prefer live Command day when there is a scheduled call (field loop beats checklist soup).
    const nextCall = today?.calls?.find((c) => c.status !== "completed" && c.status !== "cancelled");
    if (nextCall) {
      return {
        title: nextCall.purpose || "Next visit on Command Center",
        subtitle: "Open Command Center to prepare, practice, and complete this call.",
        ctaLabel: "Open Command Center",
        href: { pathname: "/(tabs)/command" },
        kind: "command",
      };
    }
    if (nextChecklistItem) {
      const href = nextChecklistItem.route
        ? { pathname: nextChecklistItem.route }
        : nextChecklistItem.toolTab
          ? openToolHref(nextChecklistItem.toolTab)
          : { pathname: "/(tabs)/tools" };
      return {
        title: nextChecklistItem.title,
        subtitle: nextChecklistItem.desc,
        ctaLabel: "Do this next",
        href,
        kind: "checklist",
      };
    }
    const start = START_HERE[jobRole || "other"] || START_HERE.other;
    return {
      title: start.title,
      subtitle: start.blurb,
      ctaLabel: "Open Command Center",
      href: { pathname: "/(tabs)/command" },
      kind: "command",
    };
  }, [shell, needsRole, nextChecklistItem, jobRole, today]);

  const secondary = useMemo(() => {
    if (shell !== "entitled") return [];
    const leader = ["director", "vp", "owner"].includes(jobRole);
    if (leader) {
      return [
        {
          title: "Branch / staffing math",
          href: { pathname: "/staffing" },
        },
        {
          title: "Weekly plan",
          href: openToolHref("weekly"),
        },
        {
          title: "Full Command workflow",
          href: { pathname: "/sales-workflow" },
        },
        {
          title: "Objection Handler",
          href: openToolHref("objection"),
        },
      ];
    }
    return [
      {
        title: "Objection Handler",
        href: openToolHref("objection"),
      },
      {
        title: "Weekly plan",
        href: openToolHref("weekly"),
      },
      {
        title: "Full Command workflow",
        href: { pathname: "/sales-workflow" },
      },
    ];
  }, [shell, jobRole]);

  return {
    shell,
    loading: onboardingLoading,
    jobRole,
    checklist,
    checklistItems,
    nextChecklistItem,
    progressPct,
    trialLabel,
    firstName,
    today,
    todayLoading,
    todayError,
    primary,
    secondary,
    refreshAll,
    setJobRoleLocal: setJobRole,
    setChecklistLocal: setChecklist,
  };
}
