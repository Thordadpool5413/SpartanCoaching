import { Link } from "wouter";
import { ArrowRight, Anchor, Target, Scale, Check } from "lucide-react";
import nickPhoto from "@assets/nick-photo-cropped.jpg";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";

const principles = [
  {
    id: "01",
    title: "Field clarity",
    desc: "Make the next action visible enough to coach and repeat.",
    icon: Target
  },
  {
    id: "02",
    title: "Human judgment",
    desc: "Use systems to support better conversations, not replace them.",
    icon: Anchor
  },
  {
    id: "03",
    title: "Responsible proof",
    desc: "Distinguish operating standards from approved client evidence.",
    icon: Scale
  }
];

export default function About() {
  return (
    <div className="page-persuasion font-sans">
      <SEO title="About Spartan Coaching | Hospice Growth Coaching" />
      <BackButton />

      {/* Hero / Founder Story */}
      <section className="fi-section bg-[var(--fi-paper)] pt-20 md:pt-28">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="mb-16 border-b border-[var(--fi-line)] pb-8">
            <p className="fi-kicker mb-8">Founder & Operating Standard</p>
            <h1 className="fi-serif max-w-[1000px] text-[clamp(3.2rem,6vw,6rem)] leading-[0.9]" data-testid="text-about-title">
              Built for the people responsible for the next <span className="text-[var(--fi-red)]">hospice conversation.</span>
            </h1>
          </div>
          
          <div className="grid border border-[var(--fi-line)] bg-white md:grid-cols-[1fr_1fr] mb-24">
            <div className="relative h-[320px] overflow-hidden border-b border-[var(--fi-line)] md:h-auto md:min-h-[560px] md:border-b-0 md:border-r">
              <img 
                src={nickPhoto} 
                alt="Nick Lynch, founder of Spartan Coaching" 
                className="fi-fade-image absolute inset-0 h-full w-full object-cover object-center" 
                style={{ objectPosition: "center bottom" }}
                data-testid="img-founder"
              />
            </div>
            <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
              <div className="space-y-6 text-[1rem] leading-[1.75] text-black/70 font-medium">
                <p className="text-[1.25rem] font-bold leading-[1.5] text-black">
                  Hospice sales work carries a serious responsibility: helping eligible patients and families understand care early enough to make an informed decision.
                </p>
                <p>
                  Spartan Coaching exists to help hospice sales teams replace vague activity with clearer preparation, stronger conversations, and accountable next moves. We give liaisons, directors, and multi-market teams a practical way to prepare, practice, execute, and review.
                </p>
                <p>
                  Nick brings together what liaisons see in the field and what leaders need to see to coach performance without guessing. He has led teams, worked in clinics, and spent real time on ride-alongs—seeing where good plans break down and what holds up when the week gets busy.
                </p>
              </div>
              <div className="mt-12 border-t border-[var(--fi-line)] pt-8">
                <p className="font-bold text-[1.125rem]">Nick Lynch</p>
                <p className="text-[0.75rem] font-bold uppercase tracking-wider text-black/50 mt-2 font-mono">Founder, Spartan Coaching</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience & Principles */}
      <section className="fi-section bg-white px-5 py-20 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-16 md:grid-cols-2 lg:gap-24">
          <div data-testid="founder-authority">
            <h2 className="mb-10 text-[0.75rem] font-bold uppercase tracking-[.2em] text-[var(--fi-ink)] font-mono border-b border-[var(--fi-line)] pb-4">Experience brought to the work</h2>
            <div className="space-y-10">
              <div className="flex gap-5">
                <div className="mt-[6px]"><Check className="w-5 h-5 text-[var(--fi-red)]" /></div>
                <div>
                  <h3 className="text-xl font-bold">Field leadership</h3>
                  <p className="mt-3 text-[1rem] leading-[1.65] text-black/70 font-medium">Leading teams and turning territory conditions into a plan reps can execute.</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="mt-[6px]"><Check className="w-5 h-5 text-[var(--fi-red)]" /></div>
                <div>
                  <h3 className="text-xl font-bold">Clinical workflow</h3>
                  <p className="mt-3 text-[1rem] leading-[1.65] text-black/70 font-medium">Keeping growth work aligned with how hospice conversations and care decisions actually move.</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="mt-[6px]"><Check className="w-5 h-5 text-[var(--fi-red)]" /></div>
                <div>
                  <h3 className="text-xl font-bold">Coach development</h3>
                  <p className="mt-3 text-[1rem] leading-[1.65] text-black/70 font-medium">Helping leaders understand the person behind the pipeline and coach the next behavior.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-10 text-[0.75rem] font-bold uppercase tracking-[.2em] text-[var(--fi-ink)] font-mono border-b border-[var(--fi-line)] pb-4">Working Principles</h2>
            <div className="space-y-6">
              {principles.map((p) => (
                <div key={p.id} className="flex gap-5 border border-[var(--fi-line)] bg-[var(--fi-paper)] p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--fi-line)] bg-white text-[var(--fi-ink)]">
                    <p.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[1rem] font-bold">{p.title}</h3>
                    <p className="mt-2 text-[0.9rem] leading-[1.6] text-black/70 font-medium">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="fi-dark fi-section bg-[var(--fi-ink)] px-5 py-24 text-white md:px-10 md:py-32 text-center">
        <div className="mx-auto max-w-[800px]">
          <h2 className="fi-serif text-[clamp(2.8rem,5vw,4.5rem)] leading-[0.9] mb-8">Ready to set the standard?</h2>
          <p className="mb-12 text-[1.125rem] leading-[1.7] text-white/80 font-medium mx-auto max-w-[600px]">
            Stop guessing what's happening in the field. Build a repeatable system that respects the work and drives growth.
          </p>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Link href="/contact" className="fi-btn-primary !w-full sm:!w-auto">
              Discuss your situation
            </Link>
            <Link href="/services" className="fi-btn-outline-light !w-full sm:!w-auto">
              View consulting
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
