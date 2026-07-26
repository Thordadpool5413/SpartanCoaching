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
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { SEO } from "@/components/SEO";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/animations";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { FieldKitChrome } from "@/components/FieldKitChrome";
import {
  FIELD_KIT_WHAT,
  FIELD_KIT_HOW,
  FIELD_KIT_TOOLS,
  FIELD_KIT_CATEGORIES,
  type FieldKitTool,
} from "@/lib/fieldKitCatalog";

const TOOL_ICONS: Record<string, ReactNode> = {
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

export default function Tools() {
  const [searchQuery, setSearchQuery] = useState("");
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
        tool.why.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

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
    const href = locked ? "/request-access" : tool.path;
    return (
      <StaggerItem key={tool.path}>
        <Card
          className={cn(
            "flex flex-col border-2 group relative spacing-card shadow-lg h-full",
            locked && "opacity-95",
          )}
          data-testid={`card-tool-${tool.id}`}
        >
          <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="relative flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  {TOOL_ICONS[tool.id] ?? <Calculator className="w-8 h-8" />}
                </div>
                <h3 className="text-h3 font-bold text-foreground">{tool.title}</h3>
              </div>
              {locked && <Lock className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
            <div className="mb-3">
              <Badge variant="secondary">{tool.category}</Badge>
            </div>
            <p className="text-body text-muted-foreground leading-relaxed mb-2">{tool.description}</p>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-6">
              <span className="font-semibold text-foreground">When: </span>
              {tool.whenToUse}
            </p>
            <Button asChild className="w-full font-bold touch-manipulation py-3 min-h-[44px]" size="lg">
              <Link
                href={href}
                data-testid={`button-tool-${idx}`}
                aria-label={locked ? `Request access for ${tool.title}` : `Launch ${tool.title}`}
              >
                {locked ? "Request access to use" : tool.public ? "Open" : "Launch tool"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </StaggerItem>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <SEO />
      <BackButton />
      {!showCatalogGate && <FieldKitChrome />}
      <SlideUp>
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">Field Kit</p>
          <h1 className="text-h1 font-black text-foreground mb-4" data-testid="text-tools-title">
            Tools
          </h1>
          <p className="text-body-lg text-muted-foreground leading-relaxed">
            {showCatalogGate
              ? "Reserved for Spartan clients and approved evaluators. Prepare, practice, plan, and measure — the same standards we coach in the field."
              : FIELD_KIT_WHAT}
          </p>
          {!showCatalogGate && (
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
              {FIELD_KIT_HOW}{" "}
              <Link href="/portal" className="font-semibold text-primary hover:underline">
                Back to Field Kit home
              </Link>
            </p>
          )}
        </div>
      </SlideUp>

      {!showCatalogGate && (
        <SlideUp delay={0.05}>
          <Card className="mb-10 border-2 border-primary/30 bg-primary/5 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">AI Tool Library</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Open 14 purpose-built tools for sales enablement, learning, content, and
                    permission-controlled clinical decision support.
                  </p>
                </div>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/tools/ai">
                  Open AI tools <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </SlideUp>
      )}

      {showCatalogGate && (
        <SlideUp delay={0.05}>
          <Card className="mb-10 border border-primary/30 bg-primary/5 p-6 sm:p-8" data-testid="tools-access-banner">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-1">Member access required</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    Request evaluation access for a timed window, or sign in if you are already a client. Prefer a
                    human path? Book a strategy call anytime.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button asChild className="font-bold" data-testid="button-tools-request">
                  <Link href="/request-access">
                    <KeyRound className="mr-2 w-4 h-4" />
                    Request access
                  </Link>
                </Button>
                <Button asChild variant="outline" className="font-bold" data-testid="button-tools-login">
                  <Link href={isAuthenticated ? "/account" : "/login"}>
                    <LogIn className="mr-2 w-4 h-4" />
                    {isAuthenticated ? "Account" : "Client login"}
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="font-bold">
                  <Link href="/contact">Book a call</Link>
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
              Sample — Objection Handler
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">Objection: </span>
              {SAMPLE_OBJECTION.objection}
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed border-l-2 border-primary pl-4">
              {SAMPLE_OBJECTION.response}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Live tools unlock after approval. This is a static example only.
            </p>
          </Card>
        </SlideUp>
      )}

      <SlideUp delay={0.1}>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by name, when to use, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-tools-search"
              className="pl-10"
              aria-label="Search tools"
            />
          </div>
          <p className="text-sm text-muted-foreground">{filteredTools.length} tools</p>
        </div>
      </SlideUp>

      {!searchQuery.trim() ? (
        <div className="space-y-10">
          {Array.from(byCategory.entries()).map(([cat, items]) => (
            <section key={cat} data-testid={`tools-category-${cat.toLowerCase()}`}>
              <h2 className="text-lg font-bold text-foreground mb-4">{cat}</h2>
              <StaggerContainer className="grid md:grid-cols-2 gap-cards">
                {items.map((tool, idx) => renderCard(tool, idx))}
              </StaggerContainer>
            </section>
          ))}
        </div>
      ) : (
        <StaggerContainer className="grid md:grid-cols-2 gap-cards">
          {filteredTools.map((tool, idx) => renderCard(tool, idx))}
        </StaggerContainer>
      )}

      {filteredTools.length === 0 && (
        <div className="text-center py-12 mt-10 space-y-3">
          <p className="text-body-lg text-muted-foreground">
            No tools found matching &quot;{searchQuery}&quot;.
          </p>
          <Button asChild variant="outline" className="font-bold">
            <Link href="/portal">Go to Field Kit home</Link>
          </Button>
        </div>
      )}

      <SlideUp delay={0.2}>
        <div className="mt-12 sm:mt-16 rounded-2xl p-8 md:p-12 text-center border border-border bg-card">
          <h2 className="text-h2 font-bold text-foreground mb-4">Coaching stays human</h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            The Field Kit supports execution between sessions. Strategy calls and engagements are how
            organizations transform.
          </p>
          <Button size="lg" asChild className="font-bold" data-testid="button-tools-contact">
            <Link href="/contact">
              Book a strategy call
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </SlideUp>
    </div>
  );
}
