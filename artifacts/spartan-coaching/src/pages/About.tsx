import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import nickPhoto from "@assets/nick-photo.jpg";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";

const principles = [
  ["Field clarity", "Make the next action visible enough to coach and repeat."],
  ["Human judgment", "Use systems to support better conversations, not replace them."],
  ["Responsible proof", "Distinguish operating standards from approved client evidence."],
];

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="About Spartan Coaching | Hospice Growth Coaching" />
      <BackButton />

      {/* Editorial Author Narrative */}
      <section className="px-4 py-12 sm:px-6 md:py-20 lg:px-8 border-b border-border">
        <div className="mx-auto max-w-[72rem]">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-start">
            <div className="pt-4">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary mb-6">Nick Lynch · Founder</p>
              <h1
                className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.1] tracking-tight mb-8"
                data-testid="text-about-title"
              >
                Built for the people responsible for the next hospice conversation.
              </h1>
              <div className="prose prose-lg dark:prose-invert text-muted-foreground leading-relaxed mb-10">
                <p>
                  Hospice sales work carries a serious responsibility: helping eligible patients and families understand care early enough to make an informed decision.
                </p>
                <p>
                  Spartan Coaching exists to help hospice sales teams replace vague activity with clearer preparation, stronger conversations, and accountable next moves. We give liaisons, directors, and multi-market teams a practical way to prepare, practice, execute, and review. The work stays close to the field and specific enough for leaders to coach.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-widest px-8">
                  <Link href="/contact">Book a strategy call</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-none font-mono text-xs uppercase tracking-widest px-8">
                  <Link href="/services">View consulting</Link>
                </Button>
              </div>
            </div>

            <div>
              <figure className="relative p-2 border border-border bg-muted/20">
                <img
                  src={nickPhoto}
                  alt="Nick Lynch, founder of Spartan Coaching"
                  className="aspect-[4/3] sm:aspect-square lg:aspect-[4/5] w-full object-cover object-top shadow-sm"
                />
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* Purpose & Principles */}
      <section className="px-4 py-16 sm:px-6 md:py-24 lg:px-8 border-b border-border bg-surface">
        <div className="mx-auto max-w-[72rem]">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary mb-12">Working Principles</p>
          <div className="grid md:grid-cols-3 gap-12">
            {principles.map(([title, copy], index) => (
              <article key={title} className="relative">
                <div className="mb-4 text-muted-foreground/30 font-serif text-5xl">0{index + 1}</div>
                <h3 className="font-serif text-2xl text-foreground mb-3">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Direct Fit section */}
      <section className="px-4 py-16 sm:px-6 md:py-24 lg:px-8 bg-background">
        <div className="mx-auto max-w-[72rem]">
          <div className="grid md:grid-cols-[1fr_1fr] gap-12 items-start border-l-2 border-primary pl-6 md:pl-10">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground leading-[1.1]">
                For leaders ready to inspect the work, not just the number.
              </h2>
            </div>
            <div>
              <p className="text-base leading-relaxed text-muted-foreground mb-8">
                Spartan fits teams willing to choose a standard, practice it, and coach it consistently. If that describes the condition you want to build, start with a direct conversation.
              </p>
              <Link href="/contact" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
                Discuss your situation <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}