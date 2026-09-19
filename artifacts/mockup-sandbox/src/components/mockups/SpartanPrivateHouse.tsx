import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import commandCenter from "../../assets/spartan/command-center.png";
import heroPoster from "../../assets/spartan/hero-poster.jpg";
import logo from "../../assets/spartan/logo.png";
import nickPhoto from "../../assets/spartan/nick-photo.jpg";

const assets: Record<string, string> = {
  "command-center.png": commandCenter,
  "hero-poster.jpg": heroPoster,
  "logo.png": logo,
  "nick-photo.jpg": nickPhoto,
};
const asset = (name: string) => assets[name];

const consultingLines = [
  "1:1 and leadership coaching",
  "Team execution workshops",
  "Territory system design",
];

const operatingSequence = [
  ["Diagnose", "Clarify the business condition, market reality, people involved, and decision that needs to change."],
  ["Design", "Choose the smallest useful engagement and define the operating standard, scope, and responsibilities."],
  ["Install", "Coach the work, practice the behavior, and leave leaders with a repeatable rhythm they can sustain."],
];

export default function SpartanPrivateHouse() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState<number | null>(0);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="private-house">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        :root { --ink:#202c32; --paper:#e9e7df; --sand:#d8d4c7; --teal:#0d5654; --coral:#ce6f52; --line:rgba(32,44,50,.22); }
        * { box-sizing:border-box; }
        .private-house { min-height:100vh; background:var(--paper); color:var(--ink); font-family:'DM Sans',sans-serif; overflow:hidden; }
        .private-house a { color:inherit; text-decoration:none; }
        .house-nav { height:82px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; padding:0 clamp(22px,5vw,78px); position:relative; z-index:30; background:rgba(233,231,223,.96); }
        .house-logo { display:flex; align-items:center; gap:13px; font-size:12px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; }
        .house-logo img { width:35px; height:35px; object-fit:contain; }
        .house-links { display:flex; align-items:center; gap:32px; font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; }
        .house-links a:hover { color:var(--coral); }
        .house-cta { border-bottom:1px solid var(--ink); padding:9px 0; }
        .menu-toggle { display:none; border:0; background:none; color:var(--ink); }
        .mobile-menu { position:absolute; left:0; right:0; top:81px; display:flex; flex-direction:column; gap:22px; padding:28px 24px 32px; background:var(--teal); color:var(--paper); border-bottom:1px solid rgba(255,255,255,.22); font-size:13px; text-transform:uppercase; letter-spacing:.1em; }
        .eyebrow { font:500 10px 'DM Mono',monospace; letter-spacing:.16em; text-transform:uppercase; color:var(--coral); }
        .house-hero { display:grid; grid-template-columns:1.03fr .97fr; min-height:700px; border-bottom:1px solid var(--line); }
        .hero-copy { padding:clamp(72px,10vw,142px) clamp(24px,7vw,110px) 70px; display:flex; flex-direction:column; justify-content:space-between; }
        .hero-copy h1 { max-width:650px; margin:27px 0 28px; font:400 clamp(54px,7vw,102px)/.92 'Instrument Serif',serif; letter-spacing:-.045em; }
        .hero-copy h1 em { color:var(--teal); }
        .hero-intro { max-width:480px; font-size:17px; line-height:1.65; color:#4f5d61; }
        .hero-bottom { display:flex; gap:30px; align-items:center; margin-top:58px; }
        .primary-link { display:inline-flex; align-items:center; gap:12px; background:var(--teal); color:var(--paper)!important; padding:16px 20px; font-size:12px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; transition:background .25s, transform .25s; }
        .primary-link:hover { background:var(--coral); transform:translateY(-2px); }
        .text-link { display:inline-flex; align-items:center; gap:8px; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
        .text-link:hover { color:var(--coral); }
        .hero-media { position:relative; min-height:560px; background:var(--teal); overflow:hidden; }
        .hero-media:after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,rgba(13,86,84,.1),rgba(13,86,84,.3)); pointer-events:none; }
        .hero-media img { width:100%; height:100%; object-fit:cover; opacity:.88; filter:saturate(.72) contrast(1.04); }
        .image-note { position:absolute; z-index:2; left:28px; bottom:26px; color:var(--paper); font:10px 'DM Mono',monospace; letter-spacing:.1em; text-transform:uppercase; border-left:1px solid var(--coral); padding-left:13px; }
        .hero-index { position:absolute; z-index:2; top:28px; right:28px; color:var(--paper); font:11px 'DM Mono',monospace; }
        .statement { background:var(--teal); color:var(--paper); padding:clamp(70px,9vw,125px) clamp(24px,9vw,150px); display:grid; grid-template-columns:1fr 1fr; gap:9vw; }
        .statement h2 { margin:0; font:400 clamp(39px,5vw,70px)/.98 'Instrument Serif',serif; letter-spacing:-.035em; }
        .statement h2 em { color:#e99a7b; }
        .statement-copy { border-left:1px solid rgba(233,231,223,.35); padding-left:30px; font-size:16px; line-height:1.8; color:#d2dbd8; align-self:end; }
        .statement-copy strong { color:var(--paper); font-weight:600; }
        .section { padding:clamp(70px,9vw,128px) clamp(24px,7vw,110px); border-bottom:1px solid var(--line); }
        .section-head { display:flex; justify-content:space-between; align-items:flex-end; gap:30px; margin-bottom:65px; }
        .section-head h2 { margin:16px 0 0; font:400 clamp(40px,5vw,72px)/.96 'Instrument Serif',serif; letter-spacing:-.04em; }
        .section-head p { max-width:340px; color:#5c696b; font-size:15px; line-height:1.65; }
        .pathways { display:grid; grid-template-columns:1.3fr .7fr; border-top:1px solid var(--ink); }
        .pathway { padding:35px 34px 43px 0; border-right:1px solid var(--line); }
        .pathway + .pathway { padding:35px 0 43px 38px; border-right:0; }
        .pathway h3 { margin:15px 0 16px; font:400 clamp(32px,4vw,55px)/1 'Instrument Serif',serif; }
        .pathway p { max-width:600px; color:#59676a; font-size:15px; line-height:1.75; }
        .pathway ul { list-style:none; padding:18px 0 0; margin:0; display:grid; gap:12px; font-size:13px; }
        .pathway li { display:flex; gap:10px; align-items:center; }
        .pathway li:before { content:''; width:5px; height:5px; background:var(--coral); display:block; }
        .pathway .text-link { margin-top:33px; }
        .product-section { background:#d7ddd7; display:grid; grid-template-columns:.74fr 1.26fr; gap:8vw; align-items:center; }
        .product-section h2 { margin:17px 0 23px; font:400 clamp(42px,5.2vw,75px)/.94 'Instrument Serif',serif; letter-spacing:-.04em; }
        .product-section p { color:#526365; font-size:16px; line-height:1.75; max-width:450px; }
        .product-points { margin:35px 0 0; padding:0; display:grid; gap:17px; list-style:none; font:12px 'DM Mono',monospace; text-transform:uppercase; letter-spacing:.03em; }
        .product-points li { display:flex; gap:12px; align-items:center; }
        .product-points svg { color:var(--coral); }
        .screen-wrap { background:var(--ink); padding:12px; box-shadow:22px 24px 0 rgba(13,86,84,.18); }
        .screen-wrap img { display:block; width:100%; height:auto; }
        .screen-label { display:flex; justify-content:space-between; color:#c8d2cf; padding:13px 3px 3px; font:10px 'DM Mono',monospace; text-transform:uppercase; letter-spacing:.11em; }
        .method { display:grid; grid-template-columns:.65fr 1.35fr; gap:10vw; }
        .method h2 { margin:17px 0; font:400 clamp(42px,5vw,72px)/.95 'Instrument Serif',serif; letter-spacing:-.04em; }
        .method-intro { color:#5c696b; font-size:15px; line-height:1.7; max-width:360px; }
        .sequence { border-top:1px solid var(--ink); }
        .sequence-row { border-bottom:1px solid var(--line); padding:25px 0; display:grid; grid-template-columns:75px 1fr 30px; align-items:start; cursor:pointer; }
        .sequence-row:hover h3 { color:var(--coral); }
        .sequence-number { color:var(--coral); font:11px 'DM Mono',monospace; }
        .sequence-row h3 { margin:0; font:400 32px 'Instrument Serif',serif; transition:color .2s; }
        .sequence-row p { margin:10px 30px 0 0; color:#657173; font-size:14px; line-height:1.65; max-width:500px; }
        .sequence-row svg { transition:transform .25s; }
        .sequence-row.open svg { transform:rotate(180deg); }
        .founder { background:#c9c6bb; display:grid; grid-template-columns:.8fr 1.2fr; gap:8vw; align-items:center; }
        .founder-photo { position:relative; }
        .founder-photo img { display:block; width:100%; max-height:590px; object-fit:cover; object-position:center 20%; filter:grayscale(1) sepia(.18); }
        .founder-photo:after { content:'NICK LYNCH / FOUNDER'; position:absolute; left:17px; bottom:15px; color:var(--paper); font:10px 'DM Mono',monospace; letter-spacing:.1em; }
        .founder-copy h2 { margin:17px 0 23px; font:400 clamp(40px,5vw,70px)/.96 'Instrument Serif',serif; letter-spacing:-.04em; max-width:650px; }
        .founder-copy p { max-width:570px; color:#526063; font-size:16px; line-height:1.8; }
        .house-footer { background:var(--ink); color:var(--paper); padding:80px clamp(24px,7vw,110px) 35px; }
        .footer-top { display:flex; justify-content:space-between; align-items:flex-end; gap:40px; padding-bottom:75px; }
        .footer-top h2 { margin:16px 0 0; font:400 clamp(43px,6vw,88px)/.9 'Instrument Serif',serif; letter-spacing:-.045em; max-width:700px; }
        .footer-top h2 em { color:#e99a7b; }
        .footer-top .primary-link { background:var(--coral); }
        .footer-top .primary-link:hover { background:var(--paper); color:var(--ink)!important; }
        .footer-bottom { border-top:1px solid rgba(233,231,223,.24); padding-top:20px; display:flex; justify-content:space-between; color:#aeb9b6; font:10px 'DM Mono',monospace; text-transform:uppercase; letter-spacing:.09em; }
        @media(max-width:800px) {
          .house-links { display:none; } .menu-toggle { display:block; }
          .house-hero,.statement,.product-section,.method,.founder { grid-template-columns:1fr; }
          .hero-copy { min-height:650px; } .hero-media { min-height:420px; }
          .statement-copy { border-left:0; border-top:1px solid rgba(233,231,223,.35); padding:25px 0 0; }
          .pathways { grid-template-columns:1fr; } .pathway,.pathway + .pathway { border-right:0; padding:30px 0; } .pathway + .pathway { border-top:1px solid var(--line); }
          .product-section { gap:50px; } .method { gap:50px; } .founder { gap:45px; }
          .footer-top { align-items:flex-start; flex-direction:column; }
        }
        @media(prefers-reduced-motion:reduce) { .primary-link,.sequence-row svg { transition:none; } }
      `}</style>

      <nav className="house-nav">
        <a href="#top" className="house-logo" onClick={closeMenu}>
          <img src={asset("logo.png")} alt="Spartan Coaching" />
          <span>Spartan Coaching</span>
        </a>
        <div className="house-links">
          <a href="#engagement">Consulting</a>
          <a href="#field-system">Hospice Sales Pro</a>
          <a href="#about">About</a>
          <a href="#contact" className="house-cta">Start a conversation</a>
        </div>
        <button className="menu-toggle" type="button" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        {menuOpen && <div className="mobile-menu">
          <a href="#engagement" onClick={closeMenu}>Consulting</a>
          <a href="#field-system" onClick={closeMenu}>Hospice Sales Pro</a>
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#contact" onClick={closeMenu}>Start a conversation</a>
        </div>}
      </nav>

      <section id="top" className="house-hero">
        <div className="hero-copy">
          <div>
            <p className="eyebrow">Private performance advisory / Hospice growth</p>
            <h1>Make the next hospice conversation <em>count.</em></h1>
            <p className="hero-intro">Spartan Coaching gives hospice growth leaders direct strategy and coaching. Hospice Sales Pro gives individuals a digital workspace for daily execution, with web and iPhone continuity.</p>
            <div className="hero-bottom">
              <a className="primary-link" href="#contact">Book a strategy call <ArrowRight size={15} /></a>
              <a className="text-link" href="#field-system">Explore the field system <ArrowDownRight size={15} /></a>
            </div>
          </div>
          <p className="eyebrow" style={{ color: "var(--ink)", opacity: .65 }}>A serious standard for the work between visits.</p>
        </div>
        <div className="hero-media">
          <img src={asset("hero-poster.jpg")} alt="Spartan Coaching field operating system" />
          <span className="hero-index">01 / 06</span>
          <span className="image-note">Prepare / practice / execute / review</span>
        </div>
      </section>

      <section className="statement">
        <h2>Growth work carries a serious <em>responsibility.</em></h2>
        <div className="statement-copy"><p><strong>Spartan Coaching exists to help hospice sales teams replace vague activity with clearer preparation, stronger conversations, and accountable next moves.</strong></p><p>We give liaisons, directors, and multi-market teams a practical way to prepare, practice, execute, and review.</p></div>
      </section>

      <section className="section" id="engagement">
        <div className="section-head">
          <div><p className="eyebrow">The engagement</p><h2>Two ways to work.<br />One operating standard.</h2></div>
          <p>Start with the responsibility closest to yours. Choose expert-led consulting for strategy, or the digital field system for daily execution.</p>
        </div>
        <div className="pathways">
          <article className="pathway">
            <p className="eyebrow">Expert-led service</p>
            <h3>Spartan Consulting</h3>
            <p>Direct strategy and coaching for hospice growth leaders and teams. Diagnose the market reality, install a unified sales process, and build leadership rhythms that sustain performance long after the workshop ends.</p>
            <ul>{consultingLines.map((line) => <li key={line}>{line}</li>)}</ul>
            <a className="text-link" href="#contact">Explore consulting services <ArrowRight size={15} /></a>
          </article>
          <article className="pathway" id="field-system">
            <p className="eyebrow">Digital workspace</p>
            <h3>Hospice Sales Pro</h3>
            <p>A web and iPhone workspace for individuals and teams, featuring a daily Command Center, practice tools, and role-play modules.</p>
            <a className="text-link" href="#product">Review the workspace <ArrowRight size={15} /></a>
          </article>
        </div>
      </section>

      <section className="section product-section" id="product">
        <div>
          <p className="eyebrow">Hospice Sales Pro / Field workspace</p>
          <h2>Walk in ready.<br /><em style={{ color: "var(--teal)" }}>Leave with the next move.</em></h2>
          <p>Stop winging the conversations that decide whether someone understands hospice. Prepare the account, practice the language, and keep the next commitment connected across web and iPhone.</p>
          <ul className="product-points">
            <li><Check size={15} /> Command Center &amp; tools</li>
            <li><Check size={15} /> Plans, calculators, resources</li>
            <li><Check size={15} /> Web &amp; iPhone access</li>
          </ul>
        </div>
        <div className="screen-wrap">
          <img src={asset("command-center.png")} alt="Hospice Sales Pro Command Center workspace" />
          <div className="screen-label"><span>Command Center</span><span>Live workspace</span></div>
        </div>
      </section>

      <section className="section method">
        <div><p className="eyebrow">The operating sequence</p><h2>Make the work <em style={{ color: "var(--coral)" }}>visible.</em></h2><p className="method-intro">How every engagement is structured. The smallest useful sequence for changing the work without adding noise.</p></div>
        <div className="sequence">{operatingSequence.map(([title, copy], i) => <div className={`sequence-row ${open === i ? "open" : ""}`} key={title} onClick={() => setOpen(open === i ? null : i)}><span className="sequence-number">0{i + 1}</span><div><h3>{title}</h3>{open === i && <p>{copy}</p>}</div><ChevronDown size={18} /></div>)}</div>
      </section>

      <section className="section founder" id="about">
        <div className="founder-photo"><img src={asset("nick-photo.jpg")} alt="Nick Lynch, founder of Spartan Coaching" /></div>
        <div className="founder-copy"><p className="eyebrow">Field-built authority</p><h2>Built by someone who has actually carried the number.</h2><p>Nick Lynch built Spartan Coaching from the field. Our hospice-specific sales, leadership, and execution systems are shaped by the exact conversations teams must lead every day.</p><a className="text-link" href="#contact" style={{ marginTop: 30 }}>Read the founder story <ArrowRight size={15} /></a></div>
      </section>

      <footer className="house-footer" id="contact">
        <div className="footer-top"><div><p className="eyebrow" style={{ color: "#e99a7b" }}>A clear next move</p><h2>Stop winging it.<br /><em>Start with the work.</em></h2></div><a href="/contact" className="primary-link">Discuss your situation <ArrowRight size={15} /></a></div>
        <div className="footer-bottom"><span>Spartan Coaching</span><span>Hospice growth / Direct advisory</span><span>© Spartan Coaching</span></div>
      </footer>
    </main>
  );
}