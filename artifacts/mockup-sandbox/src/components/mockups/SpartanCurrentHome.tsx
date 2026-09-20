import { useState } from "react";
import { ArrowRight, Menu, X, Play } from "lucide-react";
import heroPoster from "../../assets/spartan/hero-poster.jpg";
import logo from "../../assets/spartan/logo.png";
import nickPhoto from "../../assets/spartan/nick-photo.jpg";

const css = `
  .sc-home { --paper:#f3eee4; --paper-deep:#e6ddcf; --ink:#111111; --muted:#625e58; --red:#c92531; --line:rgba(17,17,17,.18); min-height:100dvh; background:var(--paper); color:var(--ink); font-family: ui-sans-serif, system-ui, sans-serif; }
  .sc-home * { box-sizing:border-box; }
  .sc-home a { color:inherit; text-decoration:none; }
  .sc-nav { position:relative; z-index:5; display:flex; align-items:center; justify-content:space-between; max-width:1440px; margin:auto; padding:19px clamp(20px,4vw,58px); border-bottom:1px solid var(--line); }
  .sc-brand { display:flex; align-items:center; gap:11px; font-weight:800; letter-spacing:-.04em; font-size:18px; }
  .sc-brand img { width:32px; height:38px; object-fit:contain; }
  .sc-navlinks { display:flex; gap:30px; align-items:center; font-size:12px; letter-spacing:.08em; text-transform:uppercase; font-weight:700; }
  .sc-navlinks a { transition:color .2s ease; } .sc-navlinks a:hover { color:var(--red); }
  .sc-navcta { padding:11px 15px; background:var(--ink); color:var(--paper)!important; }
  .sc-menu { display:none; background:none; border:0; padding:7px; }
  .sc-film { position:relative; background:#0c0c0c; min-height:clamp(320px,54vw,700px); overflow:hidden; }
  .sc-film img { display:block; width:100%; height:100%; min-height:inherit; object-fit:cover; object-position:center; opacity:.9; }
  .sc-film:after { content:""; position:absolute; inset:0; background:linear-gradient(90deg,rgba(0,0,0,.6),transparent 55%),linear-gradient(0deg,rgba(0,0,0,.45),transparent 42%); pointer-events:none; }
  .sc-film-copy { position:absolute; z-index:1; left:clamp(22px,7vw,104px); bottom:clamp(25px,7vw,84px); color:var(--paper); max-width:550px; }
  .sc-kicker { display:flex; align-items:center; gap:10px; color:rgba(243,238,228,.74); font-family:ui-monospace,monospace; font-size:10px; letter-spacing:.15em; text-transform:uppercase; }
  .sc-kicker:before { content:""; width:42px; height:2px; background:var(--red); }
  .sc-film h1 { margin:19px 0 0; font-family:Georgia,serif; font-weight:400; font-size:clamp(42px,7vw,94px); line-height:.92; letter-spacing:-.055em; }
  .sc-film h1 em { color:#ee3a45; font-style:normal; }
  .sc-film-note { position:absolute; z-index:2; right:clamp(20px,4vw,58px); bottom:28px; padding:10px 12px; color:var(--paper); background:rgba(0,0,0,.6); font:10px ui-monospace,monospace; letter-spacing:.09em; text-transform:uppercase; border:1px solid rgba(243,238,228,.35); }
  .sc-section { border-bottom:1px solid var(--line); padding:clamp(64px,9vw,130px) clamp(20px,6vw,90px); }
  .sc-inner { max-width:1280px; margin:auto; }
  .sc-intro { display:grid; grid-template-columns:1.3fr .7fr; gap:clamp(40px,9vw,150px); align-items:end; }
  .sc-eyebrow { color:var(--red); font:700 11px ui-monospace,monospace; letter-spacing:.17em; text-transform:uppercase; margin:0 0 18px; }
  .sc-display { margin:0; font:400 clamp(42px,6vw,82px)/.94 Georgia,serif; letter-spacing:-.055em; }
  .sc-display strong { color:var(--red); font-weight:400; }
  .sc-side { padding-left:22px; border-left:2px solid var(--red); color:var(--muted); font-size:16px; line-height:1.7; }
  .sc-side b { color:var(--ink); }
  .sc-actions { display:flex; flex-wrap:wrap; gap:22px; align-items:center; margin-top:28px; }
  .sc-button { display:inline-flex; align-items:center; gap:10px; padding:14px 18px; background:var(--red); color:#fff!important; font:700 12px ui-monospace,monospace; letter-spacing:.06em; text-transform:uppercase; transition:transform .2s ease,background .2s ease; }
  .sc-button:hover { transform:translateY(-2px); background:#a91925; }
  .sc-textlink { display:inline-flex; align-items:center; gap:8px; font-weight:700; font-size:13px; border-bottom:1px solid var(--ink); padding-bottom:3px; }
  .sc-textlink svg { transition:transform .2s ease; } .sc-textlink:hover svg { transform:translateX(4px); }
  .sc-surface { background:var(--paper-deep); }
  .sc-path-head { max-width:650px; margin-bottom:68px; }
  .sc-path-grid { display:grid; grid-template-columns:1.35fr .85fr; gap:0; }
  .sc-path { padding:0 clamp(0px,4vw,58px) 0 0; }
  .sc-path + .sc-path { padding:58px 0 0 clamp(0px,4vw,58px); border-left:1px solid var(--line); }
  .sc-path h3 { font:700 clamp(27px,3vw,47px)/1.03 ui-sans-serif,system-ui,sans-serif; letter-spacing:-.05em; margin:0 0 18px; }
  .sc-path p { color:var(--muted); line-height:1.75; max-width:600px; margin:0; }
  .sc-list { list-style:none; padding:0; margin:27px 0; display:grid; gap:11px; }
  .sc-list li { display:flex; align-items:center; gap:12px; font-size:14px; }
  .sc-list li:before { content:""; width:7px; height:7px; background:var(--red); display:block; }
  .sc-authority { display:grid; grid-template-columns:1fr 1fr; gap:clamp(40px,9vw,150px); align-items:center; }
  .sc-photo { aspect-ratio:4/3; overflow:hidden; background:#d2c7b8; }
  .sc-photo img { width:100%; height:100%; object-fit:cover; filter:grayscale(1); mix-blend-mode:multiply; opacity:.9; transition:transform .7s ease; }
  .sc-photo:hover img { transform:scale(1.03); }
  .sc-authority-copy { order:-1; }
  .sc-authority-copy p:not(.sc-eyebrow) { color:var(--muted); line-height:1.8; max-width:510px; margin:23px 0 30px; }
  .sc-proof { display:grid; grid-template-columns:.8fr 1.2fr; gap:clamp(40px,9vw,150px); align-items:start; }
  .sc-proof-copy p { color:var(--muted); line-height:1.7; max-width:330px; }
  .sc-standards { border-top:1px solid var(--line); }
  .sc-standard { display:grid; grid-template-columns:58px 1fr; gap:22px; align-items:start; padding:24px 0; border-bottom:1px solid var(--line); }
  .sc-standard span { color:var(--red); font:700 12px ui-monospace,monospace; }
  .sc-standard p { margin:0; font:400 clamp(21px,2.5vw,34px)/1.12 Georgia,serif; letter-spacing:-.025em; }
  .sc-close { text-align:center; padding-block:clamp(76px,12vw,170px); }
  .sc-close .sc-display { max-width:580px; margin:auto; }
  .sc-close p { color:var(--muted); max-width:430px; margin:22px auto 34px; line-height:1.7; }
  .sc-footer { display:flex; justify-content:space-between; align-items:center; gap:25px; max-width:1280px; margin:auto; padding:27px clamp(20px,6vw,90px); color:var(--muted); font-size:12px; }
  @media(max-width:760px){ .sc-navlinks{display:none}.sc-menu{display:block}.sc-navlinks.open{position:absolute;display:flex;flex-direction:column;align-items:flex-start;top:72px;left:0;right:0;padding:20px;background:var(--paper);border-bottom:1px solid var(--line);z-index:10}.sc-intro,.sc-path-grid,.sc-authority,.sc-proof{grid-template-columns:1fr}.sc-side{margin-top:5px}.sc-path{padding:0}.sc-path + .sc-path{padding:44px 0 0;border-left:0;border-top:1px solid var(--line);margin-top:44px}.sc-authority-copy{order:0}.sc-photo{order:1}.sc-footer{flex-direction:column;align-items:flex-start}.sc-film-note{display:none}}
`;

function StubLink({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <a href="#consulting" className={className} onClick={(event) => event.preventDefault()}>{children}</a>;
}

export default function SpartanCurrentHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="sc-home">
      <style>{css}</style>
      <header className="sc-nav">
        <StubLink className="sc-brand"><img src={logo} alt="" />Spartan Coaching</StubLink>
        <nav className={`sc-navlinks ${menuOpen ? "open" : ""}`}>
          <StubLink>Consulting</StubLink><StubLink>Hospice Sales Pro</StubLink><StubLink>About</StubLink>
          <StubLink className="sc-navcta">Book a strategy call</StubLink>
        </nav>
        <button className="sc-menu" aria-label="Toggle menu" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </header>

      <main>
        <section className="sc-film" aria-label="Spartan field operating system">
          <img src={heroPoster} alt="Spartan Coaching field operating system" />
          <div className="sc-film-copy"><div className="sc-kicker">Hospice growth, in the field</div><h1>Make the next hospice conversation <em>count.</em></h1></div>
          <div className="sc-film-note"><Play size={11} fill="currentColor" style={{ verticalAlign: "middle", marginRight: 7 }} /> Field film / Spartan system</div>
        </section>

        <section className="sc-section">
          <div className="sc-inner sc-intro">
            <div><p className="sc-eyebrow">Private performance advisory · Hospice growth</p><h2 className="sc-display">The work is specific.<br />The next move <strong>matters.</strong></h2></div>
            <div className="sc-side"><p><b>Spartan Consulting</b> gives hospice growth leaders direct strategy and coaching. <b>Hospice Sales Pro</b> gives individuals a digital workspace for daily execution, with web and iPhone continuity and a separate team access path.</p><div className="sc-actions"><StubLink className="sc-button">Book a strategy call <ArrowRight size={15} /></StubLink><StubLink className="sc-textlink">Explore Hospice Sales Pro <ArrowRight size={15} /></StubLink></div></div>
          </div>
        </section>

        <section className="sc-section sc-surface" id="consulting">
          <div className="sc-inner"><div className="sc-path-head"><p className="sc-eyebrow">Two ways to engage the work</p><h2 className="sc-display">Choose the responsibility closest to yours.</h2><p style={{color:"var(--muted)", lineHeight:1.7, marginTop:22}}>Start with expert-led consulting for strategy, or the digital field system for daily execution.</p></div>
            <div className="sc-path-grid"><article className="sc-path"><p className="sc-eyebrow">Expert-led service</p><h3>Spartan Consulting</h3><p>Direct strategy and coaching for hospice growth leaders and teams. We diagnose the market reality, install a unified sales process, and build leadership rhythms that sustain performance long after the workshop ends.</p><ul className="sc-list"><li>1:1 and leadership coaching</li><li>Team execution workshops</li><li>Territory system design</li></ul><StubLink className="sc-textlink">Explore consulting services <ArrowRight size={15} /></StubLink></article>
              <article className="sc-path"><p className="sc-eyebrow">Digital workspace</p><h3>Hospice Sales Pro</h3><p>A web and iPhone workspace for individuals and teams, featuring a daily Command Center, practice tools, and role-play modules.</p><div style={{marginTop:27}}><StubLink className="sc-textlink">Explore the platform <ArrowRight size={15} /></StubLink></div></article>
            </div>
          </div>
        </section>

        <section className="sc-section"><div className="sc-inner sc-authority"><div className="sc-authority-copy"><p className="sc-eyebrow">Field-built authority</p><h2 className="sc-display">Built by someone who has actually carried the number.</h2><p>Nick Lynch built Spartan Coaching from the field. Our hospice-specific sales, leadership, and execution systems are shaped by the exact conversations teams must lead every day.</p><StubLink className="sc-textlink">Read the founder story <ArrowRight size={15} /></StubLink></div><div className="sc-photo"><img src={nickPhoto} alt="Nick Lynch, founder of Spartan Coaching" /></div></div></section>

        <section className="sc-section sc-surface"><div className="sc-inner sc-proof"><div className="sc-proof-copy"><p className="sc-eyebrow">Field standards</p><h2 className="sc-display">What disciplined teams work toward.</h2><p style={{marginTop:24}}>A clearer standard for the conversations that move hospice growth forward.</p></div><div className="sc-standards"><div className="sc-standard"><span>01</span><p>Prepare for the account in front of you.</p></div><div className="sc-standard"><span>02</span><p>Practice the language before the moment arrives.</p></div><div className="sc-standard"><span>03</span><p>Execute the conversation and capture the next move.</p></div></div></div></section>
        <section className="sc-section sc-close"><h2 className="sc-display">Stop winging it.</h2><p>Start with the next move that fits your work. We will keep the path clear from there.</p><StubLink className="sc-button">Explore Consulting <ArrowRight size={15} /></StubLink></section>
      </main>
      <footer className="sc-footer"><span>Spartan Coaching</span><span>Practical coaching for hospice growth professionals.</span></footer>
    </div>
  );
}