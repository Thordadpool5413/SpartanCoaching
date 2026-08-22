import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Check, Compass, Layers3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const proof = [
  "Hospice specific",
  "Built for field execution",
  "Compliance aware",
  "Web and iPhone",
];

export default function Home() {
  return (
    <div className="elite-public-home">
      <SEO />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: "Spartan Coaching",
            url: "https://spartanhospicecoaching.com",
            founder: { "@type": "Person", name: "Nick Lynch" },
            serviceType: [
              "Hospice Growth Consulting",
              "Hospice Sales Training",
            ],
            areaServed: "US",
          })}
        </script>
      </Helmet>

      <section className="editorial-hero" data-testid="section-hero">
        <div className="editorial-grid editorial-container">
          <div className="editorial-hero-copy">
            <p className="editorial-kicker">Hospice growth, built to execute</p>
            <h1 data-testid="text-home-hero-title">
              Build the team referral partners remember.
            </h1>
            <p className="editorial-deck">
              Spartan Coaching turns growth strategy into conversations, habits,
              and accountability your team can use in the field every day.
            </p>
            <div className="editorial-actions">
              <Button size="lg" asChild data-testid="button-hero-contact">
                <Link href="/contact">
                  Book a strategy call <ArrowRight />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                data-testid="button-hero-product"
              >
                <Link href="/hospice-sales-pro">Explore Hospice Sales Pro</Link>
              </Button>
            </div>
          </div>
          <aside
            className="editorial-hero-note"
            aria-label="Spartan Coaching point of view"
          >
            <span>01</span>
            <p>Growth does not stall because teams need another slogan.</p>
            <strong>It stalls when strategy never becomes behavior.</strong>
          </aside>
        </div>
        <div
          className="editorial-proof editorial-container"
          aria-label="Product strengths"
        >
          {proof.map((item) => (
            <span key={item}>
              <Check aria-hidden />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="editorial-section" data-testid="section-offers">
        <div className="editorial-container">
          <div className="editorial-heading-row">
            <div>
              <p className="editorial-kicker">
                One system. Two ways to use it.
              </p>
              <h2>Strategy beside daily execution.</h2>
            </div>
            <p>
              Bring Spartan into the room, then put the same discipline in your
              team’s hands between coaching sessions.
            </p>
          </div>
          <div className="editorial-offers">
            <article className="editorial-offer editorial-offer-primary">
              <div className="editorial-offer-topline">
                <Compass />
                <span>Consulting</span>
              </div>
              <h3>Build the growth system.</h3>
              <p>
                Leadership alignment, team coaching, field development,
                workshops, and practical market strategy led by Nick Lynch.
              </p>
              <ul>
                <li>Strategy built around your market</li>
                <li>Coaching that changes field behavior</li>
                <li>Clear accountability for leaders and teams</li>
              </ul>
              <Button asChild>
                <Link href="/contact">
                  Book a strategy call <ArrowRight />
                </Link>
              </Button>
            </article>
            <article className="editorial-offer editorial-offer-product">
              <div className="editorial-offer-topline">
                <Layers3 />
                <span>Hospice Sales Pro</span>
              </div>
              <h3>Execute the system every day.</h3>
              <p>
                Command Center, Spartan Coach, field tools, practice, planning,
                and resources on web and iPhone.
              </p>
              <div className="editorial-pricing">
                <div className="recommended">
                  <small>Recommended</small>
                  <strong>Elite</strong>
                  <b>$19.99</b>
                  <span>per week</span>
                </div>
                <div>
                  <small>Available</small>
                  <strong>Standard</strong>
                  <b>$14.99</b>
                  <span>per week</span>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href="/hospice-sales-pro">
                  Compare plans <ArrowRight />
                </Link>
              </Button>
            </article>
          </div>
          <p className="editorial-team-note">
            <ShieldCheck /> Team agreements include a 90 day minimum. Consulting
            is scoped separately.
          </p>
        </div>
      </section>

      <section
        className="editorial-section editorial-section-ink"
        data-testid="section-method"
      >
        <div className="editorial-container editorial-method">
          <div>
            <p className="editorial-kicker">The standard</p>
            <h2>Less theater. More traction.</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>See the real constraint.</strong>
                <p>
                  Find the breakdown in strategy, leadership, workflow, or field
                  execution.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Build the operating rhythm.</strong>
                <p>
                  Give the team clear language, priorities, practice, and
                  accountability.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Make it repeatable.</strong>
                <p>
                  Use Hospice Sales Pro to carry the system into every workday.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="editorial-close" data-testid="section-closing">
        <div className="editorial-container">
          <p className="editorial-kicker">Your next move</p>
          <h2>Stop hoping the market notices.</h2>
          <p>
            Build a growth system your team can explain, execute, and improve.
          </p>
          <div className="editorial-actions">
            <Button size="lg" asChild>
              <Link href="/contact">
                Book a strategy call <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/hospice-sales-pro">See Hospice Sales Pro</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
