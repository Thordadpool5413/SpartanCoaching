import { Link } from "wouter";
import { ArrowRight, Anchor, Target, Scale, Check } from "lucide-react";
import nickPhoto from "@assets/nick-photo.jpg";
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
      <section className="bg-[var(--fi-paper)] pt-20 md:pt-28">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="mb-16 border-b border-[var(--fi-line)] pb-8">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--fi-rust)]">Founder & Operating Standard</p>
            <h1 className="fi-serif max-w-[900px] text-[clamp(3.2rem,6vw,6rem)] leading-[.88]" data-testid="text-about-title">
              Built for the people responsible for the next hospice conversation.
            </h1>
          </div>
          
          <div className="grid border border-[var(--fi-line)] bg-[var(--fi-cream)] md:grid-cols-[1fr_1fr]">
            <div className="relative min-h-[440px] overflow-hidden border-b md:border-b-0 md:border-r border-[var(--fi-line)]">
              <img 
                src={nickPhoto} 
                alt="Nick Lynch, founder of Spartan Coaching" 
                className="fi-fade-image absolute inset-0 h-full w-full object-cover object-center grayscale-[.35] opacity-90 mix-blend-multiply" 
                style={{ objectPosition: "center 20%" }}
                data-testid="img-founder"
              />
            </div>
            <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
              <div className="space-y-6 text-[16px] leading-[1.75] text-[rgba(19,32,31,.8)]">
                <p className="text-[20px] font-medium leading-[1.5] text-[var(--fi-ink)]">
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
                <p className="font-bold text-[18px]">Nick Lynch</p>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[rgba(19,32,31,.5)] mt-2">Founder, Spartan Coaching</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience & Principles */}
      <section className="bg-[var(--fi-paper)] px-5 py-20 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-16 md:grid-cols-2 lg:gap-24">
          <div data-testid="founder-authority">
            <h2 className="mb-10 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--fi-ink)] border-b border-[var(--fi-line)] pb-4">Experience brought to the work</h2>
            <div className="space-y-10">
              <div className="flex gap-5">
                <div className="mt-1"><Check className="w-5 h-5 text-[var(--fi-rust)]" /></div>
                <div>
                  <h3 className="text-[18px] font-bold">Field leadership</h3>
                  <p className="mt-2 text-[15px] leading-[1.65] text-[rgba(19,32,31,.7)]">Leading teams and turning territory conditions into a plan reps can execute.</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="mt-1"><Check className="w-5 h-5 text-[var(--fi-rust)]" /></div>
                <div>
                  <h3 className="text-[18px] font-bold">Clinical workflow</h3>
                  <p className="mt-2 text-[15px] leading-[1.65] text-[rgba(19,32,31,.7)]">Keeping growth work aligned with how hospice conversations and care decisions actually move.</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="mt-1"><Check className="w-5 h-5 text-[var(--fi-rust)]" /></div>
                <div>
                  <h3 className="text-[18px] font-bold">Coach development</h3>
                  <p className="mt-2 text-[15px] leading-[1.65] text-[rgba(19,32,31,.7)]">Helping leaders understand the person behind the pipeline and coach the next behavior.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-10 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--fi-ink)] border-b border-[var(--fi-line)] pb-4">Working Principles</h2>
            <div className="space-y-6">
              {principles.map((p) => (
                <div key={p.id} className="flex gap-5 border border-[var(--fi-line)] bg-[var(--fi-cream)] p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--fi-line)] bg-[var(--fi-paper)] text-[var(--fi-ink)]">
                    <p.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold">{p.title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.6] text-[rgba(19,32,31,.7)]">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="fi-dark border-t border-[var(--fi-line)] bg-[var(--fi-field)] px-5 py-20 text-[var(--fi-cream)] md:px-10 md:py-28 text-center">
        <div className="mx-auto max-w-[800px]">
          <h2 className="fi-serif text-[clamp(2.8rem,5vw,4.5rem)] leading-[.9] mb-6">Ready to set the standard?</h2>
          <p className="mb-10 text-[17px] leading-[1.7] text-[rgba(251,248,241,.72)] mx-auto max-w-[600px]">
            Stop guessing what's happening in the field. Build a repeatable system that respects the work and drives growth.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/contact" className="fi-btn-primary !bg-[var(--fi-rust)] hover:!bg-[var(--fi-cream)] hover:!text-[var(--fi-ink)]">
              Discuss your situation
            </Link>
            <Link href="/services" className="fi-btn-outline border-[var(--fi-cream)] hover:bg-[var(--fi-cream)] hover:text-[var(--fi-ink)]">
              View consulting
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
