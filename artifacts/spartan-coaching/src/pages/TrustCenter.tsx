/**
 * Trust Center (HSP-40), pricing facts, consent model, and plain-language trust.
 */
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CONSENT_COPY,
  PRICING_FACTS,
  PUBLIC_CLAIM_SAFE,
  TRUST_CENTER_INTRO,
  TRUST_CENTER_SECTIONS,
  FIELD_KIT_PHI,
} from "@/lib/complianceCopy";

export default function TrustCenter() {
  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10"
      data-testid="page-trust-center"
    >
      <SEO
        title="Trust Center | Spartan Coaching"
        description="How Hospice Sales Pro handles data, AI, billing, consent, and professional boundaries, plain language."
      />

      <header className="space-y-3">
        <p className="text-kicker">Trust & transparency</p>
        <h1 className="text-h1 font-display font-black text-foreground tracking-tight">
          Trust Center
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">
          {TRUST_CENTER_INTRO}
        </p>
      </header>

      <Card
        className="border border-primary/25 bg-primary/[0.04] p-5 sm:p-6 space-y-3"
        data-testid="trust-pricing-facts"
      >
        <h2 className="text-lg font-bold text-foreground">Pricing facts</h2>
        <ul className="space-y-2 text-sm text-foreground leading-relaxed">
          <li>
            <strong>{PRICING_FACTS.productName} individual:</strong>{" "}
            {PRICING_FACTS.individualWeeklyLabel} ·{" "}
            {PRICING_FACTS.individualBillingNote}
          </li>
          <li>{PRICING_FACTS.previewNote}</li>
          <li>{PRICING_FACTS.teamNote}</li>
          <li>{PRICING_FACTS.evaluationNote}</li>
          <li>{PRICING_FACTS.consultingSeparate}</li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm" className="font-semibold">
            <Link href="/hospice-sales-pro">Hospice Sales Pro</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="font-semibold">
            <Link href="/account">Account & billing</Link>
          </Button>
        </div>
      </Card>

      <Card
        className="border border-border p-5 sm:p-6 space-y-3"
        data-testid="trust-consent"
      >
        <h2 className="text-lg font-bold text-foreground">
          Consent & resource delivery
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {CONSENT_COPY.resourceDeliveryBody}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {CONSENT_COPY.marketingOptInHint} Marketing email is always optional
          and separate from membership.
        </p>
        <p className="text-xs text-muted-foreground">
          Legal documents:{" "}
          <Link
            href="/privacy"
            className="text-primary font-semibold hover:underline"
          >
            Privacy
          </Link>
          {" · "}
          <Link
            href="/terms"
            className="text-primary font-semibold hover:underline"
          >
            Terms
          </Link>
          {" · "}
          <Link
            href="/compliance"
            className="text-primary font-semibold hover:underline"
          >
            Compliance
          </Link>
        </p>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold text-foreground">
          How we operate
        </h2>
        <div className="grid gap-4">
          {TRUST_CENTER_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-xl border border-border bg-card p-5 space-y-2"
              data-testid={`trust-section-${section.id}`}
            >
              <h3 className="text-base font-bold text-foreground">
                {section.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>

      <Card className="border border-border p-5 space-y-2">
        <h2 className="text-base font-bold text-foreground">
          Field tool reminder
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {FIELD_KIT_PHI.banner}
        </p>
        <p className="text-xs text-muted-foreground">
          {PUBLIC_CLAIM_SAFE.fieldCraft} · {PUBLIC_CLAIM_SAFE.ethics}
        </p>
      </Card>
    </div>
  );
}
