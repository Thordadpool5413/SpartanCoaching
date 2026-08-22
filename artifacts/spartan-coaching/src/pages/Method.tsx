import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";

const stages = [
  ["Discovery", "Learn how the account works, where the friction lives, and what matters to the person in front of you."],
  ["Connecting", "Align communication, cadence, and support to what the referral partner actually needs."],
  ["Guiding", "Use the right hospice capability to solve a real problem without turning the conversation into a pitch."],
  ["Commitment", "Make the next action clear, including the trigger, the owner, and what happens after the referral."],
];

export default function Method() {
  return (
    <div className="public-editorial-page public-editorial-method-page">
      <SEO />
      <div className="public-editorial-container">
        <BackButton />
        <header className="public-editorial-hero">
          <div><p className="editorial-kicker">The Spartan Method</p><h1 data-testid="text-method-title">A sales system built around trust and execution.</h1></div>
          <div className="public-editorial-intro">
            <p>Four disciplined stages give teams a common language without replacing judgment, patient choice, or clinical authority.</p>
            <Button variant="outline" asChild><Link href="/contact">Bring the method to your team <ArrowRight aria-hidden /></Link></Button>
          </div>
        </header>

        <section className="public-method-steps">
          {stages.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><div><h2>{title}</h2><p>{copy}</p></div></article>)}
        </section>

        <section className="public-editorial-band">
          <div><p className="editorial-kicker">The nonnegotiables</p><h2>Choice. Clinical judgment. Privacy.</h2></div>
          <p>The method supports ethical growth. It does not determine eligibility, replace clinicians, or ask teams to trade trust for activity.</p>
        </section>
      </div>
    </div>
  );
}
