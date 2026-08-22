import { Link } from "wouter";
import { ArrowRight, BookOpen, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";

const authority = [
  [Target, "Field truth", "The work begins with what teams face in real referral conversations, not a generic sales theory."],
  [Users, "Leadership clarity", "Leaders learn what to coach, what to measure, and how to turn standards into a weekly rhythm."],
  [BookOpen, "A teachable system", "The Spartan Method gives every market a common language while preserving human judgment."],
] as const;

export default function About() {
  return (
    <div className="public-editorial-page">
      <SEO />
      <div className="public-editorial-container">
        <BackButton />
        <header className="public-editorial-hero public-about-hero">
          <div><p className="editorial-kicker">Nick Lynch. Spartan Coaching.</p><h1 data-testid="text-about-title">Hospice growth deserves more than motivational noise.</h1></div>
          <div className="public-editorial-intro">
            <p>Nick built Spartan Coaching from years inside hospice growth, leadership, and field development. The mission is simple: help good teams become clear, credible, and consistent.</p>
            <Button asChild><Link href="/contact">Start a conversation <ArrowRight aria-hidden /></Link></Button>
          </div>
        </header>

        <section className="public-editorial-quote">
          <p>Good people do not need more pressure. They need a system that makes great work easier to repeat.</p>
          <span>Nick Lynch, Founder</span>
        </section>

        <section className="public-authority-grid">
          {authority.map(([Icon, title, copy]) => <article key={title}><Icon aria-hidden /><h2>{title}</h2><p>{copy}</p></article>)}
        </section>

        <section className="public-editorial-band">
          <div><p className="editorial-kicker">Consulting plus execution</p><h2>Nick brings the system. Hospice Sales Pro keeps it moving.</h2></div>
          <p>Consulting addresses the organization. Hospice Sales Pro supports the daily work on web and iPhone.</p>
        </section>
      </div>
    </div>
  );
}
