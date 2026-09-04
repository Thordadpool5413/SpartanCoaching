import { AccentText } from "@/components/AccentText";
/**
 * Trust Center (HSP-40) — pricing facts, consent model, and plain-language trust.
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
import { PublicConversionPanel } from "@/components/PublicConversionPanel";

export default function TrustCenter() {
  return (
    <div className="page-persuasion max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10" data-testid="page-trust-center">
      <SEO
        title="Trust Center | Spartan Coaching"
        description="How Hospice Sales Pro handles data, AI, billing, consent, and professional boundaries — plain language."
      />

      <header className="space-y-3">
        <p className="text-kicker">Trust & transparency</p>
        <h1 className="text-h1 font-display font-black text-foreground tracking-tight">
          Trust <span className="text-primary">Center</span>
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">{TRUST_CENTER_INTRO}</p>
      </header>

      <Card className="border border-primary/25 bg-primary/[0.04] p-5 sm:p-6 space-y-3" data-testid="trust-pricing-facts">
        <h2 className="text-lg font-bold text-foreground">Pricing <span className="text-spartan-red">facts</span></h2>
        <ul className="space-y-2 text-sm text-foreground leading-relaxed">
          <li>
            <strong>{PRICING_FACTS.productName} individual:</strong>{" "}
            {PRICING_FACTS.individualWeeklyLabel} · {PRICING_FACTS.individualBillingNote}
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

      <Card className="border border-border p-5 sm:p-6 space-y-3" data-testid="trust-consent">
        <h2 className="text-lg font-bold text-foreground">Consent & resource <span className="text-spartan-red">delivery</span></h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {CONSENT_COPY.resourceDeliveryBody}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {CONSENT_COPY.marketingOptInHint} Marketing email is always optional and separate from membership.
        </p>
        <p className="text-xs text-muted-foreground">
          Legal documents:{" "}
          <Link href="/privacy" className="text-primary font-semibold hover:underline">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="text-primary font-semibold hover:underline">
            Terms
          </Link>
          {" · "}
          <Link href="/compliance" className="text-primary font-semibold hover:underline">
            Compliance
          </Link>
        </p>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold text-foreground">How we <span className="text-spartan-red">operate</span></h2>
        <div className="grid gap-4">
          {TRUST_CENTER_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-xl border border-border bg-card p-5 space-y-2"
              data-testid={`trust-section-${section.id}`}
            >
              <h3 className="text-base font-bold text-foreground"><AccentText>{section.title}</AccentText></h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
      </div>

      <Card className="border border-border p-5 space-y-2">
        <h2 className="text-base font-bold text-foreground">Field tool <span className="text-spartan-red">reminder</span></h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{FIELD_KIT_PHI.banner}</p>
        <p className="text-xs text-muted-foreground">
          {PUBLIC_CLAIM_SAFE.fieldCraft} · {PUBLIC_CLAIM_SAFE.ethics}
        </p>
      </Card>
      <PublicConversionPanel
        source="trust"
        audience="Buyers, members, and provider teams validating pricing, data handling, and professional boundaries."
        promise="Know what the product is designed to do, how access works, and where to ask a specific question."
        evidence="This center uses canonical pricing and states only practices the product is designed to support."
        primary={{ label: "Review Hospice Sales Pro access", href: "/hospice-sales-pro", token: "hospice_sales_pro" }}
        secondary={{ label: "Ask a trust or compliance question", href: "/contact?service=HIPAA+BAA+Request", token: "trust_contact" }}
      />
    </div>
  );
}
