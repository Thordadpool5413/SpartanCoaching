import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import nickPhoto from "@assets/nick-photo.jpg";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";

const principles = [
  {
    id: "01",
    title: "Field clarity",
    desc: "Make the next action visible enough to coach and repeat.",
  },
  {
    id: "02",
    title: "Human judgment",
    desc: "Use systems to support better conversations, not replace them.",
  },
  {
    id: "03",
    title: "Responsible proof",
    desc: "Distinguish operating standards from approved client evidence.",
  }
];

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="About Spartan Coaching | Hospice Growth Coaching" />
      <BackButton />

      <main className="pb-24">
        {/* Dossier Header */}
        <header className="px-4 pt-20 pb-12 sm:px-6 lg:px-8 max-w-[84rem] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-8">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-3">
                <span className="w-4 h-px bg-primary"></span>
                Founder & Operating Standard
              </p>
              <h1
                className="font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.9] tracking-[-0.02em] text-foreground uppercase text-balance"
                data-testid="text-about-title"
              >
                Built for the people responsible for the next hospice conversation.
              </h1>
            </div>
            <div className="md:text-right shrink-0">
               <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Nick Lynch</p>
               <p className="text-sm font-medium mt-1">Spartan Coaching</p>
            </div>
          </div>
        </header>

        {/* Core Narrative & Portrait */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-[84rem] mx-auto mt-12">
          <div className="grid lg:grid-cols-[5fr_7fr] gap-12 lg:gap-24 items-start">
            
            {/* Left: Portrait */}
            <div className="relative group lg:sticky lg:top-24">
               <div className="absolute -inset-3 bg-muted/30 border border-border/50 z-0 hidden lg:block"></div>
               <figure className="relative z-10 p-3 border border-border bg-card shadow-sm">
                  <div className="overflow-hidden bg-muted aspect-[3/4] md:aspect-square lg:aspect-[4/5]">
                    <img
                      src={nickPhoto}
                      alt="Nick Lynch, founder of Spartan Coaching"
                      className="w-full h-full object-cover object-top grayscale-[0.3] contrast-125"
                       data-testid="img-founder"
                    />
                  </div>
                  <figcaption className="mt-4 flex justify-between items-center border-t border-border pt-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nick Lynch</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-primary font-bold">Founder</span>
                  </figcaption>
               </figure>
            </div>

            {/* Right: Narrative */}
            <div className="pt-2 lg:pt-12">
               <div className="space-y-8 text-base md:text-lg text-muted-foreground leading-[1.7]">
                 <p className="text-foreground font-medium text-xl md:text-2xl leading-snug">
                    Hospice sales work carries a serious responsibility: helping eligible patients and families understand care early enough to make an informed decision.
                 </p>
                 <p>
                    Spartan Coaching exists to help hospice sales teams replace vague activity with clearer preparation, stronger conversations, and accountable next moves. We give liaisons, directors, and multi-market teams a practical way to prepare, practice, execute, and review. 
                 </p>
                 <p>
                    Nick brings together what liaisons see in the field and what leaders need to see to coach performance without guessing. He has led teams, worked in clinics, and spent real time on ride alongs—seeing where good plans break down and what holds up when the week gets busy.
                 </p>
               </div>

               <div className="mt-12 border-y border-border py-8" data-testid="founder-authority">
                 <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-foreground mb-6">
                   Experience brought to the work
                 </p>
                 <div className="grid sm:grid-cols-3 gap-6">
                   <div>
                     <p className="text-sm font-semibold text-foreground">Field leadership</p>
                     <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Leading teams and turning territory conditions into a plan reps can execute.</p>
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-foreground">Clinical workflow</p>
                     <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Keeping growth work aligned with how hospice conversations and care decisions actually move.</p>
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-foreground">Coach development</p>
                     <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Helping leaders understand the person behind the pipeline and coach the next behavior.</p>
                   </div>
                 </div>
               </div>

               <div className="mt-16 pt-12 border-t border-border">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-foreground mb-8">Working Principles</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {principles.map((p) => (
                      <div key={p.id} className="relative">
                         <span className="block text-primary font-mono text-sm font-bold mb-3">{p.id}</span>
                         <h3 className="text-foreground font-medium mb-2">{p.title}</h3>
                         <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="mt-16 flex flex-wrap gap-4 border-t border-border pt-12">
                  <Button size="lg" asChild className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-widest px-8 min-h-[3.5rem]">
                    <Link href="/contact">Discuss your situation</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="rounded-none font-mono text-xs uppercase tracking-widest px-8 min-h-[3.5rem] border-border hover:bg-muted/50">
                    <Link href="/services">View consulting</Link>
                  </Button>
               </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
