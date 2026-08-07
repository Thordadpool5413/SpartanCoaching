import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BookOpen, Headphones, FolderOpen, Flame, HelpCircle, ArrowRight } from "lucide-react";
import { ToolDisclaimer } from "@/components/ToolDisclaimer";
import { useAuth } from "@/context/AuthContext";
import { FieldKitGate } from "@/components/FieldKitGate";
import { FieldKitChrome } from "@/components/FieldKitChrome";

const LINKS = [
  {
    href: "/articles",
    title: "Articles",
    desc: "Industry insights and thought leadership for hospice growth.",
    icon: BookOpen,
    memberOnly: false,
  },
  {
    href: "/podcasts",
    title: "Podcasts",
    desc: "Listen to coaching conversations and field lessons.",
    icon: Headphones,
    memberOnly: false,
  },
  {
    href: "/resources",
    title: "Training resources",
    desc: "Templates, scripts, and downloadable field materials.",
    icon: FolderOpen,
    memberOnly: false,
  },
  {
    href: "/learn/knowledge-base",
    title: "Knowledge base",
    desc: "Hospice terminology and regulations reference (membership).",
    icon: BookOpen,
    memberOnly: true,
  },
  {
    href: "/drills",
    title: "Daily drills",
    desc: "Short practice reps that build consistent execution.",
    icon: Flame,
    memberOnly: true,
  },
  {
    href: "/quiz",
    title: "Knowledge quiz",
    desc: "Test hospice sales knowledge with scored questions.",
    icon: HelpCircle,
    memberOnly: true,
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
      {canUseFieldKit && <FieldKitChrome />}
      <div className="mb-10 space-y-3">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">Portal · Learn</p>
        <h1 className="text-h1 font-display font-black">Build judgment between sessions</h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Part of membership: articles and resources for everyone; drills, knowledge base, and quiz when access is active.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
        {LINKS.map((item) => {
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
                      <h3 className="font-bold text-foreground">{item.title}</h3>
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

      <ToolDisclaimer className="mt-10 rounded-md border border-border/60 bg-muted/40 py-3 px-4 text-center" />
    </div>
  );
}
