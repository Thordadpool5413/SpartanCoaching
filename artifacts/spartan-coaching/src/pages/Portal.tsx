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
  /** Show for these job roles; empty = everyone */
  roles?: Array<"rep" | "director" | "vp" | "owner" | "other">;
};

const ALL_CHECKLIST: ChecklistItem[] = [
  {
    id: "objection",
    title: "Handle one real objection",
    desc: "Paste a live objection and get a field-ready response.",
    href: "/tools/objections",
    icon: MessageCircle,
  },
  {
    id: "weekly_plan",
    title: "Build this week’s plan",
    desc: "Turn accounts into a Monday–Friday territory rhythm.",
    href: "/tools/weekly-plan-builder",
    icon: CalendarDays,
  },
  {
    id: "roleplay",
    title: "Role-play your toughest scenario",
    desc: "Practice the conversation before you walk into the building.",
    href: "/tools/role-play",
    icon: Users,
  },
  {
    id: "director_scorecard",
    title: "Run the activity / scorecard math",
    desc: "Translate goals into daily conversations your team can execute.",
    href: "/tools/activity-calculator",
    icon: Target,
    roles: ["director", "vp", "owner"],
  },
  {
    id: "debrief",
    title: "Book a debrief call",
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
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (canUseFieldKit) loadOnboarding();
  }, [canUseFieldKit, loadOnboarding]);

  const visibleChecklist = useMemo(() => {
    const role = (jobRole || "other") as ChecklistItem["roles"] extends (infer R)[] | undefined ? R : string;
    return ALL_CHECKLIST.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      if (!jobRole) return item.id !== "director_scorecard"; // hide director-only until role set
      return item.roles.includes(role as any);
    });
  }, [jobRole]);

  const doneCount = visibleChecklist.filter((i) => isDone(checklist, i.id)).length;
  const totalCount = visibleChecklist.length;
  const progressPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const startHere = START_HERE[jobRole || "other"] || START_HERE.other;

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/me/onboarding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole: jobRole || null,
          territoryNote: territoryNote.trim() || null,
          topObjections: topObjections.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast({ title: "Profile saved" });
      await refresh();
      await loadOnboarding();
    } catch (err: any) {
      toast({ title: "Could not save", description: err?.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleItem = async (id: ChecklistId, done: boolean) => {
    setToggling(id);
    // optimistic
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
      <div className="mb-8 space-y-3">
        <p className="text-xs font-bold tracking-widest text-red-400 uppercase">Field Kit</p>
        <h1 className="text-h1 font-display font-black text-foreground">
          Welcome{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Discipline, empathy, and strategy — executed in the field. Use this checklist in your first session so the evaluation produces real signal, not just curiosity.
        </p>
        <p className="text-sm text-foreground/80 max-w-2xl leading-relaxed border-l-2 border-primary pl-3">
          Hospice growth is a conversation problem before it is a census problem.{" "}
          <Link href="/method" className="text-primary font-semibold hover:underline">
            The Spartan Method
          </Link>{" "}
          and the{" "}
          <Link href="/manifesto" className="text-primary font-semibold hover:underline">
            Ethos
          </Link>{" "}
          are the standard behind every tool.
        </p>
        {trialLabel && (
          <div
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-2"
            data-testid="banner-trial"
          >
            <Clock className="w-4 h-4" />
            {trialLabel}
            {organization?.status === "trial" && (
              <Link href="/contact?service=Field+Kit+Debrief" className="underline ml-1 hover:text-white">
                Book a debrief
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Role + start here */}
      <section className="grid lg:grid-cols-5 gap-4 mb-10">
        <Card className="lg:col-span-2 border border-white/10 dark:bg-[#0f0f0f] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <h2 className="font-bold">Your role</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Sets your recommended start and which checklist items appear.
          </p>
          <Select value={jobRole || undefined} onValueChange={setJobRole}>
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
          <Button size="sm" className="font-bold" onClick={saveProfile} disabled={savingProfile || !jobRole}>
            {savingProfile ? "Saving…" : "Save role"}
          </Button>
        </Card>

        <Card className="lg:col-span-3 border border-primary/30 bg-primary/5 p-5 space-y-3">
          <p className="text-xs font-bold tracking-widest text-red-400 uppercase">Recommended first move</p>
          <h2 className="text-xl font-bold text-foreground">{startHere.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{startHere.blurb}</p>
          <Button asChild className="font-bold w-fit">
            <Link href={startHere.href}>
              Go <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </Card>
      </section>

      {/* Progress */}
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
            return (
              <Card
                key={item.id}
                className={cn(
                  "border p-4 dark:bg-[#0f0f0f]",
                  done ? "border-green-500/30 bg-green-500/5" : "border-white/10",
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
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
                    <Button asChild size="sm" variant="outline" className="font-bold h-8 text-xs">
                      <Link href={item.href}>Open tool</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Profile notes */}
      <section className="mb-12">
        <Card className="border border-white/10 dark:bg-[#0f0f0f] p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold">Field context (optional)</h2>
            <p className="text-sm text-muted-foreground">
              Helps you — and a debrief call — stay specific. Not clinical data. No PHI.
            </p>
          </div>
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
          <Button className="font-bold" onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save field context"}
          </Button>
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
