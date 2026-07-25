import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Briefcase, Wrench, CheckCircle } from "lucide-react";
import { SEO } from "@/components/SEO";
import { TrustStrip } from "@/components/TrustStrip";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { lazy, Suspense, Component } from "react";
import type { ReactNode } from "react";
import nickPhoto from "@assets/nick-photo.jpg";

const SpartanHeroAnimation = lazy(() =>
  import("@/components/SpartanHeroAnimation").then((m) => ({ default: m.SpartanHeroAnimation })),
);

class AnimationErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  componentDidCatch() {
    this.setState({ failed: true });
  }
  render() {
    return this.state.failed ? <div className="absolute inset-0 bg-background" /> : this.props.children;
  }
}

export default function Home() {
  return (
    <div className="flex flex-col">
      <SEO />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "ProfessionalService",
                "@id":
                  (typeof window !== "undefined" ? window.location.origin : "https://spartancoaching.com") +
                  "/#organization",
                name: "Spartan Coaching",
                description:
                  "Practical coaching for hospice growth professionals. Build consistent referral relationships and execute territory strategy with discipline, ethical messaging, and measurable weekly accountability. Private Field Kit for clients and approved evaluators.",
                url: typeof window !== "undefined" ? window.location.origin : "https://spartancoaching.com",
                email: "nick@spartanhospicecoaching.com",
                founder: {
                  "@type": "Person",
                  name: "Nick Lynch",
                  jobTitle: "Founder",
                  url: "https://www.linkedin.com/in/nicholas-lynch-coaching",
                },
                serviceType: [
                  "Hospice Growth Coaching",
                  "Sales Training",
                  "Strategic Consulting",
                  "Leadership Coaching",
                  "Field Kit Tools",
                ],
                areaServed: "US",
                knowsAbout: [
                  "Hospice Sales",
                  "Healthcare Sales Training",
                  "Medicare Hospice Benefits",
                  "Referral Development",
                  "Territory Management",
                ],
              },
              {
                "@type": "WebSite",
                name: "Spartan Coaching",
                url: typeof window !== "undefined" ? window.location.origin : "https://spartancoaching.com",
                description:
                  "Hospice sales consulting and private Field Kit. Evaluation first; individuals $14.99/week after approval.",
              },
            ],
          })}
        </script>
      </Helmet>

      {/* ── 1. HERO (stays dark — brand authority) ── */}
      <section
        className="relative min-h-[85vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-background"
        data-testid="section-hero"
      >
        <AnimationErrorBoundary>
          <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
            <SpartanHeroAnimation />
          </Suspense>
        </AnimationErrorBoundary>
      </section>

      {/* ── 2. AUTHORITY STRIP (photo + credentials — hire confidence) ── */}
      <section
        className="relative border-y border-border bg-card text-card-foreground"
        data-testid="section-authority"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <FadeIn>
            <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-12 items-center">
              <div className="relative mx-auto md:mx-0 w-40 sm:w-48 md:w-full aspect-[4/5] overflow-hidden border-l-4 border-primary shadow-lg">
                <img
                  src={nickPhoto}
                  alt="Nick Lynch, founder of Spartan Coaching"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">
                  Hospice growth coaching · field systems
                </p>
                <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-foreground mb-3">
                  Built by someone who has run the territory — not a generic sales trainer.
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                  Nick Lynch coaches hospice liaisons, directors, and multi-market teams on the
                  conversations and weekly systems that move eligible patients into care — with ethics
                  and accountability in the same room.
                </p>
                <ul className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mb-8 text-sm font-semibold text-foreground">
                  <li>12+ years hospice-specific</li>
                  <li>500+ reps &amp; leaders coached</li>
                  <li>Private Field Kit · no PHI</li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Button size="lg" asChild className="font-bold shadow-md" data-testid="button-authority-contact">
                    <Link href="/contact">
                      Book a strategy call
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="font-bold border-2" data-testid="button-authority-about">
                    <Link href="/about">About Nick Lynch</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 3. PROBLEM (short) ── */}
      <section className="relative surface-band py-16 sm:py-20" data-testid="section-stakes">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-sm font-bold tracking-widest text-primary uppercase mb-4">The real problem</p>
            <h2 className="text-h2 font-bold text-foreground mb-6 font-display" data-testid="text-stakes-title">
              The gap is not clinical. It is conversational.
            </h2>
            <p className="text-body-lg text-muted-foreground leading-relaxed mb-8">
              Eligible patients miss hospice because the right conversations never happen — a stalled referral, a “not yet” without a response, a family who was never asked. Spartan exists to close that gap with structure and heart in the same room.
            </p>
            <Button size="lg" variant="outline" asChild className="font-bold border-2" data-testid="button-stakes-manifesto">
              <Link href="/manifesto">
                Read the Spartan Ethos
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* ── 4. THREE PILLARS (soft hybrid band for scanability) ── */}
      <section className="relative page-persuasion py-16 sm:py-24" data-testid="section-pillars">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-sm font-bold tracking-widest text-primary uppercase mb-4">How Spartan helps</p>
              <h2 className="text-h2 text-foreground font-display">Coaching. Systems. Field execution.</h2>
            </div>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Individual & leadership coaching",
                desc: "Virtual sessions, field ridealongs, and leadership rhythms that change Tuesday behavior — not just slide decks.",
                href: "/services",
                cta: "View services",
              },
              {
                icon: Briefcase,
                title: "Team systems & programs",
                desc: "Workshops, growth strategy, and programs built for hospice providers who need one playbook the whole team runs.",
                href: "/programs",
                cta: "View programs",
              },
              {
                icon: Wrench,
                title: "Private Field Kit",
                desc: "AI tools for objections, plans, role-play, and calculators — reserved for clients and approved evaluators.",
                href: "/tools",
                cta: "Explore Field Kit",
              },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <StaggerItem key={p.title}>
                  <Card className="h-full border-2 bg-card shadow-sm p-6 flex flex-col" data-testid={`card-pillar-${p.title}`}>
                    <div className="w-12 h-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{p.desc}</p>
                    <Link href={p.href} className="text-sm font-bold text-primary inline-flex items-center gap-1 hover:underline">
                      {p.cta} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
          <FadeIn>
            <div className="text-center mt-10">
              <Button asChild variant="outline" className="font-bold border-2">
                <Link href="/method">
                  See the Spartan Method
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FIELD KIT SUBSCRIPTION ── */}
      <section
        className="relative border-y border-border bg-card py-14 sm:py-20"
        data-testid="section-membership-pricing"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-10 space-y-3">
              <p className="text-sm font-bold tracking-widest text-primary uppercase">Private Field Kit</p>
              <h2 className="text-h2 font-display font-black text-foreground">
                13 private tools. One weekly price.
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Built for the conversations that move eligible patients into care — not generic sales AI.
                Individuals subscribe at{" "}
                <strong className="text-foreground">$14.99/week</strong>, cancel anytime.
                Teams use weekly per-seat rates under contract.
              </p>
            </div>

            {/* Compact 2-col tool grid */}
            <div className="grid sm:grid-cols-2 gap-2 max-w-3xl mx-auto mb-10">
              {[
                { title: "Objection Handler", desc: "Field-ready responses to every objection you hear this week" },
                { title: "Weekly Plan Builder", desc: "Monday–Friday territory plan with win conditions" },
                { title: "Playbook Generator", desc: "Talking points and a clear ask for any account visit" },
                { title: "Role-Play Practice", desc: "Simulate hard conversations before you're in the room" },
                { title: "Cold Call Script Generator", desc: "Openers and next-step asks for new outreach" },
                { title: "Sales Command Center", desc: "Pre-call prep, outcomes, and next-step scheduling" },
                { title: "Activity Calculator", desc: "Turn an admission goal into daily conversation targets" },
                { title: "ROI Calculator", desc: "Put a revenue number next to every coaching conversation" },
              ].map((tool) => (
                <div key={tool.title} className="flex gap-2.5 p-3 rounded-lg border border-border">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-foreground">{tool.title}</span>
                    <span className="text-xs text-muted-foreground"> — {tool.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mb-8">
              + Email Templates, Grounded Research, Call Transcriber, Rep Cost Calculator, Branch Profitability Simulator
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="font-bold shadow-md" data-testid="button-home-membership">
                <Link href="/field-kit-membership">
                  View membership &amp; subscribe
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold border-2">
                <Link href="/request-access">Request evaluation</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold border-2">
                <Link href="/account">Account / billing</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 5. OUTCOMES (compact) ── */}
      <section className="relative bg-background py-16 sm:py-20" data-testid="section-results">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-sm font-bold tracking-widest text-primary uppercase mb-4">Outcomes</p>
              <h2 className="text-h2 text-gradient-elegant font-display" data-testid="text-results-title">
                What changes look like
              </h2>
            </div>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
            {[
              {
                title: "Clarity and follow-through",
                text: "Priority accounts become clear. Follow-up stops slipping. Weekly focus holds when the week is hard.",
              },
              {
                title: "Better next steps",
                text: "Conversations move. Post-visit plans stick. Leaders coach one skill at a time instead of firefighting.",
              },
            ].map((c) => (
              <StaggerItem key={c.title}>
                <Card className="border border-border bg-card border-l-4 border-l-primary p-6 h-full">
                  <h3 className="text-lg font-bold text-foreground mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <FadeIn>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-8">
              {[
                "Hospice-specific, not generic sales training",
                "Compliance-aware messaging",
                "Field-tested frameworks",
              ].map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 text-sm text-foreground/90 border border-border rounded-full px-4 py-2"
                >
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  {b}
                </div>
              ))}
            </div>
            <div className="text-center">
              <Button asChild variant="outline" className="font-bold">
                <Link href="/testimonials">
                  Read outcomes & testimonials
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 6. TRUST ── */}
      <section className="relative bg-background py-14 sm:py-18" data-testid="section-trust">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <TrustStrip />
          </FadeIn>
        </div>
      </section>

      {/* ── 7. CLOSING — two clear CTAs only ── */}
      <section className="relative surface-band py-20 sm:py-28" data-testid="section-closing">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <FadeIn>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-bold tracking-widest text-primary uppercase mb-6">Ready to close the gap?</p>
            <h2 className="text-h2 font-bold text-foreground mb-6 font-display" data-testid="text-closing-title">
              Stop winging it.
            </h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              If you are ready to build a system that holds when the week is hard, reach out. Honest conversation — no pressure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="font-bold px-10 shadow-lg" data-testid="button-closing-contact">
                <Link href="/contact">
                  Book a strategy call
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold border-2" data-testid="button-closing-request">
                <Link href="/request-access">Request Field Kit access</Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
