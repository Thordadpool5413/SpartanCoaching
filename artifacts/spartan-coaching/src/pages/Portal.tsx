import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  MessageCircle,
  CalendarDays,
  Users,
  Shield,
  Phone,
  Clock,
  BookOpen,
  CheckCircle2,
  Circle,
  Flame,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Crosshair,
  CreditCard,
  Loader2,
} from "lucide-react";
import { FieldKitGate } from "@/components/FieldKitGate";
import { ToolDisclaimer } from "@/components/ToolDisclaimer";
import { FieldKitChrome } from "@/components/FieldKitChrome";
import { MembershipActivation } from "@/components/MembershipActivation";
import { useBillingActions } from "@/hooks/useBillingActions";
import { ProductMap } from "@/components/elite/ProductMap";
import { FIELD_KIT_WHAT, FIELD_KIT_WHY, FIELD_KIT_HOW } from "@/lib/fieldKitCatalog";
import { cn } from "@/lib/utils";

type ChecklistId = "objection" | "weekly_plan" | "roleplay" | "debrief" | "director_scorecard";

type ChecklistItem = {
  id: ChecklistId;
  title: string;
  desc: string;
  href: string;
  icon: typeof MessageCircle;
  roles?: Array<"rep" | "director" | "vp" | "owner" | "other">;
  /** Short label for the “do these 3” strip */
  short: string;
};

const ALL_CHECKLIST: ChecklistItem[] = [
  {
    id: "objection",
    title: "Handle one real objection",
    short: "One objection",
    desc: "Paste a live objection and get a field-ready response.",
    href: "/tools/objections",
    icon: MessageCircle,
  },
  {
    id: "weekly_plan",
    title: "Build this week’s plan",
    short: "Weekly plan",
    desc: "Turn accounts into a Monday–Friday territory rhythm.",
    href: "/tools/weekly-plan-builder",
    icon: CalendarDays,
  },
  {
    id: "roleplay",
    title: "Role-play your toughest scenario",
    short: "Role-play",
    desc: "Practice the conversation before you walk into the building.",
    href: "/tools/role-play",
    icon: Users,
  },
  {
    id: "director_scorecard",
    title: "Run the activity / scorecard math",
    short: "Activity math",
    desc: "Translate goals into daily conversations your team can execute.",
    href: "/tools/activity-calculator",
    icon: Target,
    roles: ["director", "vp", "owner"],
  },
  {
    id: "debrief",
    title: "Book a debrief call",
    short: "Debrief call",
    desc: "While your evaluation is open, talk through what you are seeing.",
    href: "/contact?service=Membership+Debrief",
    icon: Phone,
  },
];

const START_HERE: Record<string, { title: string; href: string; blurb: string }> = {
  rep: {
    title: "Open Sales Command Center",
    href: "/tools/sales-workflow",
    blurb:
      "Your daily spine: pick the next account, prepare the call, practice if needed, capture the outcome, and lock the next step.",
  },
  director: {
    title: "Open Sales Command Center",
    href: "/tools/sales-workflow",
    blurb:
      "See the team’s account rhythm. Coach from real calls—then use weekly plan and activity math as support tools.",
  },
  vp: {
    title: "Open Sales Command Center",
    href: "/tools/sales-workflow",
    blurb:
      "Inspect execution quality on live accounts. Use activity and ROI tools when you need the economic story.",
  },
  owner: {
    title: "Open Sales Command Center",
    href: "/tools/sales-workflow",
    blurb:
      "Growth runs on Tuesday behavior. Start with the call workflow; open branch economics when you need the P&L frame.",
  },
  other: {
    title: "Open Sales Command Center",
    href: "/tools/sales-workflow",
    blurb:
      "One continuous workflow beats opening ten tabs. Plan → practice → complete → next action.",
  },
};

function formatTrialRemaining(hours: number | null | undefined): string | null {
  if (hours == null) return null;
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `${mins} minute${mins === 1 ? "" : "s"} remaining`;
  }
  if (hours < 48) {
    const h = Math.round(hours);
    return `${h} hour${h === 1 ? "" : "s"} remaining in your evaluation`;
  }
  const d = Math.round(hours / 24);
  return `${d} day${d === 1 ? "" : "s"} remaining in your evaluation`;
}

function isDone(progress: Record<string, unknown> | undefined, id: string): boolean {
  if (!progress) return false;
  const v = progress[id];
  return v === true || (typeof v === "string" && v.length > 0);
}

export default function Portal() {
  const { member, organization, fieldKit, canUseFieldKit, isLoading, refresh } = useAuth();
  const { toast } = useToast();
  const { startCheckout, checkoutPending } = useBillingActions();
  const [jobRole, setJobRole] = useState<string>("");
  const [territoryNote, setTerritoryNote] = useState("");
  const [topObjections, setTopObjections] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean | string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  const loadOnboarding = useCallback(async () => {
    try {
      const res = await fetch("/api/me/onboarding", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const m = data.member;
      setJobRole(m.jobRole || "");
      setTerritoryNote(m.territoryNote || "");
      setTopObjections(m.topObjections || "");
      setChecklist(m.checklistProgress || {});
      // Expand context if they already started notes
      if (m.territoryNote || m.topObjections) setContextOpen(true);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (canUseFieldKit) loadOnboarding();
  }, [canUseFieldKit, loadOnboarding]);

  const visibleChecklist = useMemo(() => {
    const role = (jobRole || "other") as NonNullable<ChecklistItem["roles"]>[number];
    return ALL_CHECKLIST.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      if (!jobRole) return item.id !== "director_scorecard";
      return item.roles.includes(role);
    });
  }, [jobRole]);

  const doneCount = visibleChecklist.filter((i) => isDone(checklist, i.id)).length;
  const totalCount = visibleChecklist.length;
  const progressPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const incomplete = visibleChecklist.filter((i) => !isDone(checklist, i.id));
  const nextItem = incomplete[0] ?? null;
  const focusThree = incomplete.slice(0, 3);
  const allDone = totalCount > 0 && doneCount === totalCount;
  const needsRole = !jobRole;
  const isFirstSession = needsRole || doneCount === 0;

  const startHere = START_HERE[jobRole || "other"] || START_HERE.other;

  const saveProfile = async (roleOverride?: string) => {
    const role = roleOverride ?? jobRole;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/me/onboarding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole: role || null,
          territoryNote: territoryNote.trim() || null,
          topObjections: topObjections.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (roleOverride) setJobRole(roleOverride);
      toast({ title: "Saved" });
      await refresh();
      await loadOnboarding();
    } catch (err: any) {
      toast({ title: "Could not save", description: err?.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const onRoleChange = async (value: string) => {
    setJobRole(value);
    // Auto-save role so first session never stalls on a second click
    await saveProfile(value);
  };

  const toggleItem = async (id: ChecklistId, done: boolean) => {
    setToggling(id);
    setChecklist((prev) => {
      const next = { ...prev };
      if (done) next[id] = new Date().toISOString();
      else delete next[id];
      return next;
    });
    try {
      const res = await fetch("/api/me/onboarding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistItem: { id, done } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      setChecklist(data.member?.checklistProgress || {});
      await refresh();
    } catch (err: any) {
      toast({ title: "Could not update checklist", description: err?.message, variant: "destructive" });
      await loadOnboarding();
    } finally {
      setToggling(null);
    }
  };

  if (isLoading || (canUseFieldKit && !loaded)) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canUseFieldKit) {
    return <FieldKitGate />;
  }

  const memberStatusLabel =
    organization?.status === "trial"
      ? formatTrialRemaining(fieldKit?.hoursRemaining)
      : organization?.status === "active"
        ? organization?.billingPlan === "individual_weekly"
          ? "Member · $14.99/wk"
          : organization?.billingPlan === "corporate_contract"
            ? "Member · Team"
            : organization?.billingPlan === "comp"
              ? "Member · Complimentary"
              : "Member"
        : null;

  const isPersonalTrial =
    organization?.status === "trial" &&
    organization?.type === "personal" &&
    member?.role !== "platform_admin";

  const firstName = member?.name?.split(" ")[0] || "";

  const nextHint = nextItem
    ? nextItem.title
    : allDone
      ? "Book a debrief or browse tools for this week’s work"
      : startHere.title;

  const isPaidMember = organization?.status === "active";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 sm:py-16 surface-page min-h-[70vh]" data-testid="page-portal">
      <SEO />
      <MembershipActivation />

      <FieldKitChrome nextHint={nextHint} />

      {/* Welcome — short, then one mission action */}
      <div className="mb-8 space-y-3">
        <p className="text-kicker">
          {isPaidMember ? "Portal · Hospice Sales Pro" : "Portal · first session"}
        </p>
        <h1 className="text-h1 font-display font-black text-foreground tracking-tight">
          {isFirstSession
            ? `Let's make this session count${firstName ? `, ${firstName}` : ""}`
            : `Welcome back${firstName ? `, ${firstName}` : ""}`}
        </h1>
        {memberStatusLabel && (
          <div
            className="inline-flex flex-wrap items-center gap-2 text-sm font-medium text-foreground bg-card/80 border border-border/80 rounded-full px-3.5 py-2 shadow-sm"
            data-testid={isPaidMember ? "banner-member" : "banner-trial"}
          >
            <Clock className="w-4 h-4 shrink-0 text-primary" />
            <span>{memberStatusLabel}</span>
            {isPersonalTrial && (
              <button
                type="button"
                onClick={startCheckout}
                disabled={checkoutPending}
                className="inline-flex items-center gap-1 underline ml-1 hover:text-primary font-semibold disabled:opacity-60 text-primary cursor-pointer"
                data-testid="portal-trial-subscribe"
              >
                {checkoutPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5" />
                )}
                Continue $14.99/wk
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mission control — always one clear next action */}
      <Card
        className="mb-8 border border-primary/35 bg-gradient-to-br from-primary/[0.1] via-card to-card p-6 sm:p-8 elite-emphasis elite-panel"
        data-testid="section-mission-next"
        role="region"
        aria-labelledby="portal-next-action-heading"
        aria-live="polite"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div className="min-w-0 space-y-1.5">
            <p className="text-kicker">Next action</p>
            <p id="portal-next-action-heading" className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tight">
              {needsRole
                ? "Pick your role to personalize the checklist"
                : nextItem
                  ? nextItem.title
                  : allDone
                    ? "Run Command Center for today’s accounts"
                    : startHere.title}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              {needsRole
                ? "Rep, director, VP, or owner — sets recommended tools and checklist."
                : nextItem
                  ? nextItem.desc
                  : "Plan → prepare → practice → capture outcome → next step."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {needsRole ? (
              <Button asChild className="font-bold" size="lg">
                <a href="#section-first-session">Choose role</a>
              </Button>
            ) : (
              <Button asChild className="font-bold" size="lg">
                <Link
                  href={nextItem?.href || startHere.href}
                  data-testid="button-mission-next"
                >
                  {nextItem ? "Do this next" : "Open Command Center"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="font-bold" size="lg">
              <Link href="/tools">All tools</Link>
            </Button>
          </div>
        </div>
        {totalCount > 0 && (
          <div className="mt-5 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-medium tracking-wide uppercase">Session checklist</span>
              <span className="font-semibold text-foreground tabular-nums">
                {doneCount}/{totalCount}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      <p className="text-muted-foreground max-w-2xl leading-relaxed text-body mb-8 -mt-2">
        {isFirstSession
          ? isPaidMember
            ? "You're a member. Signal comes from real field work — start in Sales Command Center, add your next facility account (no PHI), and run the day from there."
            : "Your evaluation produces signal when you run real field work — not when you browse every tool. Start in Sales Command Center, complete the three steps below, then book a debrief."
          : "Run the day from Sales Command Center. Support tools stay one click away."}
        {organization?.status === "trial" && (
          <>
            {" "}
            <Link
              href="/contact?service=Field+Kit+Debrief"
              className="underline hover:text-primary font-semibold text-primary"
            >
              Book a debrief
            </Link>
            {" · "}
            <Link href="/account" className="underline hover:text-primary font-semibold text-primary">
              Account
            </Link>
          </>
        )}
      </p>

      {/* Daily spine — Sales Command Center */}
      <Card
        className="mb-8 border border-primary/35 bg-card p-5 sm:p-7"
        data-testid="section-command-center-hub"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md shadow-primary/25">
              <Crosshair className="w-5 h-5" />
            </div>
            <div className="space-y-2 min-w-0">
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
                Daily operating system
              </p>
              <h2 className="text-xl sm:text-2xl font-display font-black text-foreground">
                Sales Command Center
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                What call is next → how you prepare → what you practiced → what happened → what is next.
                Objections, role-play, email, and plans plug into this spine instead of living as random tabs.
              </p>
              <ul className="flex flex-wrap gap-2 pt-1">
                {["Pre-call plan", "Practice", "Capture outcome", "Next step"].map((step) => (
                  <li
                    key={step}
                    className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border border-border bg-background/60 text-foreground"
                  >
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button asChild size="lg" className="font-bold">
              <Link href="/tools/sales-workflow" data-testid="button-open-command-center">
                Open Command Center
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold">
              <Link href="/tools">All tools</Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Orientation — full What/Why/How only on first session; chrome covers returning users */}
      {isFirstSession && (
        <section
          className="mb-8 grid sm:grid-cols-3 gap-3"
          data-testid="section-field-kit-orientation"
        >
          {[
            { label: "What", body: FIELD_KIT_WHAT },
            { label: "Why", body: FIELD_KIT_WHY },
            { label: "How", body: FIELD_KIT_HOW },
          ].map((item) => (
            <Card key={item.label} className="border border-border bg-card p-4 space-y-2">
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase">{item.label}</p>
              <p className="text-sm text-foreground leading-relaxed">{item.body}</p>
            </Card>
          ))}
        </section>
      )}

      {/* ── First-session path: 3 clear steps ── */}
      {isFirstSession && (
        <section
          id="section-first-session"
          className="mb-10 rounded-2xl border border-primary/30 bg-card p-5 sm:p-7"
          data-testid="section-first-session"
        >
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">
                First session — do these three
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Role → one real tool → debrief on the calendar
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                That sequence beats opening ten tabs. Prefer Sales Command Center first; objections, weekly plan,
                role-play, and activity math still mark the checklist when you complete them.
              </p>
            </div>
          </div>

          <ol className="grid md:grid-cols-3 gap-3">
            {/* Step 1 — role */}
            <li
              className={cn(
                "rounded-xl border p-4 space-y-3",
                needsRole
                  ? "border-primary bg-background/80 shadow-lg shadow-primary/10"
                  : "border-green-500/30 bg-green-500/5",
              )}
              data-testid="first-step-role"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-7 h-7 rounded-full text-xs font-black flex items-center justify-center",
                    needsRole ? "bg-primary text-primary-foreground" : "bg-green-500 text-white",
                  )}
                >
                  {needsRole ? "1" : "✓"}
                </span>
                <p className="font-bold text-sm">Pick your role</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unlocks the right start recommendation and checklist items.
              </p>
              {needsRole ? (
                <Select value={jobRole || undefined} onValueChange={onRoleChange}>
                  <SelectTrigger data-testid="select-job-role-focus">
                    <SelectValue placeholder="Select role…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rep">Sales rep / liaison</SelectItem>
                    <SelectItem value="director">Sales director / manager</SelectItem>
                    <SelectItem value="vp">VP / executive</SelectItem>
                    <SelectItem value="owner">Owner / operator</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-semibold text-green-400 capitalize">
                  {jobRole === "rep"
                    ? "Sales rep / liaison"
                    : jobRole === "director"
                      ? "Director / manager"
                      : jobRole === "vp"
                        ? "VP / executive"
                        : jobRole === "owner"
                          ? "Owner / operator"
                          : "Other"}
                </p>
              )}
            </li>

            {/* Step 2 — first tool */}
            <li
              className={cn(
                "rounded-xl border p-4 space-y-3",
                !needsRole && nextItem && nextItem.id !== "debrief"
                  ? "border-primary bg-background/80 shadow-lg shadow-primary/10"
                  : !needsRole && (doneCount > 0 || !nextItem)
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-background/40 opacity-90",
              )}
              data-testid="first-step-tool"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-7 h-7 rounded-full text-xs font-black flex items-center justify-center",
                    !needsRole && nextItem && nextItem.id !== "debrief"
                      ? "bg-primary text-primary-foreground"
                      : !needsRole && doneCount > 0
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {!needsRole && doneCount > 0 && (!nextItem || nextItem.id === "debrief")
                    ? "✓"
                    : "2"}
                </span>
                <p className="font-bold text-sm">Run one real tool</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {needsRole
                  ? "Choose a role first — then we point you at the best first move."
                  : startHere.blurb}
              </p>
              {!needsRole && (
                <Button asChild size="sm" className="font-bold w-full" disabled={savingProfile}>
                  <Link href={startHere.href} data-testid="button-first-tool">
                    {startHere.title}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              )}
            </li>

            {/* Step 3 — debrief */}
            <li
              className={cn(
                "rounded-xl border p-4 space-y-3",
                isDone(checklist, "debrief")
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-border bg-background/40",
              )}
              data-testid="first-step-debrief"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-7 h-7 rounded-full text-xs font-black flex items-center justify-center",
                    isDone(checklist, "debrief")
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone(checklist, "debrief") ? "✓" : "3"}
                </span>
                <p className="font-bold text-sm">Book a debrief</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Convert evaluation signal into seats, coaching, or a clear no — while the window is open.
              </p>
              <Button asChild size="sm" variant="outline" className="font-bold w-full">
                <Link href="/contact?service=Membership+Debrief" data-testid="button-first-debrief">
                  Schedule call
                  <Phone className="ml-2 w-3.5 h-3.5" />
                </Link>
              </Button>
            </li>
          </ol>
        </section>
      )}

      {/* All done celebration */}
      {allDone && (
        <Card
          className="mb-10 border border-green-500/30 bg-green-500/5 p-6 text-center space-y-3"
          data-testid="section-checklist-complete"
        >
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">First-session checklist complete</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            You have real signal. If you have not already, lock a debrief so we can turn this into membership
            or coaching next steps.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Button asChild className="font-bold">
              <Link href="/contact?service=Membership+Debrief">
                Book debrief
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="font-bold">
              <Link href="/tools">Browse membership tools</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Next up (returning / mid-session) */}
      {!isFirstSession && !allDone && nextItem && (
        <Card
          className="mb-8 border border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
          data-testid="section-next-up"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-widest text-primary uppercase">Next up</p>
            <h2 className="text-lg font-bold text-foreground">{nextItem.title}</h2>
            <p className="text-sm text-muted-foreground">{nextItem.desc}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button asChild className="font-bold">
              <Link href={nextItem.href}>
                Open
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="font-bold"
              disabled={toggling === nextItem.id}
              onClick={() => toggleItem(nextItem.id, true)}
            >
              Mark done
            </Button>
          </div>
        </Card>
      )}

      {/* Role + start here (compact when past first session) */}
      {!needsRole && (
        <section className="grid lg:grid-cols-5 gap-4 mb-10">
          <Card className="lg:col-span-2 border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              <h2 className="font-bold">Your role</h2>
            </div>
            <Select value={jobRole || undefined} onValueChange={onRoleChange}>
              <SelectTrigger data-testid="select-job-role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rep">Sales rep / liaison</SelectItem>
                <SelectItem value="director">Sales director / manager</SelectItem>
                <SelectItem value="vp">VP / executive</SelectItem>
                <SelectItem value="owner">Owner / operator</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {savingProfile && <p className="text-xs text-muted-foreground">Saving…</p>}
          </Card>

          <Card className="lg:col-span-3 border border-primary/30 bg-primary/5 p-5 space-y-3">
            <p className="text-xs font-bold tracking-widest text-primary uppercase">Recommended move</p>
            <h2 className="text-xl font-bold text-foreground">{startHere.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{startHere.blurb}</p>
            <Button asChild className="font-bold w-fit">
              <Link href={startHere.href}>
                Go <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </Card>
        </section>
      )}

      {/* Focus strip when first session and role set */}
      {!needsRole && isFirstSession && focusThree.length > 0 && (
        <section className="mb-8" data-testid="section-focus-three">
          <h2 className="text-sm font-bold text-foreground mb-3">Your focus list right now</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {focusThree.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.id}
                  className="border border-border bg-card p-4 flex flex-col gap-2"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Focus {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <p className="font-bold text-sm">{item.short}</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="font-bold mt-auto h-8 text-xs">
                    <Link href={item.href}>Open</Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Hospice Sales Pro map — spine + satellites (compact) */}
      <section className="mb-10" data-testid="section-tool-map">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Hospice Sales Pro</h2>
            <p className="text-sm text-muted-foreground">
              Today starts in Command Center. Everything else is optional support.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="font-bold">
            <Link href="/tools">
              All tools <ArrowRight className="ml-1 w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
        <ProductMap />
      </section>

      {/* Quick links — quiet */}
      <section className="mb-10 grid sm:grid-cols-2 gap-3" data-testid="section-portal-kit-links">
        <Card className="border border-border/80 bg-card p-4 space-y-1.5 shadow-none">
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Resources</p>
          <p className="text-sm font-semibold text-foreground">Templates &amp; field downloads</p>
          <Button asChild size="sm" variant="ghost" className="font-bold w-fit px-0 h-8">
            <Link href="/resources">
              Open resources <ArrowRight className="ml-1 w-3.5 h-3.5" />
            </Link>
          </Button>
        </Card>
        <Card className="border border-border/80 bg-card p-4 space-y-1.5 shadow-none">
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Learn</p>
          <p className="text-sm font-semibold text-foreground">Drills, articles, knowledge</p>
          <Button asChild size="sm" variant="ghost" className="font-bold w-fit px-0 h-8">
            <Link href="/portal/learn">
              Open learn <ArrowRight className="ml-1 w-3.5 h-3.5" />
            </Link>
          </Button>
        </Card>
      </section>

      {/* Checklist — collapsed for returning members; open for first session */}
      <section className="mb-10" data-testid="section-checklist">
        <details className="rounded-xl border border-border bg-card/80 p-4 sm:p-5" open={isFirstSession && !allDone}>
          <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Session checklist</h2>
              <p className="text-sm text-muted-foreground">
                {doneCount} of {totalCount} complete · {progressPct}%
              </p>
            </div>
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              {isFirstSession ? "Recommended" : "Expand"}
            </span>
          </summary>
          <div className="h-2 rounded-full bg-muted mt-4 mb-4 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {visibleChecklist.map((item) => {
              const Icon = item.icon;
              const done = isDone(checklist, item.id);
              const isNext = nextItem?.id === item.id;
              return (
                <Card
                  key={item.id}
                  className={cn(
                    "border p-4 bg-card shadow-none",
                    done
                      ? "border-green-500/30 bg-green-500/5"
                      : isNext
                        ? "border-primary/40 bg-primary/5"
                        : "border-border",
                  )}
                  data-testid={`checklist-${item.id}`}
                >
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="shrink-0 mt-0.5 text-primary disabled:opacity-50"
                      disabled={toggling === item.id}
                      onClick={() => toggleItem(item.id, !done)}
                      aria-label={done ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`}
                      data-testid={`toggle-${item.id}`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <h3 className={cn("font-bold text-sm", done && "line-through opacity-80")}>
                          {item.title}
                          {isNext && !done && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-primary not-italic no-underline">
                              Next
                            </span>
                          )}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
                      <Button asChild size="sm" variant="outline" className="font-bold h-8 text-xs">
                        <Link href={item.href}>{item.id === "debrief" ? "Book call" : "Open tool"}</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </details>
      </section>

      {/* Optional field context — collapsed by default */}
      <section className="mb-12">
        <Card className="border border-border bg-card overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-white/[0.02] transition-colors"
            onClick={() => setContextOpen((o) => !o)}
            data-testid="button-toggle-context"
          >
            <div>
              <h2 className="text-lg font-bold">Field context (optional)</h2>
              <p className="text-sm text-muted-foreground">
                Territory notes and top objections — helps a debrief stay specific. No PHI.
              </p>
            </div>
            {contextOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
          </button>
          {contextOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-border/60 pt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="territory">Territory / market notes</Label>
                  <Textarea
                    id="territory"
                    rows={3}
                    value={territoryNote}
                    onChange={(e) => setTerritoryNote(e.target.value)}
                    placeholder="e.g. North Dallas SNFs, 2 hospital systems, new hire ramp"
                    data-testid="input-territory"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objections">Top objections you hear</Label>
                  <Textarea
                    id="objections"
                    rows={3}
                    value={topObjections}
                    onChange={(e) => setTopObjections(e.target.value)}
                    placeholder="e.g. not ready, already have a provider, family not on board"
                    data-testid="input-objections"
                  />
                </div>
              </div>
              <Button className="font-bold" onClick={() => saveProfile()} disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save field context"}
              </Button>
            </div>
          )}
        </Card>
      </section>

      <section className="flex flex-wrap gap-3 mb-10 text-sm">
        <Button asChild variant="outline" size="sm" className="font-bold">
          <Link href="/tools">All tools</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="font-bold">
          <Link href="/account">Account &amp; billing</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="font-semibold">
          <Link href="/contact?service=Hospice+Sales+Pro+Debrief">Book a debrief</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="font-semibold">
          <Link href="/compliance">No PHI · compliance</Link>
        </Button>
      </section>

      <ToolDisclaimer className="mt-8 rounded-md border border-border/60 bg-muted/40 py-3 px-4 text-center" />
    </div>
  );
}
