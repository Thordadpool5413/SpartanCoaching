import { AccentText } from "@/components/AccentText";
import { Card } from "@/components/ui/card";
import { LightbulbIcon, SearchIcon as CustomSearchIcon, ChatIcon, MicrophoneIcon } from "@/components/icons";
import {
  Mail,
  Users,
  Search,
  ArrowRight,
  Calculator,
  DollarSign,
  TrendingUp,
  Building,
  Phone,
  CalendarDays,
  Video,
  Lock,
  LogIn,
  KeyRound,
  BrainCircuit,
  Crosshair,
  Sparkles,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/animations";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { PRICING_FACTS } from "@/lib/complianceCopy";
import {
  FIELD_KIT_TOOLS,
  FIELD_KIT_CATEGORIES,
  FIELD_KIT_DAILY_TOOL_IDS,
  FIELD_KIT_LEADER_TOOL_IDS,
  DISCOVERY_INTENTS,
  PRODUCT_SURFACE_PLACEMENT,
  filterDiscoveryIntents,
  type FieldKitTool,
  type DiscoveryIntent,
  getToolWorkGuide,
} from "@/lib/fieldKitCatalog";
import { UX_WORKSPACE_IMPROVEMENTS } from "@/lib/workspaceUxFlag";

const TOOL_ICONS: Record<string, ReactNode> = {
  "sales-workflow": <Crosshair className="w-8 h-8" />,
  playbooks: <LightbulbIcon className="w-8 h-8" />,
  objections: <ChatIcon className="w-8 h-8" />,
  research: <CustomSearchIcon className="w-8 h-8" />,
  transcribe: <MicrophoneIcon className="w-8 h-8" />,
  "email-templates": <Mail className="w-8 h-8" />,
  "role-play": <Users className="w-8 h-8" />,
  "activity-calculator": <Calculator className="w-8 h-8" />,
  "rep-cost": <DollarSign className="w-8 h-8" />,
  roi: <TrendingUp className="w-8 h-8" />,
  branch: <Building className="w-8 h-8" />,
  "cold-call": <Phone className="w-8 h-8" />,
  "weekly-plan": <CalendarDays className="w-8 h-8" />,
  "brand-video": <Video className="w-8 h-8" />,
};

const SAMPLE_OBJECTION = {
  objection: "We're not ready for hospice yet.",
  response:
    "I hear you — and many families feel that way at first. Hospice is not about giving up; it is about adding a team that supports comfort and clarity. Would it help if we walked through what support could look like while you keep the options that still matter to you?",
};

/** Daily / leader groupings — shared with mobile via field-kit-catalog */
const DAILY_TOOL_IDS = FIELD_KIT_DAILY_TOOL_IDS;
const LEADER_TOOL_IDS = FIELD_KIT_LEADER_TOOL_IDS;

export default function Tools() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);
  const [showAllIntents, setShowAllIntents] = useState(false);
  const { canUseFieldKit, isAuthenticated, isLoading } = useAuth();

  const filteredTools = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return FIELD_KIT_TOOLS.filter((tool) => {
      if (!query) return true;
      return (
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query) ||
        tool.whenToUse.toLowerCase().includes(query) ||
          tool.why.toLowerCase().includes(query) ||
          (tool.scenario || "").toLowerCase().includes(query) ||
          (tool.outcome || "").toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const filteredIntents = useMemo(
    () => filterDiscoveryIntents(searchQuery),
    [searchQuery],
  );

  const showCatalogGate = !isLoading && !canUseFieldKit;

  const byCategory = useMemo(() => {
    const map = new Map<string, FieldKitTool[]>();
    for (const cat of FIELD_KIT_CATEGORIES) {
      const items = filteredTools.filter((t) => t.category === cat);
      if (items.length) map.set(cat, items);
    }
    return map;
  }, [filteredTools]);

  const renderCard = (tool: FieldKitTool, idx: number) => {
    const locked = showCatalogGate && !tool.public;
    // Non-members can open the real tool UI in view-only preview (interaction blocked).
    const href = tool.path;
    return (
      <StaggerItem key={tool.path}>
        <Card
          className={cn(
            "flex flex-col group relative p-5 sm:p-6 h-full border border-border/80 bg-card shadow-none hover:shadow-sm hover:border-border overflow-hidden",
            locked && "opacity-95",
          )}
          data-testid={`card-tool-${tool.id}`}
        >
          <div className="relative flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-muted/80 text-foreground shrink-0">
                  {TOOL_ICONS[tool.id] ?? <Calculator className="w-6 h-6" />}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight tracking-tight"><AccentText>{tool.title}</AccentText></h3>
              </div>
              {locked && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-muted/80 px-2.5 py-1.5 text-xs font-bold uppercase leading-none tracking-[0.06em] text-muted-foreground">
                  <Lock className="w-3 h-3" /> Preview
                </span>
              )}
            </div>
            <div className="mb-3">
              <Badge variant="secondary" className="rounded-full font-semibold">
                {tool.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">{tool.description}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              <span className="font-semibold uppercase tracking-wide text-primary">
                {getToolWorkGuide(tool).phase}
              </span>
              {" · "}
              {getToolWorkGuide(tool).audience}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-6">
              <span className="font-semibold text-foreground">When: </span>
              {tool.whenToUse}
            </p>
            <Button asChild className="w-full font-bold touch-manipulation py-3 min-h-[48px]" size="lg">
              <Link
                href={href}
                data-testid={`button-tool-${idx}`}
                aria-label={
                  locked ? `Preview ${tool.title} (view only)` : `Launch ${tool.title}`
                }
              >
                {locked ? "Preview tool" : tool.public ? "Open" : "Launch tool"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </StaggerItem>
    );
  };

  return (
    <div className="page-persuasion w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 surface-page min-h-[70vh]" data-testid="page-tools">
      <SEO />
      <SlideUp>
        <div className="max-w-3xl mb-7">
          <p className="text-kicker mb-3">Explore</p>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl" data-testid="text-tools-title"><AccentText>Choose the outcome. We will point you to the tool.</AccentText></h1>
          <p className="mt-4 text-base text-muted-foreground leading-7">
            {showCatalogGate
              ? "Start from intent — prepare a visit, handle an objection, plan the week — then open tools or field resources. Live generation unlocks with Hospice Sales Pro."
              : "Start with the job, not the feature. Open one focused workspace, finish the work, and keep the result in My Work."}
          </p>
        </div>
      </SlideUp>

      {UX_WORKSPACE_IMPROVEMENTS ? (
        <Card className="mb-8 border border-border/80 bg-card p-5" data-testid="tools-how-to-choose">
          <p className="text-xs font-black uppercase tracking-widest text-primary">How to choose</p>
          <h2 className="mt-1 text-xl font-black text-foreground"><AccentText>Start with the result you need</AccentText></h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Search the situation, choose the best-matched workspace, complete its primary action, then save or continue the result in My Work. If you are unsure, start with Command or ask Coach.</p>
          <div className="mt-4 flex flex-wrap gap-2"><Button asChild><Link href="/tools/sales-workflow">Open Command</Link></Button><Button asChild variant="outline"><Link href="/portal/coach">Ask Coach</Link></Button></div>
        </Card>
      ) : null}

      <SlideUp delay={0.05}>
        <section className="mb-8 grid gap-3 lg:grid-cols-3" aria-label="Explore Hospice Sales Pro" data-testid="public-spartan-intelligence">
          {[
            { icon: Sparkles, title: "Intelligence", body: "Verify an account, answer a CMS policy question, or understand a market.", href: "/tools/intelligence", action: "Open Intelligence", testId: "button-public-spartan-intelligence" },
            { icon: BookOpen, title: "Resources", body: "Use a downloadable script, checklist, template, or field guide right now.", href: "/resources", action: "Browse resources", testId: "button-explore-resources" },
            { icon: GraduationCap, title: "Learn", body: "Build the knowledge, practice the skill, then test your judgment.", href: "/portal/learn", action: "Open Learn", testId: "button-explore-learn" },
          ].map(({ icon: Icon, title, body, href, action, testId }) => (
            <Card key={title} className="flex h-full flex-col border border-primary/20 bg-primary/[0.04] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary p-2.5 text-primary-foreground"><Icon className="h-5 w-5" /></div>
                <div><p className="font-black text-foreground">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div>
              </div>
              <Button asChild variant="outline" className="mt-4 min-h-11 font-bold">
                <Link href={href} data-testid={testId}>{action}<ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </Card>
          ))}
        </section>
      </SlideUp>

      {showCatalogGate && (
        <SlideUp delay={0.05}>
          <Card className="mb-10 border border-border p-5 sm:p-6" data-testid="tools-access-banner">
            <div className="flex flex-col lg:flex-row lg:items-center gap-5 justify-between">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground mb-1 tracking-tight"><AccentText>Preview open · live tools locked</AccentText></h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    Browse every tool before you decide. Standard unlocks live field work and eligible saves;
                    Elite adds private Coach and deidentified hospice policy education. Already subscribed? Sign in with
                    the same email to restore access.
                  </p>
                  <ul className="mt-3 grid sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                    <li className="flex gap-1.5">
                      <span className="text-primary font-bold">✓</span> Live generation on field tools
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-primary font-bold">✓</span> Command Center for today’s visits
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-primary font-bold">✓</span> Saves synced to iPhone
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-primary font-bold">✓</span> Cancel anytime · same seat
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button asChild className="font-bold" data-testid="button-tools-request">
                  <Link href="/register">
                    <KeyRound className="mr-2 w-4 h-4" />
                    Create account · subscribe
                  </Link>
                </Button>
                <Button asChild variant="outline" className="font-bold" data-testid="button-tools-login">
                  <Link href={isAuthenticated ? "/account" : "/login"}>
                    <LogIn className="mr-2 w-4 h-4" />
                    {isAuthenticated ? "Account & billing" : "Sign in to restore"}
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="font-bold">
                  <Link href="/hospice-sales-pro">Pricing</Link>
                </Button>
              </div>
            </div>
          </Card>
        </SlideUp>
      )}

      {showCatalogGate && (
        <SlideUp delay={0.08}>
          <Card className="mb-10 border border-border bg-card p-6" data-testid="tools-static-sample">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">
              Sample output — Objection Handler
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">Objection: </span>
              {SAMPLE_OBJECTION.objection}
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed border-l-2 border-primary pl-4">
              {SAMPLE_OBJECTION.response}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Open any tool card for the full interface. Live AI generation unlocks with Hospice Sales Pro.
            </p>
          </Card>
        </SlideUp>
      )}

      <SlideUp delay={0.1}>
        <div className="tools-search-dock mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by intent, tool name, or when to use…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-tools-search"
              className="pl-10"
              aria-label="Search tools and intents"
            />
          </div>
          <p className="text-sm text-muted-foreground">{filteredTools.length} tools</p>
        </div>
      </SlideUp>

      {/* Intent-first discovery (HSP-29) */}
      {filteredIntents.length > 0 && (
        <SlideUp delay={0.12}>
          <section className="tools-intent-map mb-12" data-testid="tools-intent-map">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
              <div>
                <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">
                  Start with the job
                </p>
                <h2 className="text-h2 text-foreground"><AccentText>Professional entry points</AccentText></h2>
              </div>
              <Link
                href={PRODUCT_SURFACE_PLACEMENT.field_resources.webPath}
                className="text-sm font-semibold text-primary hover:underline"
                data-testid="link-field-resources-from-tools"
              >
                  Templates & guides →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {filteredIntents.slice(0, showAllIntents || searchQuery.trim() ? undefined : 4).map((intent: DiscoveryIntent) => (
                <Card
                  key={intent.id}
                  className="tools-intent-card border border-border/80 p-4"
                  data-testid={`intent-card-${intent.id}`}
                >
                  <h3 className="text-base font-bold text-foreground"><AccentText>{intent.title}</AccentText></h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {intent.description}
                  </p>
                  {intent.destinations[0] ? (
                    <Link href={intent.destinations[0].webPath} className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-primary hover:underline">
                      {intent.destinations[0].label}<ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : null}
                </Card>
              ))}
            </div>
            {!searchQuery.trim() && filteredIntents.length > 4 ? (
              <div className="mt-4 flex justify-center">
                <Button type="button" variant="ghost" onClick={() => setShowAllIntents((value) => !value)} aria-expanded={showAllIntents}>
                  {showAllIntents ? "Show fewer outcomes" : `See ${filteredIntents.length - 4} more outcomes`}
                </Button>
              </div>
            ) : null}
          </section>
        </SlideUp>
      )}

      {!searchQuery.trim() && !showCatalog ? (
        <Card className="tools-catalog-disclosure border border-border/80 bg-card p-5 sm:p-6" data-testid="tools-catalog-disclosure">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest text-primary uppercase">Full workspace</p>
              <h2 className="mt-1 text-xl font-display font-bold text-foreground"><AccentText>Know the tool you want?</AccentText></h2>
              <p className="mt-1 text-sm text-muted-foreground">Browse all {FIELD_KIT_TOOLS.length} workspaces by job and role.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0 font-bold"
              aria-expanded={showCatalog}
              aria-controls="tools-full-catalog"
              onClick={() => setShowCatalog(true)}
              data-testid="button-show-tools-catalog"
            >
              Browse all tools <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : !searchQuery.trim() ? (
        <div id="tools-full-catalog" className="space-y-12">
          <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            All tools by job
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowCatalog(false)}>
            Show less
          </Button>
          </div>
          {/* Hero: Command Center */}
          {(() => {
            const command = filteredTools.find((t) => t.id === "sales-workflow");
            if (!command) return null;
            const locked = showCatalogGate && !command.public;
            return (
              <section data-testid="tools-hero-command">
                <Card className="border border-primary/40 bg-gradient-to-br from-primary/[0.1] via-card to-card p-6 sm:p-8 shadow-elite-red overflow-hidden relative">
                  <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
                    <div className="flex gap-4 min-w-0">
                      <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30 shrink-0">
                        {TOOL_ICONS["sales-workflow"] ?? <Calculator className="w-8 h-8" />}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase leading-relaxed tracking-[0.12em] text-primary">
                          Next action spine · same as iPhone Command
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tight"><AccentText>{command.title}</AccentText></h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                          Your day starts here—not in a grid of equal tools. Plan the visit, practice if
                          needed, capture the outcome, lock the next step.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {["Mission", "Prepare", "Practice", "Capture", "Next step"].map((s) => (
                            <span
                              key={s}
                              className="rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs font-semibold uppercase leading-none tracking-[0.05em]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button asChild size="lg" className="font-bold shrink-0 w-full sm:w-auto min-h-11">
                      <Link href={command.path} data-testid="button-tools-command-center">
                        {locked ? "Preview Command Center" : "Open Command Center"}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </section>
            );
          })()}

          {/* Daily tools by job (craft Phase 3 — not a flat soup) */}
          {(
            [
              {
                id: "prepare",
                title: "Prepare",
                blurb: "Before the visit — plans, research, email, weekly rhythm",
                cats: ["Prepare", "Plan"],
                testId: "tools-job-prepare",
              },
              {
                id: "practice",
                title: "Practice",
                blurb: "Talk tracks and reps before you walk in",
                cats: ["Practice"],
                testId: "tools-job-practice",
              },
            ] as const
          ).map((job) => {
            const tools = filteredTools.filter(
              (t) =>
                (DAILY_TOOL_IDS as readonly string[]).includes(t.id) &&
                t.id !== "sales-workflow" &&
                (job.cats as readonly string[]).includes(t.category),
            );
            if (!tools.length) return null;
            return (
              <section key={job.id} data-testid={job.testId}>
                <div className="flex items-end justify-between gap-3 mb-5 border-b border-border/60 pb-3">
                  <div>
                    <h2 className="text-xl font-display font-bold text-foreground tracking-tight"><AccentText>{job.title}</AccentText></h2>
                    <p className="text-sm text-muted-foreground mt-1">{job.blurb}</p>
                  </div>
                </div>
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                  {tools.map((tool, idx) => renderCard(tool, idx))}
                </StaggerContainer>
              </section>
            );
          })}

          {/* Other daily tools not in Prepare/Practice buckets */}
          <section data-testid="tools-daily-other">
            {(() => {
              const tools = filteredTools.filter(
                (t) =>
                  (DAILY_TOOL_IDS as readonly string[]).includes(t.id) &&
                  t.id !== "sales-workflow" &&
                  t.category !== "Prepare" &&
                  t.category !== "Plan" &&
                  t.category !== "Practice",
              );
              if (!tools.length) return null;
              return (
                <>
                  <div className="flex items-end justify-between gap-3 mb-5 border-b border-border/60 pb-3">
                    <div>
                      <h2 className="text-xl font-display font-bold text-foreground tracking-tight"><AccentText>Field support</AccentText></h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Satellite to Command — not a second product
                      </p>
                    </div>
                  </div>
                  <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                    {tools.map((tool, idx) => renderCard(tool, idx + 10))}
                  </StaggerContainer>
                </>
              );
            })()}
          </section>

          {/* Leader math */}
          <section data-testid="tools-leaders">
            <div className="flex items-end justify-between gap-3 mb-5 border-b border-border/60 pb-3">
              <div>
                <h2 className="text-xl font-display font-bold text-foreground tracking-tight"><AccentText>For directors &amp; leaders</AccentText></h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Activity, economics, and branch runway
                </p>
              </div>
            </div>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {filteredTools
                .filter((t) => (LEADER_TOOL_IDS as readonly string[]).includes(t.id))
                .map((tool, idx) => renderCard(tool, idx + 20))}
            </StaggerContainer>
          </section>

          {/* Remaining by category */}
          {Array.from(byCategory.entries()).map(([cat, items]) => {
            const rest = items.filter(
              (t) =>
                !(DAILY_TOOL_IDS as readonly string[]).includes(t.id) &&
                !(LEADER_TOOL_IDS as readonly string[]).includes(t.id),
            );
            if (!rest.length) return null;
            return (
              <section key={cat} data-testid={`tools-category-${cat.toLowerCase()}`}>
                <div className="flex items-end justify-between gap-3 mb-5 border-b border-border/60 pb-3">
                  <h2 className="text-xl font-display font-bold text-foreground tracking-tight"><AccentText>{cat}</AccentText></h2>
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums">{rest.length}</span>
                </div>
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                  {rest.map((tool, idx) => renderCard(tool, idx + 40))}
                </StaggerContainer>
              </section>
            );
          })}

          {/* Advanced library — de-emphasized footer of catalog */}
          <section data-testid="advanced-ai-tools-library">
            <Card className="border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground ring-1 ring-border">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold text-foreground tracking-tight"><AccentText>Advanced library</AccentText></h2>
                    <p className="mt-0.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      Specialized AI workflows and permission-controlled nonclinical decision support — secondary to
                      your daily Hospice Sales Pro spine.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="shrink-0 font-bold">
                  <Link href="/tools/ai">
                    Open advanced library <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </section>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredTools.map((tool, idx) => renderCard(tool, idx))}
        </StaggerContainer>
      )}

      {filteredTools.length === 0 && (
        <div className="text-center py-14 mt-10 space-y-4 rounded-2xl border border-border/70 bg-card/50">
          <p className="text-body-lg text-muted-foreground">
            No tools found matching &quot;{searchQuery}&quot;.
          </p>
          <Button asChild variant="outline" className="font-bold">
            <Link href="/portal">Go to Portal</Link>
          </Button>
        </div>
      )}

      {!UX_WORKSPACE_IMPROVEMENTS ? <SlideUp delay={0.2}>
        <div className="mt-12 sm:mt-16 rounded-2xl p-8 md:p-12 text-center border border-border/80 bg-card shadow-elite surface-noise">
          <h2 className="text-h2 font-bold text-foreground mb-4"><AccentText>Coaching stays human</AccentText></h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Hospice Sales Pro tools support execution between sessions. Strategy calls and consulting engagements
            are how organizations transform.
          </p>
          <Button size="lg" asChild className="font-bold" data-testid="button-tools-contact">
            <Link href="/contact">
              Book a strategy call
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </SlideUp> : null}
    </div>
  );
}
