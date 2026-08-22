import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";

const programs = [
  ["Admissions execution", "Fix ownership, speed, and handoffs from referral through start of care."],
  ["Hospital growth", "Build a credible presence around discharge rhythms and the people making decisions."],
  ["Facility partnerships", "Create useful education, stronger follow through, and a referral process staff can trust."],
  ["Physician outreach", "Target the right clinics and replace random visits with purposeful discovery."],
  ["Field leadership", "Give managers a practical coaching rhythm tied to behavior and measurable progress."],
  ["Market turnaround", "Find the constraint, reset priorities, and rebuild execution around the best opportunity."],
];

export default function Programs() {
  return (
    <div className="public-editorial-page">
      <SEO />
      <div className="public-editorial-container">
        <BackButton />
        <header className="public-editorial-hero">
          <div><p className="editorial-kicker">Focused programs</p><h1 data-testid="text-programs-title">Solve the problem that keeps showing up.</h1></div>
          <div className="public-editorial-intro">
            <p>Short, focused engagements for hospice organizations that know where growth is breaking and want the right work built around it.</p>
            <Button asChild><Link href="/contact">Discuss the right program <ArrowRight aria-hidden /></Link></Button>
          </div>
        </header>

        <section className="public-program-grid" aria-label="Available programs">
          {programs.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{copy}</p></article>)}
        </section>

        <section className="public-editorial-band">
          <div><p className="editorial-kicker">Not a catalog</p><h2>The program fits the problem.</h2></div>
          <p>The strongest engagement may combine several areas. The strategy call identifies the constraint before scope is set.</p>
        </section>
      </div>
    </div>
  );
}
