import { useEffect } from "react";
import { ArrowRight, BriefcaseBusiness, Smartphone, Users, Wrench } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRICING_FACTS } from "@/lib/complianceCopy";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";
import { cn } from "@/lib/utils";

type PublicAction = {
  label: string;
  href: string;
  token: string;
};

type PublicConversionPanelProps = {
  source: string;
  audience: string;
  promise: string;
  evidence: string;
  primary: PublicAction;
  secondary?: PublicAction;
  showOfferPaths?: boolean;
  className?: string;
};

/**
 * Shared conversion brief for public pages. It keeps the intended visitor,
 * supported promise, proof standard, and one next action explicit.
 * Analytics deliberately record only fixed route/control tokens.
 */
export function PublicConversionPanel({
  source,
  audience,
  promise,
  evidence,
  primary,
  secondary,
  showOfferPaths = false,
  className,
}: PublicConversionPanelProps) {
  useEffect(() => {
    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.pageIntent, source);
  }, [source]);

  const trackCta = (token: string) => {
    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, `${source}:${token}`);
  };

  return (
    <section
      className={cn("mt-14 sm:mt-20", className)}
      aria-label="Your next step"
      data-testid={`public-conversion-${source}`}
    >
      <Card className="overflow-hidden border border-primary/20 bg-card shadow-sm">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-kicker">A clear next step</p>
              <h2 className="mt-3 text-h2 font-display uppercase tracking-tight text-foreground">
                Choose the path that matches the work in front of you.
              </h2>
              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-primary">For</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-foreground">{audience}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-primary">What this helps with</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-foreground">{promise}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-primary">Why trust it</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-foreground">{evidence}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col gap-3 lg:items-stretch">
              <Button asChild size="lg" className="font-display uppercase tracking-widest min-h-14 rounded-none">
                <Link href={primary.href} onClick={() => trackCta(primary.token)}>
                  {primary.label}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              {secondary ? (
                <Button asChild variant="outline" size="lg" className="font-display uppercase tracking-widest min-h-14 rounded-none">
                  <Link href={secondary.href} onClick={() => trackCta(secondary.token)}>
                    {secondary.label}
                  </Link>
                </Button>
              ) : null}
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                {PRICING_FACTS.consultingSeparate}
              </p>
            </div>
          </div>

          {showOfferPaths ? (
            <div className="mt-8 grid gap-3 border-t border-border pt-6 sm:grid-cols-2 xl:grid-cols-4">
              <OfferPath
                source={source}
                href="/services"
                icon={BriefcaseBusiness}
                label="Consulting"
                detail="Human coaching, workshops, and team systems."
              />
              <OfferPath
                source={source}
                href="/hospice-sales-pro"
                icon={Wrench}
                label="Individual Hospice Sales Pro"
                detail={`Standard ${PRICING_FACTS.individualWeeklyLabel}; Elite ${PRICING_FACTS.eliteWeeklyLabel}.`}
              />
              <OfferPath
                source={source}
                href="/request-access"
                icon={Users}
                label="Team access"
                detail={PRICING_FACTS.teamNote}
              />
              <OfferPath
                source={source}
                href="/app"
                icon={Smartphone}
                label="iPhone app"
                detail="Use the same permitted account on web and iPhone."
              />
            </div>
          ) : null}
        </div>
      </Card>
    </section>
  );
}

function OfferPath({
  source,
  href,
  icon: Icon,
  label,
  detail,
}: {
  source: string;
  href: string;
  icon: typeof BriefcaseBusiness;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      onClick={() =>
        trackPublicFunnelEvent(
          PUBLIC_FUNNEL_EVENT.ctaClick,
          `${source}:offer_path_${label.toLowerCase().replace(/\s+/g, "_")}`,
        )
      }
      className=" border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <p className="mt-2 text-sm font-bold text-foreground">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
    </Link>
  );
}