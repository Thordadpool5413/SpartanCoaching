import { Link } from "wouter";
import { ArrowRight, Building2, Compass, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";

const engagements = [
  { icon: Compass, label: "Executive growth advisory", copy: "Clarify the market, the operating model, and the decisions leadership must make next." },
  { icon: Users, label: "Team coaching and training", copy: "Turn strategy into field behavior through practice, direct feedback, and a rhythm leaders can sustain." },
  { icon: Building2, label: "Hospice growth strategy", copy: "Build the territory, referral, accountability, and conversion system around the realities of your market." },
];

export default function Services() {
  return (
    <div className="public-editorial-page">
      <SEO />
      <div className="public-editorial-container">
        <BackButton />
        <header className="public-editorial-hero">
          <div><p className="editorial-kicker">Consulting</p><h1 data-testid="text-services-title">Bring clarity to the room. Put execution in the field.</h1></div>
          <div className="public-editorial-intro">
            <p>Spartan Coaching works with hospice leaders and teams when growth needs more than a training event or another dashboard.</p>
            <Button asChild><Link href="/contact">Book a strategy call <ArrowRight aria-hidden /></Link></Button>
          </div>
        </header>

        <section className="public-editorial-split">
          <div><p className="editorial-kicker">Where Nick helps</p><h2>Work built around the actual constraint.</h2></div>
          <div className="public-editorial-list">
            {engagements.map(({ icon: Icon, label, copy }, index) => (
              <article key={label}><span>0{index + 1}</span><Icon aria-hidden /><div><h3>{label}</h3><p>{copy}</p></div></article>
            ))}
          </div>
        </section>

        <section className="public-editorial-band">
          <div><p className="editorial-kicker">The engagement</p><h2>Diagnose. Build. Coach. Measure.</h2></div>
          <p>Every engagement starts with the business problem, not a preset package. Scope, timing, and investment are defined after the strategy call.</p>
        </section>

        <section className="public-editorial-cta">
          <p className="editorial-kicker">Ready when the work is real</p>
          <h2>Let&apos;s find the move that matters most.</h2>
          <Button size="lg" asChild><Link href="/contact">Book a strategy call <ArrowRight aria-hidden /></Link></Button>
        </section>
      </div>
    </div>
  );
}
