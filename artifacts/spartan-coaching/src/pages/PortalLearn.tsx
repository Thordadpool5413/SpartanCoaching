import { AccentText } from "@/components/AccentText";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BookOpen, Headphones, FolderOpen, Flame, HelpCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { FieldKitGate } from "@/components/FieldKitGate";

const LINKS = [
  {
    href: "/articles",
    title: "Articles",
    desc: "Industry insights and thought leadership for hospice growth.",
    icon: BookOpen,
    memberOnly: false,
    group: "Build knowledge",
  },
  {
    href: "/podcasts",
    title: "Podcasts",
    desc: "Listen to coaching conversations and field lessons.",
    icon: Headphones,
    memberOnly: false,
    group: "Field lessons",
  },
  {
    href: "/resources",
    title: "Training resources",
    desc: "Templates, scripts, and downloadable field materials.",
    icon: FolderOpen,
    memberOnly: false,
    group: "Field lessons",
  },
  {
    href: "/learn/knowledge-base",
    title: "Knowledge base",
    desc: "Hospice terminology and regulations reference (membership).",
    icon: BookOpen,
    memberOnly: true,
    group: "Build knowledge",
  },
  {
    href: "/drills",
    title: "Daily drills",
    desc: "Short practice reps that build consistent execution.",
    icon: Flame,
    memberOnly: true,
    group: "Practice",
  },
  {
    href: "/quiz",
    title: "Knowledge quiz",
    desc: "Test hospice sales knowledge with scored questions.",
    icon: HelpCircle,
    memberOnly: true,
    group: "Practice",
  },
];

export default function PortalLearn() {
  const { canUseFieldKit, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="page-portal-learn-loading">
        <div className="flex justify-center py-16" role="status" aria-live="polite" aria-label="Loading">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 surface-page" data-testid="page-portal-learn">
      <SEO />
      <div className="mb-10 space-y-3">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">Hospice Sales Pro · Learn</p>
        <h1 className="text-h1 font-display font-black"><AccentText>Learn it. Practice it. Use it.</AccentText></h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">Build the knowledge, practice the skill, and carry one better move into the next conversation.</p>
      </div>

      <div className="space-y-8 mb-10">
        {["Build knowledge", "Practice", "Field lessons"].map((group) => <section key={group} aria-labelledby={`learn-${group.replace(/\s/g, "-").toLowerCase()}`}>
          <h2 id={`learn-${group.replace(/\s/g, "-").toLowerCase()}`} className="mb-3 text-xl font-black"><AccentText>{group}</AccentText></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {LINKS.filter((item) => item.group === group).map((item) => {
          const Icon = item.icon;
          const locked = item.memberOnly && !canUseFieldKit;
          const href = locked ? "/request-access" : item.href;
          return (
            <Link key={item.href} href={href}>
              <Card className="h-full border border-border bg-card p-5 hover:border-primary/40 transition-colors">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground"><AccentText>{item.title}</AccentText></h3>
                      {item.memberOnly && (
                        <span className="text-[10px] uppercase tracking-wide text-primary font-bold">
                          {locked ? "Pro" : "Hospice Sales Pro"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">{item.desc}</p>
                    <span className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                      {locked ? "Request access" : "Open"} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
          </div>
        </section>)}
      </div>

      {!canUseFieldKit && (
        <div className="mb-8">
          <FieldKitGate compact />
        </div>
      )}

      <div className="text-center">
        <Button asChild variant="outline" className="font-bold">
          <Link href="/portal">Back to Portal</Link>
        </Button>
      </div>
    </div>
  );
}
