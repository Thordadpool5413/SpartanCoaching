import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { SubscribeCTA } from "@/components/SubscribeCTA";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import {
  CheckCircle,
  ArrowRight,
  Award,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Target,
  Route,
  Package,
  Sparkles,
  X,
  Lock,
  CalendarDays,
  MessageSquare,
  Crosshair,
  Mail,
} from "lucide-react";
import { useState } from "react";

// 7 primary tools shown in scenario cards — chosen for rep persona relevance.
// Each tool must have scenario + outcome set in the field-kit-catalog so the
// marketing copy stays in sync with the catalog definition.
const PRIMARY_TOOL_IDS = [
  "objections",
  "playbooks",
  "role-play",
  "sales-workflow",
  "weekly-plan",
  "cold-call",
  "email-templates",
];

/** Secondary tools shown when the user expands "+6 more tools in the kit" */
const MORE_TOOL_IDS = [
  "research",
  "transcribe",
  "activity-calculator",
  "roi",
  "rep-cost",
  "branch",
] as const;

const FAQ_ITEMS = [
  {
    q: "Do I need to already be a Spartan coaching client?",
    a: "No. You can create an individual account and subscribe for $14.99/week entirely on your own. If you want coaching alongside the tools, that's a separate conversation — reach out and we'll talk through what makes sense.",
  },
  {
    q: "Is this for individual reps or directors?",
    a: "Both. Individual reps use the Objection Handler, Playbook Generator, Role-Play, and Weekly Plan Builder most. Directors and VPs tend to lean on the Activity Calculator, ROI Calculator, Branch Profitability Simulator, and the coaching debrief workflow in Sales Command Center. The tools are the same kit; how you use them shifts by role.",
  },
  {
    q: "What if I cancel — do I lose my data?",
    a: "Access stops at the end of the period you've already paid for. You won't be mid-week and locked out. If you re-subscribe, you pick up where you left off.",
  },
  {
    q: "Is there a team or company option?",
    a: "Yes. Team and provider accounts use a weekly per-seat rate set under contract — different from the self-serve $14.99 individual price. Request team access and we'll set up seats under your provider agreement.",
  },
  {
    q: "Can I try tools before I pay?",
    a: "Yes. Open any tool in preview to see the real interface. Live generation, saves, and runs unlock when you subscribe. Self-serve accounts create first, then subscribe from Account — timed evaluations are arranged separately when you request team or approved evaluation access.",
  },
];

/** Your week with Field Kit — personal motivation beats (not provider revenue). */
const DAY_MAP = [
  {
    beat: "1",
    when: "Sunday night",
    title: "The week already has a plan",
    toolId: "weekly-plan",
    icon: CalendarDays,
    feel: "You know who to call first Monday — not 15 tabs of hope.",
  },
  {
    beat: "2",
    when: "Before the visit",
    title: "Walk in prepared",
    toolId: "sales-workflow",
    icon: Crosshair,
    feel: "Command Center + playbook: one ask, one path, no parking-lot scramble.",
  },
  {
    beat: "3",
    when: "Objection hits",
    title: "You already have the answer",
    toolId: "objections",
    icon: MessageSquare,
    feel: "Preferred hospice. Not ready. Practice once — sound like you, not a script robot.",
  },
  {
    beat: "4",
    when: "After the visit",
    title: "Relationship stays warm",
    toolId: "email-templates",
    icon: Mail,
    feel: "Specific follow-up the same day. You're the rep they remember.",
  },
] as const;

export default function FieldKit() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showAllUnlock, setShowAllUnlock] = useState(false);

  const primaryTools = PRIMARY_TOOL_IDS.map((id) =>
    FIELD_KIT_TOOLS.find((t) => t.id === id),
  ).filter(Boolean) as (typeof FIELD_KIT_TOOLS)[number][];

  const moreTools = MORE_TOOL_IDS.map((id) => FIELD_KIT_TOOLS.find((t) => t.id === id)).filter(
    Boolean,
  ) as (typeof FIELD_KIT_TOOLS)[number][];

  const unlockTools = FIELD_KIT_TOOLS.filter((t) => t.id !== "brand-video");
  const unlockVisible = showAllUnlock ? unlockTools : unlockTools.slice(0, 8);

  return (
    <div className="w-full" data-testid="page-field-kit">
      <SEO />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28" data-testid="section-hero">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-15 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">
            Private Field Kit · Built for the rep who refuses to wing Tuesday
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-foreground leading-[1.05] tracking-tight">
            The edge that wins the room.
            <br />
            <span className="text-primary">Not every rep has access.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Built by someone who ran the territory and coached the reps who consistently rank at the top of their
            agencies. Every tool is for the conversations you have in SNFs, physician offices, and family meetings —
            not generic sales AI. Preview free. Live use with a subscription.
          </p>
          <div className="flex flex-col items-center gap-3 pt-2">
            <SubscribeCTA surface="field_kit_hero" showPreview showHint testId="field-kit-hero-cta" />
            <Button asChild variant="ghost" className="font-medium" size="sm">
              <a href="#why-subscribe">
                See why reps subscribe
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            $14.99/week · your tools, your edge · cancel anytime from Account
          </p>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ── */}
      <div className="border-y border-border bg-card py-5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">Built by reps who ran the territory</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">Used by the reps who rank at the top</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">12+ years hospice-specific · 500+ coached</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">Hospice-only · not generic sales AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BEFORE / AFTER ── */}
      <section className="py-16 sm:py-20 bg-background" data-testid="section-before-after">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-bold tracking-widest text-primary uppercase">The difference</p>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground">
              The rep the facility calls.<br />The rep who shows up hoping.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Same territory. Same accounts. The difference is who walked in prepared — and who the facility remembers when the next referral is ready.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <Card className="border border-border bg-card p-6 sm:p-8 space-y-5" data-testid="card-before">
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                The rep who shows up hoping
              </div>
              <ul className="space-y-4">
                {[
                  "St. Mary's. Third visit. No specific ask prepared. You'll figure it out in the parking lot — and so will the rep who just called ahead with the right question.",
                  "The charge nurse says 'we already have a preferred hospice.' You respond with something that felt right in the moment. The other rep had already answered this objection before walking in.",
                  "You leave with a verbal maybe. The follow-up email takes until Thursday. By then, the rep who sent something specific on Tuesday has the relationship.",
                  "Sunday night: 15 accounts, no plan, no priority. Monday starts reactive. The rep the facility calls first already knew who to call.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="text-muted-foreground/50 font-bold shrink-0 mt-0.5">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* After */}
            <Card
              className="border border-primary/40 bg-primary/5 p-6 sm:p-8 space-y-5"
              data-testid="card-after"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                The rep the facility calls
              </div>
              <ul className="space-y-4">
                {[
                  "Before St. Mary's: Playbook Generator built the right talking points for this stage of the relationship and gave you one precise ask. You walk in as the consultant they want to call — not another vendor.",
                  "When the objection hits: Objection Handler gave you the response before you walked in. You practiced it once. It doesn't sound memorized — it sounds like you.",
                  "After the visit: Email drafted in two minutes, sent that afternoon. Specific, warm, not a sales pitch. The relationship doesn't go cold.",
                  "Sunday night: Weekly Plan Builder turns 15 accounts into a Monday–Friday plan with win conditions. You know exactly who to call first Monday morning — and so does the facility.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* ── TOOL CARDS ── */}
      <section className="py-16 sm:py-20 bg-card border-y border-border" data-testid="section-tool-cards">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-bold tracking-widest text-primary uppercase">
              {showMoreTools ? "All 13 tools" : "7 primary tools · +6 more in the kit"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground">
              Every tool answers one question:<br />what does the rep who has this win?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Each tool is built around a specific moment in the hospice growth cycle — and the outcome
              that separates the rep who wins it from the one who doesn't.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4" data-testid="tool-cards-grid">
            {primaryTools.map((tool) => (
              <Card
                key={tool.id}
                className="border border-border bg-background p-5 flex flex-col gap-3"
                data-testid={`tool-card-${tool.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      {tool.category}
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-0.5">{tool.title}</h3>
                  </div>
                </div>
                {tool.scenario && (
                  <>
                    <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                      "{tool.scenario}"
                    </p>
                    <div className="flex gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{tool.outcome}</span>
                    </div>
                  </>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed mt-auto pt-2 border-t border-border">
                  <strong className="text-foreground/70">When to use:</strong> {tool.whenToUse}
                </p>
                <Link
                  href={tool.path}
                  className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
                  data-testid={`tool-card-preview-${tool.id}`}
                >
                  Preview this tool <ArrowRight className="w-3 h-3" />
                </Link>
              </Card>
            ))}

            {/* Expand: stay on Field Kit and show the other 6 offerings (no membership redirect) */}
            {!showMoreTools ? (
              <Card
                className="border border-dashed border-primary/40 bg-primary/5 p-5 flex flex-col items-center justify-center text-center gap-3 min-h-[120px] sm:col-span-2"
                data-testid="card-more-tools-teaser"
              >
                <p className="text-sm font-semibold text-foreground">+6 more tools in the kit</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  Grounded Research, Call Transcriber, Activity Calculator, ROI Calculator, Rep Cost
                  Calculator, Branch Profitability Simulator
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-bold border-primary/40 text-primary"
                  onClick={() => setShowMoreTools(true)}
                  data-testid="button-show-more-tools"
                >
                  See what else is in the kit
                  <ChevronDown className="ml-1.5 w-4 h-4" />
                </Button>
              </Card>
            ) : (
              <>
                {moreTools.map((tool) => (
                  <Card
                    key={tool.id}
                    className="border border-border bg-background p-5 flex flex-col gap-3"
                    data-testid={`tool-card-${tool.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                          {tool.category}
                        </span>
                        <h3 className="text-base font-bold text-foreground mt-0.5">{tool.title}</h3>
                      </div>
                    </div>
                    {tool.scenario && (
                      <>
                        <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                          "{tool.scenario}"
                        </p>
                        <div className="flex gap-2 text-sm text-foreground">
                          <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{tool.outcome}</span>
                        </div>
                      </>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed mt-auto pt-2 border-t border-border">
                      <strong className="text-foreground/70">When to use:</strong> {tool.whenToUse}
                    </p>
                    <Link
                      href={tool.path}
                      className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
                      data-testid={`tool-card-preview-${tool.id}`}
                    >
                      Preview this tool <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Card>
                ))}
                <div className="sm:col-span-2 flex justify-center pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="font-semibold text-muted-foreground"
                    onClick={() => setShowMoreTools(false)}
                    data-testid="button-hide-more-tools"
                  >
                    Show fewer tools
                    <ChevronUp className="ml-1.5 w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── WHY SUBSCRIBE (desire + unlock + day map + honest CTA) ── */}
      <section
        id="why-subscribe"
        className="py-16 sm:py-20 bg-background scroll-mt-20"
        data-testid="section-why-subscribe"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <p className="text-xs font-bold tracking-widest text-primary uppercase">Why Field Kit</p>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground">
              Your hospice gave you a territory.
              <br />
              <span className="text-primary">It didn&apos;t give you the kit that wins the room.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You become the rep facilities call first — because you already had the answer when everyone else
              stalled. Nothing else in your stack is built for that.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                label: "Why",
                title: "Why you need this",
                icon: Target,
                body: "Tuesday is real: preferred hospice, not ready, no plan for fifteen accounts, follow-up that slips until Thursday. Hoping is not a system. Most people in the territory are winging the same moments you are.",
              },
              {
                label: "How",
                title: "How it works for you",
                icon: Route,
                body: "Prepare → Practice → Plan → Measure around your next visit, objection, and week — not generic sales AI. Hospice growth conversations only. Ethics-first. No PHI in the tools.",
              },
              {
                label: "What",
                title: "What's in the kit",
                icon: Package,
                body: "Thirteen private tools: Sales Command Center as the daily spine, plus objections, playbooks, role-play, weekly plan, scripts, email, research, and more. Web and mobile. Preview the real UI — live runs unlock when you subscribe.",
              },
              {
                label: "For you",
                title: "What's in it for you",
                icon: Sparkles,
                body: "Confidence when the charge nurse pushes back. A Monday that already has a plan. Fewer fumbling moments. The reputation of the rep who showed up prepared. Your agency sets goals — this is your edge between sessions.",
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card
                  key={pillar.label}
                  className="border border-border bg-card p-5 sm:p-6 space-y-3 text-left"
                  data-testid={`why-subscribe-pillar-${pillar.label.toLowerCase()}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {pillar.label}
                      </p>
                      <h3 className="text-base font-bold text-foreground">{pillar.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pillar.body}</p>
                </Card>
              );
            })}
          </div>

          <div className="space-y-5" data-testid="field-kit-day-map">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <p className="text-xs font-bold tracking-widest text-primary uppercase">Your week with the kit</p>
              <h3 className="text-xl sm:text-2xl font-display font-black text-foreground">
                Four moments. Four tools. One reputation.
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DAY_MAP.map((step) => {
                const tool = FIELD_KIT_TOOLS.find((t) => t.id === step.toolId);
                const Icon = step.icon;
                return (
                  <Card
                    key={step.beat}
                    className="border border-border bg-card p-4 flex flex-col gap-3 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {step.when}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">{step.beat}/4</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary shrink-0">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-snug">{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.feel}</p>
                      </div>
                    </div>
                    {tool && (
                      <Link
                        href={tool.path}
                        className="mt-auto text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Preview {tool.title}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="space-y-5" data-testid="field-kit-unlock-showcase">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <p className="text-xs font-bold tracking-widest text-primary uppercase">What you unlock</p>
              <h3 className="text-xl sm:text-2xl font-display font-black text-foreground">
                See the tools. Then run them live when you subscribe.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every tile opens a real preview. Generate, save, and run need an active membership. Training resources
                stay in the library — better with the kit, not a secret paid-only vault.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {unlockVisible.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.path}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:bg-primary/[0.03] transition-colors text-left"
                  data-testid={`unlock-tile-${tool.id}`}
                >
                  <Lock className="w-3.5 h-3.5 text-primary shrink-0 mt-1" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground group-hover:text-primary">
                        {tool.title}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                      {tool.whenToUse}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-1" />
                </Link>
              ))}
            </div>
            {unlockTools.length > 8 && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="font-semibold"
                  onClick={() => setShowAllUnlock((v) => !v)}
                  data-testid="button-toggle-unlock-tools"
                >
                  {showAllUnlock ? (
                    <>
                      Show fewer tools <ChevronUp className="ml-1.5 w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Show all {unlockTools.length} tools <ChevronDown className="ml-1.5 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <Card
            className="border border-primary/25 bg-primary/5 p-5 sm:p-8 space-y-5"
            data-testid="why-subscribe-uniqueness"
          >
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <p className="text-xs font-bold tracking-widest text-primary uppercase">Nothing else is this</p>
              <h3 className="text-xl sm:text-2xl font-display font-black text-foreground">
                Your employer has tools. They don&apos;t have this kit.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A private operating kit for hospice growth execution between sessions — for the conversations and weeks
                that decide who the facility remembers.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {[
                {
                  not: "ChatGPT / generic AI",
                  is: "Hospice growth moments — objections, visits, weeks — not open-ended chat",
                },
                {
                  not: "Corporate training / LMS",
                  is: "Always-on tools for this week's accounts, not a one-off slide deck",
                },
                {
                  not: "CRM or census dashboards",
                  is: "Execution between visits: answers, practice, plans — not another report",
                },
                {
                  not: '"We already have tools" at work',
                  is: "A private Field Kit your employer did not build for you",
                },
              ].map((row) => (
                <div
                  key={row.not}
                  className="rounded-lg border border-border bg-background/80 p-4 space-y-2 text-left"
                >
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <X className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/70" aria-hidden />
                    <span>
                      <span className="font-semibold text-foreground/80">Not </span>
                      {row.not}
                    </span>
                  </p>
                  <p className="text-xs text-foreground flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="font-semibold text-primary">Field Kit: </span>
                      {row.is}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <div className="max-w-xl mx-auto space-y-6 text-center">
            <ul className="space-y-2 text-left text-sm text-muted-foreground">
              {[
                "Company should pay? Request team access — seats under contract.",
                "Not sure yet? Preview every tool first. Subscribe when you're ready.",
                "Cancel anytime from Account — access continues through the period you paid for.",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <SubscribeCTA
              surface="field_kit_why"
              showPreview
              showHint
              testId="field-kit-why-subscribe"
            />
            <p className="text-xs text-muted-foreground">
              Team or company seats?{" "}
              <Link href="/request-access" className="text-primary font-semibold hover:underline">
                Request team access
              </Link>{" "}
              or{" "}
              <Link href="/contact?service=Field+Kit+Membership" className="text-primary font-semibold hover:underline">
                talk to Nick
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING CTA ── */}
      <section
        className="py-16 sm:py-20 border-y border-border bg-card"
        data-testid="section-pricing-cta"
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Join the Field Kit</p>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground">
            Individual access · $14.99/week
          </h2>
          <div className="rounded-xl border border-border bg-background p-8 space-y-6">
            <div>
              <p className="text-5xl font-black text-primary">$14.99</p>
              <p className="text-muted-foreground font-semibold mt-1">per week · the price of one incomplete referral conversation</p>
            </div>
            <ul className="space-y-3 text-left">
              {[
                "All 13 Field Kit tools — every stage of the growth cycle",
                "Web app + mobile app — in the field and at the desk",
                "Create account, then subscribe — live tools unlock after checkout",
                "Cancel from Account — access continues through the paid period",
                "Preview any tool first — no guesswork about what's inside",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3">
              <SubscribeCTA surface="field_kit_pricing" showHint={false} testId="field-kit-pricing-cta" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Setting up <strong className="text-foreground">team or company seats</strong>?{" "}
              <Link href="/request-access" className="text-primary hover:underline">
                Request team access
              </Link>{" "}
              — team seats use weekly per-seat pricing under contract.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20 bg-background" data-testid="section-faq">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs font-bold tracking-widest text-primary uppercase">Common questions</p>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-foreground">
              Questions prospects actually ask
            </h2>
          </div>
          <div className="space-y-3" data-testid="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card overflow-hidden"
                data-testid={`faq-item-${i}`}
              >
                <button
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-semibold text-foreground">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="relative py-20 sm:py-24 surface-band" data-testid="section-closing-cta">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Perform at this level</p>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground">
            The rep the facility calls first<br />is the one who already had the answer.
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Create your account, subscribe for $14.99/week, and unlock all 13 tools.
            The reps who consistently rank at the top of their agencies don&apos;t wing it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <SubscribeCTA surface="field_kit_why" showHint={false} testId="field-kit-closing-cta" />
            <Button asChild variant="outline" className="font-bold" size="lg">
              <Link href="/contact">Talk through options first</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
