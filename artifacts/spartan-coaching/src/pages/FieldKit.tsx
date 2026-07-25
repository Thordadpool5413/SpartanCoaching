import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useBillingActions } from "@/hooks/useBillingActions";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import {
  CheckCircle,
  ArrowRight,
  CreditCard,
  Loader2,
  Award,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

// 7 primary tools shown in scenario cards — chosen for rep persona relevance
const PRIMARY_TOOL_IDS = [
  "objections",
  "playbooks",
  "role-play",
  "sales-workflow",
  "weekly-plan",
  "cold-call",
  "email-templates",
];

const TOOL_SCENARIOS: Record<string, { scenario: string; outcome: string }> = {
  objections: {
    scenario:
      "You just heard 'we already have a preferred hospice' for the third time this month. You have 20 minutes before the next call.",
    outcome:
      "A field-ready response in 30 seconds — grounded in the actual concern, not a canned comeback.",
  },
  playbooks: {
    scenario:
      "You're heading into St. Mary's for the third visit. No referral yet. You're not sure what to try differently.",
    outcome:
      "A custom playbook with specific talking points, the right ask for this stage, and one clear next step.",
  },
  "role-play": {
    scenario:
      "The charge nurse keeps saying 'I'll pass it along.' You need to change the conversation — but you don't want to fumble it live.",
    outcome:
      "Simulated back-and-forth with coaching feedback before you're in the room. Muscle memory shows up when it counts.",
  },
  "sales-workflow": {
    scenario:
      "You're 10 minutes from a visit at a new SNF. You want to walk in prepared — not running on memory and hope.",
    outcome:
      "Pre-call plan, practice mode, outcome capture, and next step confirmed — all in one continuous workflow.",
  },
  "weekly-plan": {
    scenario:
      "It's Sunday night. You have 15 accounts, one open referral, and three pending conversations. You don't know where Monday starts.",
    outcome:
      "A Monday–Friday plan with win conditions per day. Priority accounts get time. Low-value busyness loses it.",
  },
  "cold-call": {
    scenario:
      "You have a two-hour block for new outreach. You've been winging the opener and it's not converting.",
    outcome:
      "A consistent script with an opener that earns 30 seconds, an objection handler built in, and one clear next-step ask.",
  },
  "email-templates": {
    scenario:
      "You left St. Mary's with a verbal 'maybe.' You need a follow-up that keeps the relationship warm without sounding like every other vendor.",
    outcome:
      "A professional, specific email in two minutes — written at the right tone for a referral relationship, not a sales pitch.",
  },
};

const FAQ_ITEMS = [
  {
    q: "Do I need to already be a Spartan coaching client?",
    a: "No. You can create an individual account, take the 24-hour evaluation window, and subscribe for $14.99/week entirely on your own. If you want coaching alongside the tools, that's a separate conversation — reach out and we'll talk through what makes sense.",
  },
  {
    q: "Is this for individual reps or directors?",
    a: "Both. Individual reps use the Objection Handler, Playbook Generator, Role-Play, and Weekly Plan Builder most. Directors and VPs tend to lean on the Activity Calculator, ROI Calculator, Branch Profitability Simulator, and the coaching debrief workflow in Sales Command Center. The tools are the same kit; how you use them shifts by role.",
  },
  {
    q: "What if I cancel — do I lose my data?",
    a: "Access stops at the end of the period you've already paid for. You won't be mid-week and locked out. If you re-subscribe, you pick up where you left off.",
  },
  {
    q: "Is there a team or company option?",
    a: "Yes. Team and provider accounts use a weekly per-seat rate set under contract — different from the self-serve $14.99 individual price. Request team access and we'll set up an evaluation and seats together.",
  },
];

export default function FieldKit() {
  const { isAuthenticated, organization, member } = useAuth();
  const { startCheckout, checkoutPending } = useBillingActions();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isPersonal = organization?.type === "personal";
  const isPlatform = member?.role === "platform_admin" || organization?.type === "platform";
  const canSubscribe =
    isAuthenticated &&
    isPersonal &&
    !isPlatform &&
    organization?.billingPlan !== "comp" &&
    !(
      organization?.status === "active" &&
      organization?.hasStripeSubscription &&
      (organization?.billingStatus === "active" || organization?.billingStatus === "trialing")
    );

  const primaryTools = PRIMARY_TOOL_IDS.map((id) =>
    FIELD_KIT_TOOLS.find((t) => t.id === id),
  ).filter(Boolean) as (typeof FIELD_KIT_TOOLS)[number][];

  const HeroCTA = () => {
    if (canSubscribe) {
      return (
        <Button className="font-bold" size="lg" onClick={startCheckout} disabled={checkoutPending}>
          {checkoutPending ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Redirecting…
            </>
          ) : (
            <>
              <CreditCard className="mr-2 w-4 h-4" /> Subscribe · $14.99/week
            </>
          )}
        </Button>
      );
    }
    if (isAuthenticated) {
      return (
        <Button asChild className="font-bold" size="lg">
          <Link href="/account">Go to your account</Link>
        </Button>
      );
    }
    return (
      <>
        <Button asChild className="font-bold" size="lg">
          <Link href="/register" data-testid="field-kit-hero-register">
            Start your free evaluation
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="font-bold" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </>
    );
  };

  return (
    <div className="w-full" data-testid="page-field-kit">
      <SEO />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-15 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">
            Private Field Kit · Hospice growth tools
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-foreground leading-[1.05] tracking-tight">
            You know hospice.<br />
            You know the objections.<br />
            <span className="text-primary">Now you have the tools to win them.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Purpose-built for hospice liaisons, directors, and reps — not generic sales AI. Every tool was built on the
            real conversations that happen in SNFs, physician offices, and family meetings across the country.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <HeroCTA />
            {!isAuthenticated && (
              <Button asChild variant="ghost" className="font-medium" size="lg">
                <Link href="/field-kit-membership">
                  View pricing & tool list
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            $14.99/week · cancel anytime · 24-hour free evaluation · no credit card to start
          </p>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ── */}
      <div className="border-y border-border bg-card py-5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">12+ years hospice-specific</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">500+ reps &amp; leaders coached</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">Built by someone who ran the territory</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">Hospice-only · not generic healthcare sales</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BEFORE / AFTER ── */}
      <section className="py-16 sm:py-20 bg-background" data-testid="section-before-after">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-bold tracking-widest text-primary uppercase">Tuesday morning</p>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground">
              Same rep. Same territory. Different Tuesday.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The tools don't change who you are. They change what you walk in with.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <Card className="border border-border bg-card p-6 sm:p-8 space-y-5" data-testid="card-before">
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Without Field Kit
              </div>
              <ul className="space-y-4">
                {[
                  "You're heading into St. Mary's for the third visit. No clear ask prepared. You'll figure it out in the parking lot.",
                  "The charge nurse says 'we already have a preferred hospice.' You respond with something that felt right in the moment but didn't land.",
                  "You leave with a verbal maybe and a vague plan to follow up. The email takes until Thursday. The opportunity goes cold.",
                  "Sunday night: 15 accounts, no plan, no priority. Monday starts reactive.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="text-muted-foreground/50 font-bold shrink-0 mt-0.5">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* After */}
            <Card
              className="border border-primary/40 bg-primary/5 p-6 sm:p-8 space-y-5"
              data-testid="card-after"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                With Field Kit
              </div>
              <ul className="space-y-4">
                {[
                  "Before St. Mary's: Playbook Generator gives you the right talking points for this stage of the relationship and a specific ask for this visit.",
                  "When the objection hits: Objection Handler gave you a response before you walked in — practiced it once out loud so it feels natural, not memorized.",
                  "After the visit: Email template drafted in two minutes, sent the same afternoon. The relationship stays warm.",
                  "Sunday night: Weekly Plan Builder turns 15 accounts into a Monday–Friday plan with win conditions. Monday starts intentional.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* ── TOOL CARDS ── */}
      <section className="py-16 sm:py-20 bg-card border-y border-border" data-testid="section-tool-cards">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-bold tracking-widest text-primary uppercase">7 primary tools</p>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground">
              Built for the conversation you're having Tuesday.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Each tool is built around a specific moment in the hospice growth cycle. Not features —
              situations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4" data-testid="tool-cards-grid">
            {primaryTools.map((tool) => {
              const scene = TOOL_SCENARIOS[tool.id];
              return (
                <Card
                  key={tool.id}
                  className="border border-border bg-background p-5 flex flex-col gap-3"
                  data-testid={`tool-card-${tool.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {tool.category}
                      </span>
                      <h3 className="text-base font-bold text-foreground mt-0.5">{tool.title}</h3>
                    </div>
                  </div>
                  {scene && (
                    <>
                      <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                        "{scene.scenario}"
                      </p>
                      <div className="flex gap-2 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{scene.outcome}</span>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed mt-auto pt-2 border-t border-border">
                    <strong className="text-foreground/70">When to use:</strong> {tool.whenToUse}
                  </p>
                </Card>
              );
            })}

            {/* +6 more tools teaser */}
            <Card className="border border-dashed border-border bg-background/50 p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[120px]">
              <p className="text-sm font-semibold text-muted-foreground">+6 more tools in the kit</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Grounded Research, Call Transcriber, Activity Calculator, ROI Calculator, Rep Cost
                Calculator, Branch Profitability Simulator
              </p>
              <Link
                href="/field-kit-membership"
                className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 mt-1"
              >
                See the full list <ArrowRight className="w-3 h-3" />
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* ── ROI MATH ── */}
      <section className="py-16 sm:py-20 bg-background" data-testid="section-roi">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">The math</p>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground">
            At $14.99 a week, one better conversation pays for the month.
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              {
                stat: "$10K–$20K",
                label: "Medicare revenue per hospice admission",
                sub: "A single eligible patient who doesn't get the conversation is that much the provider doesn't collect.",
              },
              {
                stat: "$14.99/wk",
                label: "The cost of the Objection Handler alone",
                sub: "One stalled 'not ready' converted to an education moment. The math is obvious.",
              },
              {
                stat: "13 tools",
                label: "One kit, every stage",
                sub: "Prepare before. Practice in advance. Plan the week. Measure what it's worth. Repeat.",
              },
            ].map((item) => (
              <Card key={item.stat} className="border border-border bg-card p-5 space-y-2">
                <p className="text-2xl font-black text-primary">{item.stat}</p>
                <p className="text-sm font-bold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.sub}</p>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            The Activity Calculator turns a vague admission goal into daily conversation targets. The ROI Calculator
            puts a revenue number next to every percentage-point improvement. The Objection Handler keeps the
            relationship moving when 'not ready' would have stalled it.
          </p>
        </div>
      </section>

      {/* ── PRICING CTA ── */}
      <section
        className="py-16 sm:py-20 border-y border-border bg-card"
        data-testid="section-pricing-cta"
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">One clear choice</p>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground">
            Individual Field Kit
          </h2>
          <div className="rounded-xl border border-border bg-background p-8 space-y-6">
            <div>
              <p className="text-5xl font-black text-primary">$14.99</p>
              <p className="text-muted-foreground font-semibold mt-1">per week · cancel anytime</p>
            </div>
            <ul className="space-y-3 text-left">
              {[
                "All 13 gated Field Kit tools",
                "Web app + mobile Field Kit app",
                "24-hour free evaluation to start",
                "Cancel from Account — access through the paid period",
                "No admin approval required for individual accounts",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3">
              <HeroCTA />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Setting up <strong className="text-foreground">team or company seats</strong>?{" "}
              <Link href="/request-access" className="text-primary hover:underline">
                Request team access
              </Link>{" "}
              — team seats use weekly per-seat pricing under contract.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20 bg-background" data-testid="section-faq">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs font-bold tracking-widest text-primary uppercase">Common questions</p>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-foreground">
              Questions prospects actually ask
            </h2>
          </div>
          <div className="space-y-3" data-testid="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card overflow-hidden"
                data-testid={`faq-item-${i}`}
              >
                <button
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-semibold text-foreground">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="relative py-20 sm:py-24 surface-band" data-testid="section-closing-cta">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Ready?</p>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground">
            Stop walking in unprepared.
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Create your account in two minutes. Take the 24-hour evaluation window. Subscribe when you're
            ready — $14.99/week, cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <HeroCTA />
            <Button asChild variant="outline" className="font-bold" size="lg">
              <Link href="/contact">Talk through options first</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
