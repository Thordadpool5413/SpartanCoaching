import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Check, Compass, Layers3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const proof = ["Hospice specific", "Built for field execution", "Compliance aware", "Web and iPhone"];

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
            serviceType: ["Hospice Growth Consulting", "Hospice Sales Training"],
            areaServed: "US",
          })}
        </script>
      </Helmet>

      <section className="editorial-hero editorial-hero-v3" data-testid="section-hero">
        <div className="editorial-container editorial-hero-v3-grid">
          <div className="editorial-hero-copy">
            <p className="editorial-kicker">Hospice growth built to execute</p>
            <h1 data-testid="text-home-hero-title">Build a growth system your team can actually run.</h1>
            <p className="editorial-deck">
              Spartan Coaching brings the strategy, coaching, and accountability.
              Hospice Sales Pro puts the system in your team&apos;s hands every day.
            </p>
            <div className="editorial-actions">
              <Button size="lg" asChild data-testid="button-hero-contact">
                <Link href="/contact">Book a strategy call <ArrowRight aria-hidden /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-hero-product">
                <Link href="/hospice-sales-pro">Explore Hospice Sales Pro</Link>
              </Button>
            </div>
          </div>

          <div className="editorial-film" aria-label="Spartan Coaching point of view">
            <video autoPlay muted loop playsInline preload="metadata" aria-label="Spartan Coaching brand film">
              <source src="/spartan-coaching-video.mp4" type="video/mp4" />
            </video>
            <div className="editorial-film-caption">
              <span>Built in the field</span>
              <strong>Strategy becomes behavior.</strong>
            </div>
          </div>
        </div>

        <div className="editorial-proof editorial-container" aria-label="Product strengths">
          {proof.map((item) => <span key={item}><Check aria-hidden />{item}</span>)}
        </div>
      </section>

      <section className="editorial-section" data-testid="section-offers">
        <div className="editorial-container">
          <div className="editorial-heading-row">
            <div>
              <p className="editorial-kicker">One system. Two ways to use it.</p>
              <h2>Strategy beside daily execution.</h2>
            </div>
            <p>Bring Spartan into the room, then give the team a practical way to carry the work into every week.</p>
          </div>

          <div className="editorial-offers">
            <article className="editorial-offer editorial-offer-primary">
              <div className="editorial-offer-topline"><Compass aria-hidden /><span>Consulting</span></div>
              <h3>Build the system.</h3>
              <p>Leadership alignment, field coaching, team development, and a market strategy built around the realities of your organization.</p>
              <ul><li>Clear growth priorities</li><li>Better field behavior</li><li>Accountability leaders can coach</li></ul>
              <Button asChild><Link href="/contact">Book a strategy call <ArrowRight aria-hidden /></Link></Button>
            </article>

            <article className="editorial-offer editorial-offer-product">
              <div className="editorial-offer-topline"><Layers3 aria-hidden /><span>Hospice Sales Pro</span></div>
              <h3>Run it every day.</h3>
              <p>Command Center, Spartan Coach, field tools, practice, planning, and resources on web and iPhone.</p>
              <div className="editorial-pricing">
                <div className="recommended"><small>Recommended</small><strong>Elite</strong><b>$19.99</b><span>per week</span></div>
                <div><small>Available</small><strong>Standard</strong><b>$14.99</b><span>per week</span></div>
              </div>
              <Button variant="outline" asChild><Link href="/hospice-sales-pro">Compare plans <ArrowRight aria-hidden /></Link></Button>
            </article>
          </div>
          <p className="editorial-team-note"><ShieldCheck aria-hidden /> Team agreements include a 90 day minimum. Consulting is scoped separately.</p>
        </div>
      </section>

      <section className="editorial-section editorial-section-ink" data-testid="section-method">
        <div className="editorial-container editorial-method">
          <div><p className="editorial-kicker">The standard</p><h2>Less theater. More traction.</h2></div>
          <ol>
            <li><span>01</span><div><strong>Find the real constraint.</strong><p>See what is breaking across strategy, leadership, workflow, or field execution.</p></div></li>
            <li><span>02</span><div><strong>Build the operating rhythm.</strong><p>Give the team clear language, priorities, practice, and accountability.</p></div></li>
            <li><span>03</span><div><strong>Make it repeatable.</strong><p>Use Hospice Sales Pro to carry the system into every workday.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="editorial-close" data-testid="section-closing">
        <div className="editorial-container">
          <p className="editorial-kicker">Your next move</p>
          <h2>Build what the market can feel.</h2>
          <p>A clearer team. A stronger field presence. A system that holds up after the meeting ends.</p>
          <div className="editorial-actions">
            <Button size="lg" asChild><Link href="/contact">Book a strategy call <ArrowRight aria-hidden /></Link></Button>
            <Button size="lg" variant="ghost" asChild><Link href="/hospice-sales-pro">See Hospice Sales Pro</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
