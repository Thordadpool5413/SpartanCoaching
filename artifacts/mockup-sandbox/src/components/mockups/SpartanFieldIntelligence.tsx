import React, { useState } from "react";
import {
  ArrowRight,
  Menu,
  Play,
  X,
} from "lucide-react";
import commandCenter from "../../assets/spartan/command-center.png";
import heroPoster from "../../assets/spartan/hero-poster.jpg";
import logo from "../../assets/spartan/logo.png";
import nickPhoto from "../../assets/spartan/nick-photo.jpg";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
  .fi-root { --ink:#13201f; --paper:#f4f0e8; --cream:#fbf8f1; --field:#173f3b; --rust:#b85d3f; --line:rgba(19,32,31,.18); color:var(--ink); background:var(--paper); font-family:'DM Sans',sans-serif; }
  .fi-root * { box-sizing:border-box; }
  .fi-serif { font-family:'Instrument Serif', Georgia, serif; }
  .fi-rule { height:1px; background:var(--line); }
  .fi-link { color:inherit; text-decoration:none; position:relative; }
  .fi-link:after { content:""; position:absolute; left:0; right:0; bottom:-5px; height:1px; background:currentColor; transform:scaleX(0); transform-origin:right; transition:transform .3s ease; }
  .fi-link:hover:after { transform:scaleX(1); transform-origin:left; }
  .fi-reveal { animation:fiRise .7s both cubic-bezier(.2,.75,.25,1); }
  @keyframes fiRise { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
  @keyframes fiPulse { 0%,100%{opacity:.45} 50%{opacity:1} }
  .fi-fade-image { transition:transform .8s cubic-bezier(.2,.75,.25,1); }
  .fi-fade-image:hover { transform:scale(1.025); }
  @media (prefers-reduced-motion:reduce) { .fi-reveal { animation:none; } *, *:before, *:after { scroll-behavior:auto!important; transition-duration:.01ms!important; } }
`;

const navItems = [
  { label: "The work", href: "#work" },
  { label: "Consulting", href: "#consulting" },
  { label: "Hospice Sales Pro", href: "#pro" },
  { label: "About", href: "#about" },
];

export default function SpartanFieldIntelligence() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filmOpen, setFilmOpen] = useState(false);
  const [activePractice, setActivePractice] = useState<"field" | "leadership">("field");

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="fi-root min-h-screen overflow-hidden">
      <style>{styles}</style>

      <div className="bg-[var(--field)] px-5 py-2 text-center text-[10px] font-semibold uppercase tracking-[.18em] text-[var(--paper)]">
        Practical coaching for hospice growth professionals
      </div>

      <header className="relative z-30 border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 md:px-10">
          <a href="#top" className="flex items-center gap-3" onClick={closeMenu}>
            <img src={logo} alt="Spartan Coaching" className="h-9 w-auto" />
            <span className="hidden border-l border-[var(--line)] pl-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[var(--field)] sm:block">Coaching</span>
          </a>
          <nav className="hidden items-center gap-8 text-[12px] font-semibold md:flex">
            {navItems.map(item => <a className="fi-link" href={item.href} key={item.href}>{item.label}</a>)}
          </nav>
          <div className="hidden items-center gap-5 md:flex">
            <a href="#contact" className="text-[12px] font-semibold">Book a strategy call</a>
            <a href="#pro" className="bg-[var(--rust)] px-4 py-3 text-[11px] font-bold uppercase tracking-[.13em] text-[var(--cream)] transition-transform hover:-translate-y-0.5">Explore the workspace</a>
          </div>
          <button aria-label={menuOpen ? "Close menu" : "Open menu"} className="md:hidden" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
        {menuOpen && <div className="border-t border-[var(--line)] px-5 py-6 md:hidden">
          <div className="flex flex-col gap-5 text-lg">
            {navItems.map(item => <a key={item.href} href={item.href} onClick={closeMenu}>{item.label}</a>)}
            <a href="#contact" onClick={closeMenu} className="mt-2 border-t border-[var(--line)] pt-5 text-sm font-semibold">Book a strategy call <ArrowRight className="ml-2 inline" size={15} /></a>
          </div>
        </div>}
      </header>

      <section id="top" className="mx-auto grid max-w-[1440px] lg:min-h-[690px] lg:grid-cols-[.86fr_1.14fr]">
        <div className="flex flex-col justify-between px-5 py-16 md:px-10 md:py-20 lg:py-24">
          <div className="fi-reveal">
            <div className="mb-10 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--rust)]">
              <span className="h-2 w-2 rounded-full bg-[var(--rust)]" style={{animation:"fiPulse 2s infinite"}} /> Field intelligence
            </div>
            <h1 className="fi-serif max-w-[650px] text-[clamp(3.7rem,7vw,7.5rem)] leading-[.88] tracking-[-.045em]">
              The work is<br /><em>too important</em><br />to wing it.
            </h1>
            <p className="mt-9 max-w-[470px] text-[16px] leading-[1.7] text-[rgba(19,32,31,.72)]">
              Spartan Coaching helps hospice growth leaders prepare better, lead stronger conversations, and leave the field with a next move that is clear enough to coach.
            </p>
          </div>
          <div className="mt-14 flex flex-wrap items-center gap-6">
            <a href="#consulting" className="group inline-flex items-center gap-3 bg-[var(--field)] px-5 py-4 text-[12px] font-bold uppercase tracking-[.12em] text-[var(--cream)] transition-all hover:bg-[var(--rust)]">
              Start with the work <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <button onClick={() => setFilmOpen(true)} className="group inline-flex items-center gap-3 text-[12px] font-bold uppercase tracking-[.12em]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ink)] transition-colors group-hover:bg-[var(--ink)] group-hover:text-[var(--cream)]"><Play size={14} fill="currentColor" /></span> See the field film
            </button>
          </div>
        </div>
        <div className="relative min-h-[470px] overflow-hidden bg-[var(--field)] lg:min-h-0">
          <img src={heroPoster} alt="Spartan Coaching field operating system" className="fi-fade-image absolute inset-0 h-full w-full object-cover object-center opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,35,33,.72)] via-transparent to-[rgba(11,35,33,.1)]" />
          <div className="absolute bottom-7 left-6 right-6 flex items-end justify-between text-[var(--cream)] md:bottom-10 md:left-10 md:right-10">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#e8a183]">Before the conversation</p>
              <p className="fi-serif max-w-[360px] text-3xl leading-[.95] md:text-4xl">Preparation is a form of respect.</p>
            </div>
            <span className="hidden text-right text-[10px] uppercase tracking-[.15em] opacity-75 sm:block">01 / 04<br />Prepare</span>
          </div>
        </div>
      </section>

      <section id="work" className="border-y border-[var(--line)] bg-[var(--cream)]">
        <div className="mx-auto grid max-w-[1440px] md:grid-cols-[.7fr_1.3fr]">
          <div className="border-b border-[var(--line)] px-5 py-14 md:border-b-0 md:border-r md:px-10 md:py-20">
            <p className="mb-20 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--rust)]">The field standard</p>
            <h2 className="fi-serif text-[clamp(2.8rem,5vw,5.3rem)] leading-[.93]">Good activity is not the same as good work.</h2>
          </div>
          <div className="px-5 py-14 md:px-14 md:py-20">
            <p className="max-w-[650px] text-[20px] leading-[1.45] md:text-[27px]">The calendar can be full and the pipeline can still be unclear. The useful question is what the team knows before the visit, what they say when the conversation turns, and what they do next.</p>
            <div className="mt-14 grid gap-0 border-t border-[var(--line)] sm:grid-cols-3">
              {[
                ["01", "Prepare", "Clarify the account, the person, and the decision in front of you."],
                ["02", "Practice", "Work the language before the stakes are high."],
                ["03", "Execute", "Capture the conversation and make the next move visible."],
              ].map(([num, title, copy]) => <div key={num} className="border-b border-[var(--line)] py-7 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0">
                <span className="text-[11px] font-bold text-[var(--rust)]">{num}</span>
                <h3 className="mt-8 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-[1.6] text-[rgba(19,32,31,.65)]">{copy}</p>
              </div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="consulting" className="bg-[var(--field)] text-[var(--cream)]">
        <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
          <div className="flex flex-col justify-between gap-10 border-b border-[rgba(244,240,232,.28)] pb-12 md:flex-row md:items-end">
            <div><p className="mb-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#e8a183]">01 — Direct expert work</p><h2 className="fi-serif max-w-[700px] text-[clamp(3.5rem,7vw,7rem)] leading-[.84]">Spartan<br /><em>Consulting</em></h2></div>
            <p className="max-w-[340px] text-[15px] leading-[1.7] text-[rgba(244,240,232,.72)]">For hospice growth leaders and teams who need a clearer market plan, a coachable field standard, or a leadership rhythm that holds.</p>
          </div>
          <div className="grid gap-12 py-14 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[.15em] text-[#e8a183]">Where we begin</p>
              <div className="mt-8 flex border-b border-[rgba(244,240,232,.28)]">
                <button onClick={() => setActivePractice("field")} className={`mr-8 pb-4 text-left text-sm font-semibold ${activePractice === "field" ? "border-b-2 border-[#e8a183] text-[#e8a183]" : "text-[rgba(244,240,232,.6)]"}`}>Field execution</button>
                <button onClick={() => setActivePractice("leadership")} className={`pb-4 text-left text-sm font-semibold ${activePractice === "leadership" ? "border-b-2 border-[#e8a183] text-[#e8a183]" : "text-[rgba(244,240,232,.6)]"}`}>Leadership</button>
              </div>
              <p className="mt-8 max-w-[450px] text-[18px] leading-[1.55]">{activePractice === "field" ? "Targeted coaching for the exact obstacle holding the team back: an objection, a territory that is not producing, or a referral partner who will not commit." : "Coaching that helps leaders diagnose performance gaps, coach one skill at a time, and build a weekly rhythm that develops capability."}</p>
              <a href="#contact" className="mt-10 inline-flex items-center gap-3 border-b border-[#e8a183] pb-2 text-[12px] font-bold uppercase tracking-[.13em] text-[#e8a183]">Discuss your situation <ArrowRight size={15} /></a>
            </div>
            <div className="grid gap-0 border-t border-[rgba(244,240,232,.28)]">
              {["Virtual coaching sessions", "Field coaching ridealongs", "Territory management coaching", "Team training workshops", "Growth strategy consulting"].map((item, i) => <div key={item} className="flex items-center justify-between border-b border-[rgba(244,240,232,.28)] py-5 text-lg"><span>{item}</span><span className="text-[#e8a183]">0{i + 1}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="pro" className="bg-[var(--paper)]">
        <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-[.85fr_1.15fr]">
            <div><p className="mb-5 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--rust)]">02 — Daily field workspace</p><h2 className="fi-serif text-[clamp(3.2rem,6vw,6.5rem)] leading-[.86]">Hospice<br /><em>Sales Pro</em></h2><p className="mt-8 max-w-[465px] text-[17px] leading-[1.7] text-[rgba(19,32,31,.72)]">A web and iPhone workspace for individuals and teams: prepare the account, practice the language, execute the conversation, and capture the next move.</p><div className="mt-9 flex flex-wrap gap-5"><a href="#contact" className="inline-flex items-center gap-3 bg-[var(--rust)] px-5 py-4 text-[12px] font-bold uppercase tracking-[.12em] text-[var(--cream)]">Explore the platform <ArrowRight size={16} /></a><a href="#contact" className="fi-link self-center text-[12px] font-semibold">Request team access</a></div></div>
            <div className="relative"><div className="absolute -bottom-5 -left-5 h-28 w-28 border-b border-l border-[var(--rust)]" /><div className="relative overflow-hidden border border-[var(--line)] bg-[#d8ddd5]"><img src={commandCenter} alt="Hospice Sales Pro Command Center workspace" className="fi-fade-image block h-auto w-full" /></div><p className="mt-4 flex justify-between text-[10px] font-bold uppercase tracking-[.15em] text-[rgba(19,32,31,.6)]"><span>Command Center</span><span>Web + iPhone</span></p></div>
          </div>
          <div className="mt-20 grid gap-8 border-t border-[var(--line)] pt-10 md:grid-cols-3">
            {[["See the account", "Start with the active territory plan and the conversation in front of you."], ["Use the right tool", "Open practice tools, plans, calculators, and resources when the work requires them."], ["Keep the promise", "Capture the outcome immediately so the next commitment stays connected."]].map(([title, copy]) => <div key={title}><h3 className="text-lg font-semibold">{title}</h3><p className="mt-3 max-w-[300px] text-sm leading-[1.6] text-[rgba(19,32,31,.65)]">{copy}</p></div>)}
          </div>
        </div>
      </section>

      <section id="about" className="border-t border-[var(--line)] bg-[var(--cream)]">
        <div className="mx-auto grid max-w-[1440px] md:grid-cols-[1fr_1fr]">
          <div className="relative min-h-[440px] overflow-hidden md:min-h-[560px]"><img src={nickPhoto} alt="Nick Lynch, founder of Spartan Coaching" className="fi-fade-image absolute inset-0 h-full w-full object-cover object-center grayscale-[.35]" /></div>
          <div className="flex flex-col justify-center px-5 py-16 md:px-16 md:py-24"><p className="mb-7 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--rust)]">Built from the field</p><h2 className="fi-serif text-[clamp(3rem,5vw,5.5rem)] leading-[.88]">The person<br />behind the<br /><em>pipeline.</em></h2><p className="mt-8 max-w-[490px] text-[16px] leading-[1.75] text-[rgba(19,32,31,.72)]">Nick Lynch built Spartan Coaching from the field. The work is shaped by the conversations hospice teams must lead every day—and by what holds up when the week gets busy.</p><a href="#contact" className="mt-9 inline-flex w-fit items-center gap-3 text-[12px] font-bold uppercase tracking-[.13em]">Read the founder story <ArrowRight size={15} /></a></div>
        </div>
      </section>

      <section id="contact" className="bg-[var(--rust)] px-5 py-20 text-[var(--cream)] md:px-10 md:py-28">
        <div className="mx-auto max-w-[1100px] text-center"><p className="mb-6 text-[10px] font-bold uppercase tracking-[.2em] text-[#f7d0bc]">The next conversation</p><h2 className="fi-serif text-[clamp(3.5rem,8vw,8rem)] leading-[.82]">Make the next<br /><em>conversation count.</em></h2><p className="mx-auto mt-8 max-w-[500px] text-[16px] leading-[1.7] text-[rgba(251,248,241,.82)]">Start with the next move that fits your work. We will keep the path clear from there.</p><a href="#top" className="mt-9 inline-flex items-center gap-3 bg-[var(--field)] px-6 py-4 text-[12px] font-bold uppercase tracking-[.13em] transition-transform hover:-translate-y-1">Book a strategy call <ArrowRight size={16} /></a></div>
      </section>

      <footer className="bg-[var(--ink)] px-5 py-8 text-[var(--cream)] md:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 text-[11px] uppercase tracking-[.14em] md:flex-row md:items-center"><div className="flex items-center gap-3"><img src={logo} alt="" className="h-7 w-auto brightness-0 invert" /><span className="opacity-60">Spartan Coaching</span></div><span className="opacity-60">Prepare · Practice · Execute · Review</span></div>
      </footer>

      {filmOpen && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,20,19,.86)] p-5" onClick={() => setFilmOpen(false)}>
        <div className="relative w-full max-w-4xl overflow-hidden bg-[var(--ink)]" onClick={e => e.stopPropagation()}>
          <button aria-label="Close field film" className="absolute right-4 top-4 z-10 text-white" onClick={() => setFilmOpen(false)}><X /></button>
          <img src={heroPoster} alt="Spartan Coaching field film" className="block w-full opacity-90" />
          <div className="absolute inset-0 flex items-center justify-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--rust)] text-white"><Play fill="currentColor" /></div></div>
          <p className="px-6 py-5 text-sm text-[var(--cream)]">The Spartan field operating system: prepare, practice, execute, and review.</p>
        </div>
      </div>}
    </main>
  );
}