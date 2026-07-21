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
} from "lucide-react";
import { FieldKitGate } from "@/components/FieldKitGate";
import { ToolDisclaimer } from "@/components/ToolDisclaimer";
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
    href: "/contact?service=Field+Kit+Debrief",
    icon: Phone,
  },
];

const START_HERE: Record<string, { title: string; href: string; blurb: string }> = {
  rep: {
    title: "Start with objections",
    href: "/tools/objections",
    blurb: "Reps win the week on live conversations. Get one tough objection handled first.",
  },
  director: {
    title: "Start with the weekly plan",
    href: "/tools/weekly-plan-builder",
    blurb: "Leaders set the rhythm. Build one clear week, then coach from it.",
  },
  vp: {
    title: "Start with activity math",
    href: "/tools/activity-calculator",
    blurb: "Connect admissions goals to daily conversations before you inspect the field.",
  },
  owner: {
    title: "Start with branch economics",
    href: "/tools/branch-profitability",
    blurb: "See how census, staffing, and growth pressure connect — then coach the team.",
  },
  other: {
    title: "Start with the Field Kit hub",
    href: "/tools",
    blurb: "Browse the full toolkit, then mark checklist items as you complete them.",
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

  const trialLabel =
    organization?.status === "trial"
      ? formatTrialRemaining(fieldKit?.hoursRemaining)
      : organization?.status === "active"
        ? "Active client access"
        : null;

  const firstName = member?.name?.split(" ")[0] || "";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 sm:py-14" data-testid="page-portal">
      <SEO />

      {/* Welcome */}
      <div className="mb-6 space-y-3">
        <p className="text-xs font-bold tracking-widest text-red-400 uppercase">Field Kit home</p>
        <h1 className="text-h1 font-display font-black text-foreground">
          {isFirstSession
            ? `Let's make this session count${firstName ? `, ${firstName}` : ""}`
            : `Welcome back${firstName ? `, ${firstName}` : ""}`}
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          {isFirstSession
            ? "Your evaluation produces signal when you run real field work — not when you browse every tool. Do three things below, then book a debrief."
            : "Continue your checklist, open tools, or book a debrief while access is open."}
        </p>
        {trialLabel && (
          <div
            className="inline-flex flex-wrap items-center gap-2 text-sm font-medium text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-2"
            data-testid="banner-trial"
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{trialLabel}</span>
            {organization?.status === "trial" && (
              <Link
                href="/contact?service=Field+Kit+Debrief"
                className="underline ml-1 hover:text-white font-semibold"
              >
                Book a debrief
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── First-session path: 3 clear steps ── */}
      {isFirstSession && (
        <section
          className="mb-10 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-5 sm:p-7"
          data-testid="section-first-session"
        >
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-red-400 uppercase mb-1">
                First session — do these three
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Role → one real tool → debrief on the calendar
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                That sequence beats opening ten tabs. Mark checklist items done as you finish them.
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
                    : "border-white/10 bg-background/40 opacity-90",
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
                  : "border-white/10 bg-background/40",
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
                <Link href="/contact?service=Field+Kit+Debrief" data-testid="button-first-debrief">
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
              <Link href="/contact?service=Field+Kit+Debrief">
                Book debrief
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="font-bold">
              <Link href="/tools">Browse full Field Kit</Link>
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
            <p className="text-xs font-bold tracking-widest text-red-400 uppercase">Next up</p>
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
          <Card className="lg:col-span-2 border border-white/10 dark:bg-[#0f0f0f] p-5 space-y-3">
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
            <p className="text-xs font-bold tracking-widest text-red-400 uppercase">Recommended move</p>
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
                  className="border border-white/10 dark:bg-[#0f0f0f] p-4 flex flex-col gap-2"
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

      {/* Learn strip — guided context without burying tools */}
      <section className="mb-10" data-testid="section-portal-learn">
        <h2 className="text-lg font-bold text-foreground mb-3">Quick grounding</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              href: "/method",
              title: "Spartan Method",
              desc: "Discipline, empathy, strategy — the system behind every tool.",
            },
            {
              href: "/manifesto",
              title: "Ethos",
              desc: "Why patient access and ethical messaging are non-negotiable.",
            },
            {
              href: "/compliance",
              title: "No PHI",
              desc: "Planning and messaging only. Never put patient identifiers in tools.",
            },
          ].map((item) => (
            <Card
              key={item.href}
              className="border border-white/10 dark:bg-[#0f0f0f] p-4 hover:border-primary/30 transition-colors"
            >
              <Link href={item.href} className="block space-y-1">
                <p className="font-bold text-sm text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                <span className="text-xs font-bold text-primary inline-flex items-center gap-1 pt-1">
                  Open <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Full checklist */}
      <section className="mb-10" data-testid="section-checklist">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">First-session checklist</h2>
            <p className="text-sm text-muted-foreground">
              {doneCount} of {totalCount} complete — mark items done as you finish them.
            </p>
          </div>
          <div className="text-sm font-bold text-primary">{progressPct}%</div>
        </div>
        <div className="h-2 rounded-full bg-white/10 mb-5 overflow-hidden">
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
                  "border p-4 dark:bg-[#0f0f0f]",
                  done
                    ? "border-green-500/30 bg-green-500/5"
                    : isNext
                      ? "border-primary/40 bg-primary/5"
                      : "border-white/10",
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
      </section>

      {/* Optional field context — collapsed by default */}
      <section className="mb-12">
        <Card className="border border-white/10 dark:bg-[#0f0f0f] overflow-hidden">
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
            <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
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

      <section className="grid sm:grid-cols-3 gap-4 mb-12">
        <Card className="border border-white/10 dark:bg-[#0f0f0f] p-5 space-y-3">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Full Field Kit</h3>
          <p className="text-sm text-muted-foreground">AI tools, calculators, drills, and practice scenarios.</p>
          <Button asChild variant="outline" size="sm" className="font-bold">
            <Link href="/tools">
              Open tools <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </Button>
        </Card>
        <Card className="border border-white/10 dark:bg-[#0f0f0f] p-5 space-y-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Learn</h3>
          <p className="text-sm text-muted-foreground">Articles, method, and resources that back the work.</p>
          <Button asChild variant="outline" size="sm" className="font-bold">
            <Link href="/portal/learn">
              Browse <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </Button>
        </Card>
        <Card className="border border-white/10 dark:bg-[#0f0f0f] p-5 space-y-3">
          <Phone className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Coaching</h3>
          <p className="text-sm text-muted-foreground">Human path stays open — strategy calls and engagements.</p>
          <Button asChild size="sm" className="font-bold">
            <Link href="/contact">Book a call</Link>
          </Button>
        </Card>
      </section>

      <ToolDisclaimer className="mt-8 rounded-md border border-white/5 bg-black/20 py-3 px-4 text-center" />
    </div>
  );
}
