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
  nextStep?: string;
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
  nextStep = "Follow the primary action above. The next page will keep access, timing, and any information needed explicit.",
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
    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.workspaceHandoff, `${source}:${token}`);
  };

  return (
    <section
      className={cn("fi-section bg-white px-5 py-20 md:px-10 md:py-28", className)}
      aria-label="Your next step"
      data-testid={`public-conversion-${source}`}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:gap-24 items-start">
          <div>
            <p className="fi-kicker mb-6">A clear next step</p>
            <h2 className="fi-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.9] mb-10">
              Choose the path that matches the <span className="text-[var(--fi-red)]">work in front of you.</span>
            </h2>
            <dl className="grid gap-6 sm:grid-cols-3 pt-8 border-t border-[var(--fi-line)]">
              <div>
                <dt className="text-[0.65rem] font-bold font-mono uppercase tracking-[.2em] text-black/50 mb-2">For</dt>
                <dd className="text-[0.95rem] leading-[1.6] font-medium text-black/80">{audience}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-bold font-mono uppercase tracking-[.2em] text-black/50 mb-2">What this helps with</dt>
                <dd className="text-[0.95rem] leading-[1.6] font-medium text-black/80">{promise}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-bold font-mono uppercase tracking-[.2em] text-black/50 mb-2">Why trust it</dt>
                <dd className="text-[0.95rem] leading-[1.6] font-medium text-black/80">{evidence}</dd>
              </div>
            </dl>
          </div>
          
          <div className="bg-[var(--fi-paper)] p-8 md:p-12 border border-[var(--fi-line)] flex flex-col">
            <div className="flex flex-col gap-4 mb-8">
              <Link href={primary.href} onClick={() => trackCta(primary.token)} className="fi-btn-primary !w-full justify-center">
                {primary.label}
              </Link>
              {secondary ? (
                <Link href={secondary.href} onClick={() => trackCta(secondary.token)} className="fi-btn-outline !w-full justify-center">
                  {secondary.label}
                </Link>
              ) : null}
            </div>
            
            <p className="text-center text-[0.8rem] leading-[1.6] text-black/60 font-medium mb-8">
              {PRICING_FACTS.consultingSeparate}
            </p>
            
            <div className="border-t border-[var(--fi-line)] pt-6 mt-auto">
              <p className="text-[0.65rem] font-bold font-mono uppercase tracking-[.2em] text-black/50 mb-2">What happens next</p>
              <p className="text-[0.95rem] leading-[1.6] font-medium text-black/80">{nextStep}</p>
            </div>
          </div>
        </div>

        {showOfferPaths ? (
          <div className="mt-20 grid gap-6 sm:grid-cols-2 xl:grid-cols-4 pt-12 border-t border-[var(--fi-line)]">
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
      className="border border-[var(--fi-line)] bg-[var(--fi-paper)] p-6 transition-colors hover:border-[var(--fi-ink)] hover:bg-white flex flex-col"
    >
      <Icon className="h-5 w-5 text-[var(--fi-red)] mb-4" aria-hidden />
      <p className="text-[1.125rem] font-bold text-[var(--fi-ink)] mb-2">{label}</p>
      <p className="text-[0.9rem] leading-[1.6] font-medium text-black/60">{detail}</p>
    </Link>
  );
}