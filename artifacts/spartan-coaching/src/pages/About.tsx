import { Link } from "wouter";
import { ArrowRight, Anchor, Target, Scale, CheckCircle2 } from "lucide-react";
import nickPhoto from "@assets/nick-photo.jpg";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary/20">
      <SEO title="About Spartan Coaching | Hospice Growth Coaching" />
      <BackButton />

      <main className="pb-32">
        <header className="px-4 pt-32 pb-16 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/50 text-slate-600 text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Founder & Operating Standard
          </div>
          <h1
            className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 text-balance mx-auto max-w-4xl"
            data-testid="text-about-title"
          >
            Built for the people responsible for the next hospice conversation.
          </h1>
        </header>

        <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-8">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="grid md:grid-cols-[1fr_1.5fr] items-stretch">

              {/* Refined Portrait */}
              <div className="relative bg-slate-100 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-2xl transform translate-x-3 translate-y-3"></div>
                  <img
                    src={nickPhoto}
                    alt="Nick Lynch, founder of Spartan Coaching"
                    className="w-full h-full object-cover rounded-2xl shadow-md relative z-10"
                    style={{ objectPosition: "center 20%" }}
                    data-testid="img-founder"
                  />
                </div>
              </div>

              {/* Narrative */}
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <div className="space-y-6 text-slate-600 text-lg leading-relaxed">
                  <p className="text-xl text-slate-900 font-medium leading-snug">
                    Hospice sales work carries a serious responsibility: helping eligible patients and families understand care early enough to make an informed decision.
                  </p>
                  <p>
                    Spartan Coaching exists to help hospice sales teams replace vague activity with clearer preparation, stronger conversations, and accountable next moves. We give liaisons, directors, and multi-market teams a practical way to prepare, practice, execute, and review.
                  </p>
                  <p>
                    Nick brings together what liaisons see in the field and what leaders need to see to coach performance without guessing. He has led teams, worked in clinics, and spent real time on ride-alongs—seeing where good plans break down and what holds up when the week gets busy.
                  </p>
                </div>

                <div className="mt-10 flex items-center gap-4 pt-8 border-t border-slate-100">
                  <div>
                    <p className="font-display font-bold text-lg text-slate-900">Nick Lynch</p>
                    <p className="text-sm text-slate-500">Founder, Spartan Coaching</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-24">
          <div className="grid md:grid-cols-2 gap-16">
            <div data-testid="founder-authority">
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-8">Experience brought to the work</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="mt-1 bg-primary/10 text-primary p-2 rounded-lg h-fit"><CheckCircle2 className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">Field leadership</h3>
                    <p className="text-slate-600 mt-2">Leading teams and turning territory conditions into a plan reps can execute.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-primary/10 text-primary p-2 rounded-lg h-fit"><CheckCircle2 className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">Clinical workflow</h3>
                    <p className="text-slate-600 mt-2">Keeping growth work aligned with how hospice conversations and care decisions actually move.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-primary/10 text-primary p-2 rounded-lg h-fit"><CheckCircle2 className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">Coach development</h3>
                    <p className="text-slate-600 mt-2">Helping leaders understand the person behind the pipeline and coach the next behavior.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-8">Working Principles</h2>
              <div className="space-y-6">
                {principles.map((p) => (
                  <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-5 items-start transition-shadow hover:shadow-md">
                    <div className="bg-slate-50 text-slate-700 p-3 rounded-xl border border-slate-100">
                      <p.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{p.title}</h3>
                      <p className="text-slate-600 text-sm mt-1">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mt-32 text-center">
          <div className="bg-slate-900 text-white rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10">
              <h2 className="font-display text-3xl font-bold mb-6">Ready to set the standard?</h2>
              <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
                Stop guessing what's happening in the field. Build a repeatable system that respects the work and drives growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="rounded-full bg-primary text-white hover:bg-primary/90 font-medium px-8">
                  <Link href="/contact">Discuss your situation</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full font-medium px-8 border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white">
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
