import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  MessageCircle,
  CalendarDays,
  Users,
  Shield,
  Phone,
  Clock,
  BookOpen,
} from "lucide-react";
import { FieldKitGate } from "@/components/FieldKitGate";

const CHECKLIST = [
  {
    title: "Handle one real objection",
    desc: "Paste a live objection and get a field-ready response.",
    href: "/tools/objections",
    icon: MessageCircle,
  },
  {
    title: "Build this week’s plan",
    desc: "Turn accounts into a Monday–Friday territory rhythm.",
    href: "/tools/weekly-plan-builder",
    icon: CalendarDays,
  },
  {
    title: "Role-play your toughest scenario",
    desc: "Practice the conversation before you walk into the building.",
    href: "/tools/role-play",
    icon: Users,
  },
  {
    title: "Book a debrief call",
    desc: "While your evaluation is open, talk through what you are seeing.",
    href: "/contact",
    icon: Phone,
  },
];

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

export default function Portal() {
  const { member, organization, fieldKit, canUseFieldKit, isLoading } = useAuth();

  if (isLoading) {
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

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 sm:py-14" data-testid="page-portal">
      <SEO />
      <div className="mb-10 space-y-3">
        <p className="text-xs font-bold tracking-widest text-red-400 uppercase">Field Kit</p>
        <h1 className="text-h1 font-display font-black text-foreground">
          Welcome{member?.name ? `, ${member.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Your private toolkit for hospice growth execution — prepare, practice, plan, and measure between coaching sessions.
        </p>
        {trialLabel && (
          <div
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-2"
            data-testid="banner-trial"
          >
            <Clock className="w-4 h-4" />
            {trialLabel}
            {organization?.status === "trial" && (
              <Link href="/contact" className="underline ml-1 hover:text-white">
                Book a debrief
              </Link>
            )}
          </div>
        )}
      </div>

      <section className="mb-12">
        <h2 className="text-lg font-bold text-foreground mb-4">Start here</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {CHECKLIST.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} data-testid={`link-checklist-${item.href}`}>
                <Card className="h-full border border-white/10 dark:bg-[#0f0f0f] p-5 hover:border-primary/40 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
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
            <Link href="/articles">
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

      <p className="text-xs text-muted-foreground text-center">
        Do not enter PHI into tools. Coaching aid only — not clinical advice.{" "}
        <Link href="/compliance" className="text-primary hover:underline">
          Compliance
        </Link>
        {" · "}
        <Link href="/account" className="text-primary hover:underline">
          Account
        </Link>
      </p>
    </div>
  );
}
