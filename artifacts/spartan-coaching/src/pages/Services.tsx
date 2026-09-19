import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";

export default function Services() {
  const pathways = [
    {
      id: "coaching",
      title: "Coaching & Strategy",
      subtitle: "For Leaders & High-Performing Reps",
      desc: "Direct strategy and coaching. Break through stalled territories, handle objections, and build a system that tells you where to go and who to see.",
      features: [
        "1:1 virtual coaching sessions",
        "Field coaching ridealongs",
        "Territory management coaching",
        "Leadership & scorecard design"
      ]
    },
    {
      id: "workshops",
      title: "Team Workshops",
      subtitle: "For Organizations Scaling Execution",
      desc: "Give your entire team the same language and process. Transform from firefighting to coaching with a standardized playbook that drives results.",
      features: [
        "1-2 day live training workshops",
        "Customized market curriculum",
        "Objection & discovery practice",
        "Written execution playbook"
      ]
    },
    {
      id: "technology",
      title: "Technology Solutions",
      subtitle: "For Corporate Providers",
      desc: "Stop forcing generic CRMs to fit hospice workflows. We build custom iOS apps, specific CRMs, and web portals designed exactly for how liaisons actually work.",
      features: [
        "Custom hospice CRM development",
        "Native iOS field apps",
        "Referral source integration",
        "Market & territory analysis tech"
      ]
    }
  ];

  return (
    <div className="public-services bg-background min-h-screen">
      <SEO title="Consulting & Services | Spartan Coaching" />
      <BackButton />

      {/* EDITORIAL HERO */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-[56rem] mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-6">Expert-Led Consulting</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-foreground leading-[1.1] mb-6" data-testid="text-services-title">
            Work with us.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-[1.7] mb-10 max-w-2xl mx-auto">
            Human coaching, team systems, and leadership rhythms for hospice growth. We install the coaching and the weekly system — not a slide deck you forget on Monday.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Button size="lg" asChild className="rounded-none bg-foreground text-background hover:bg-primary hover:text-white border-none min-h-[3.25rem] px-8 text-sm font-semibold tracking-wide w-full sm:w-auto">
              <Link href="/contact">Book a strategy call</Link>
            </Button>
            <Link href="/method" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 pb-0.5">
              Review our method
            </Link>
          </div>
        </div>
      </section>

      {/* PATHWAYS - Asymmetric list, not heavy cards */}
      <section className="py-20 md:py-32 bg-surface px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-[56rem] mx-auto">
          <div className="space-y-20">
            {pathways.map(pathway => (
              <div key={pathway.id} className="grid md:grid-cols-[1fr_1.5fr] gap-8 md:gap-12" data-testid={`pathway-${pathway.id}`}>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">{pathway.subtitle}</p>
                  <h2 className="text-2xl font-medium text-foreground mb-4">{pathway.title}</h2>
                  <Link href={`/contact?service=${encodeURIComponent(pathway.title)}`} className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mt-4">
                    Discuss {pathway.title.split(' ')[0].toLowerCase()} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div>
                  <p className="text-base text-muted-foreground leading-relaxed mb-8">{pathway.desc}</p>
                  <ul className="grid sm:grid-cols-2 gap-y-4 gap-x-6">
                    {pathway.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/contact?service=${encodeURIComponent(pathway.title)}`} className="md:hidden inline-flex items-center gap-1.5 text-sm font-medium text-primary mt-8">
                    Discuss {pathway.title.split(' ')[0].toLowerCase()} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIVACY / COMPLIANCE (Quiet) */}
      <section className="py-16 bg-background px-4 text-center border-b border-border">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-lg font-medium text-foreground mb-3">Privacy-first engagement</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Keep PHI out of routine coaching and sales-tool workflows. If a corporate engagement requires regulated data access, the workflow and required agreements are reviewed before work begins.
          </p>
          <Link href="/contact?service=Privacy+and+compliance+requirements" className="text-sm text-primary font-medium hover:underline">
            Discuss compliance requirements
          </Link>
        </div>
      </section>

      <PublicConversionPanel
        source="services"
        audience="Leaders looking for structural coaching and strategic systems."
        promise="A direct conversation about the reality of your market, not a generic pitch."
        evidence="Built from the field for the field."
        primary={{ label: "Book Strategy Call", href: "/contact", token: "strategy_call" }}
        secondary={{ label: "View Our Method", href: "/method", token: "method" }}
      />
    </div>
  );
}
