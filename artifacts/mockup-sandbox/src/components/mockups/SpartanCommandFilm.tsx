import { useState } from "react";
import { ArrowDownRight, ArrowRight, Check, Menu, X } from "lucide-react";
import commandCenter from "../../assets/spartan/command-center.png";
import heroPoster from "../../assets/spartan/hero-poster.jpg";
import logo from "../../assets/spartan/logo.png";
import nickPhoto from "../../assets/spartan/nick-photo.jpg";
import workflow from "../../assets/spartan/workflow.png";

const assets: Record<string, string> = {
  "command-center.png": commandCenter,
  "hero-poster.jpg": heroPoster,
  "logo.png": logo,
  "nick-photo.jpg": nickPhoto,
  "workflow.png": workflow,
};
const asset = (name: string) => assets[name];

export default function SpartanCommandFilm() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    ["01", "Prepare", "Know the account before you step out of the car."],
    ["02", "Practice", "Pressure-test the language before it matters."],
    ["03", "Execute", "Lead the conversation with a clear purpose."],
    ["04", "Capture", "Leave the next move visible, not in your head."],
  ];

  return (
    <main className="scf">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');
        .scf{--ink:#17211f;--paper:#e9e6dd;--bone:#f5f1e8;--orange:#e85d2a;--muted:#777a73;--line:rgba(23,33,31,.18);font-family:Manrope,system-ui,sans-serif;color:var(--ink);background:var(--paper);overflow:hidden}
        .scf *{box-sizing:border-box}.scf a{color:inherit;text-decoration:none}.scf button{font:inherit}
        .scf .mono{font:DM Mono,monospace;font-size:10px;letter-spacing:.13em;text-transform:uppercase}
        .scf .nav{height:76px;padding:0 clamp(20px,4vw,64px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(233,230,221,.2);position:absolute;z-index:5;inset:0 0 auto;color:var(--bone)}
        .scf .mark{display:flex;gap:10px;align-items:center;font-weight:800;letter-spacing:-.04em;font-size:17px}.scf .mark img{width:25px;height:25px;object-fit:contain;filter:brightness(0) invert(1)}
        .scf .navlinks{display:flex;gap:32px;align-items:center}.scf .navlinks a{font-size:12px;color:#d9d7cd}.scf .navlinks a:hover{color:#fff}
        .scf .navcta{border:1px solid rgba(245,241,232,.55);padding:11px 17px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.scf .navcta:hover{background:var(--bone);color:var(--ink)}
        .scf .menub{display:none;background:none;border:0;color:var(--bone);padding:4px}
        .scf .hero{min-height:760px;background:#17211f;position:relative;color:var(--bone);display:grid;align-items:end}
        .scf .heroimage{position:absolute;inset:0;background-image:linear-gradient(90deg,rgba(23,33,31,.96) 0%,rgba(23,33,31,.73) 44%,rgba(23,33,31,.08) 100%),linear-gradient(0deg,rgba(23,33,31,.82),transparent 52%),url('${asset("hero-poster.jpg")}');background-size:cover;background-position:center}
        .scf .heroimage:after{content:"";position:absolute;inset:0;opacity:.11;background-image:repeating-linear-gradient(0deg,transparent,transparent 3px,#fff 4px);mix-blend-mode:overlay}
        .scf .herocontent{position:relative;z-index:1;padding:150px clamp(20px,8vw,128px) 86px;max-width:1040px}.scf .eyebrow{display:flex;align-items:center;gap:12px;color:#f49a72;margin-bottom:23px}.scf .eyebrow i{width:28px;height:2px;background:var(--orange);display:block}
        .scf h1{font-size:clamp(48px,7.7vw,116px);line-height:.91;letter-spacing:-.085em;max-width:900px;margin:0 0 30px;font-weight:700}.scf h1 em{font-style:normal;color:#f07843}
        .scf .herofoot{display:flex;align-items:end;justify-content:space-between;gap:35px;max-width:880px}.scf .herolede{max-width:420px;font-size:16px;line-height:1.6;color:#d8d7ce;margin:0}.scf .heroactions{display:flex;gap:12px;flex-wrap:wrap}.scf .btn{display:inline-flex;align-items:center;gap:11px;padding:15px 20px;border:1px solid var(--orange);background:var(--orange);color:#fff;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;transition:transform .2s,background .2s}.scf .btn:hover{transform:translateY(-3px);background:#f27746}.scf .btn.alt{border-color:rgba(245,241,232,.48);background:transparent;color:var(--bone)}.scf .btn.alt:hover{background:var(--bone);color:var(--ink)}
        .scf .ticker{background:var(--orange);color:#211c18;padding:13px clamp(20px,5vw,76px);display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.scf .ticker span{font:500 10px DM Mono,monospace;text-transform:uppercase;letter-spacing:.1em}
        .scf .manifesto{display:grid;grid-template-columns:1.05fr .95fr;gap:8vw;padding:120px clamp(20px,8vw,128px);background:var(--bone);border-bottom:1px solid var(--line)}.scf h2{font-size:clamp(34px,5vw,70px);line-height:1;letter-spacing:-.075em;margin:0;font-weight:700}.scf h2 span{color:var(--orange)}.scf .manifesto p{font-size:18px;line-height:1.65;margin:5px 0 25px;max-width:485px;color:#4d5650}.scf .rule{border-top:1px solid var(--line);padding-top:16px;display:flex;justify-content:space-between;gap:20px}.scf .rule strong{font-size:14px}.scf .rule small{color:var(--muted);max-width:270px;line-height:1.5}
        .scf .product{background:#222d2a;color:var(--bone);padding:112px clamp(20px,7vw,110px);position:relative}.scf .product:before{content:"HOSPICE SALES PRO";font:500 clamp(80px,16vw,240px) DM Mono,monospace;position:absolute;left:-10px;top:28px;color:rgba(245,241,232,.035);white-space:nowrap}.scf .producthead{position:relative;display:flex;justify-content:space-between;gap:40px;align-items:end;margin-bottom:54px}.scf .producthead h2{max-width:570px}.scf .producthead p{max-width:310px;color:#bdc2b9;line-height:1.55;font-size:14px;margin:0}.scf .screen{position:relative;border:1px solid rgba(245,241,232,.3);background:#111917;padding:10px;display:grid;grid-template-columns:1.4fr .6fr;gap:10px}.scf .screen img{width:100%;display:block;height:100%;object-fit:cover;object-position:top}.scf .screenmain{min-height:390px}.scf .screenaside{display:flex;flex-direction:column;gap:10px}.scf .screenaside img{min-height:188px}.scf .screenlabel{position:absolute;left:26px;top:26px;background:var(--orange);padding:8px 10px;color:#fff}.scf .caption{display:flex;justify-content:space-between;padding-top:17px;color:#9ca69b}.scf .caption p{margin:0;font-size:12px}.scf .caption strong{color:var(--bone)}
        .scf .sequence{background:var(--paper);padding:120px clamp(20px,8vw,128px)}.scf .sequencehead{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid var(--line);padding-bottom:28px;margin-bottom:0;gap:25px}.scf .sequencehead p{font-size:13px;color:var(--muted);max-width:280px;line-height:1.5;margin:0}.scf .steps{display:grid;grid-template-columns:repeat(4,1fr)}.scf .step{padding:30px 20px 26px 0;border-right:1px solid var(--line);min-height:220px;cursor:pointer;transition:background .2s,padding .2s}.scf .step:not(:first-child){padding-left:20px}.scf .step:last-child{border-right:0}.scf .step:hover,.scf .step.active{background:rgba(232,93,42,.08);padding-top:25px}.scf .stepnum{color:var(--orange);margin-bottom:52px}.scf .step h3{font-size:24px;letter-spacing:-.05em;margin:0 0 9px}.scf .step p{color:var(--muted);font-size:13px;line-height:1.5;margin:0;max-width:200px}
        .scf .intervention{display:grid;grid-template-columns:.8fr 1.2fr;background:var(--orange);color:#241d19}.scf .interventionphoto{min-height:520px;background:url('${asset("nick-photo.jpg")}') center 25%/cover no-repeat;filter:grayscale(1) contrast(1.1);mix-blend-mode:multiply;opacity:.82}.scf .interventioncopy{padding:100px clamp(24px,7vw,100px);display:flex;flex-direction:column;justify-content:center}.scf .interventioncopy h2{max-width:570px}.scf .interventioncopy h2 span{color:var(--bone)}.scf .interventioncopy p{font-size:17px;line-height:1.65;max-width:500px;margin:28px 0 32px;color:#4c2b20}.scf .interventioncopy .btn{border-color:#241d19;background:#241d19;color:var(--bone);width:max-content}.scf .interventioncopy .btn:hover{background:#352821}
        .scf .close{padding:120px clamp(20px,8vw,128px) 70px;background:var(--bone)}.scf .close h2{max-width:800px}.scf .closebottom{display:flex;justify-content:space-between;align-items:end;margin-top:80px;padding-top:18px;border-top:1px solid var(--line);color:var(--muted)}.scf .closebottom a{color:var(--ink);font-weight:700;font-size:13px}.scf .foot{background:var(--ink);color:var(--bone);padding:28px clamp(20px,4vw,64px);display:flex;justify-content:space-between;font-size:11px}.scf .foot span{color:#9da69d}
        @media(max-width:760px){.scf .nav{height:64px}.scf .navlinks{display:none}.scf .menub{display:block}.scf .nav.open{background:var(--ink)}.scf .nav.open .navlinks{display:flex;position:absolute;top:64px;left:0;right:0;background:var(--ink);padding:18px 20px 24px;flex-direction:column;align-items:flex-start;gap:20px;border-top:1px solid rgba(245,241,232,.15)}.scf .hero{min-height:700px}.scf .heroimage{background-position:63% center;background-image:linear-gradient(0deg,rgba(23,33,31,.97) 0%,rgba(23,33,31,.55) 58%,rgba(23,33,31,.22)),url('${asset("hero-poster.jpg")}')}.scf .herocontent{padding:130px 20px 54px}.scf h1{font-size:clamp(46px,14vw,78px)}.scf .herofoot{display:block}.scf .herolede{margin-bottom:25px}.scf .manifesto,.scf .intervention{grid-template-columns:1fr}.scf .manifesto{padding:80px 20px;gap:38px}.scf .product,.scf .sequence,.scf .close{padding:80px 20px}.scf .producthead,.scf .sequencehead{display:block}.scf .producthead p,.scf .sequencehead p{margin-top:22px}.scf .screen{grid-template-columns:1fr}.scf .screenaside{display:grid;grid-template-columns:1fr 1fr}.scf .screenmain{min-height:230px}.scf .screenaside img{min-height:125px}.scf .steps{grid-template-columns:1fr 1fr}.scf .step{min-height:190px;border-bottom:1px solid var(--line)}.scf .step:nth-child(2){border-right:0}.scf .step:not(:first-child){padding-left:15px}.scf .stepnum{margin-bottom:28px}.scf .interventionphoto{min-height:360px}.scf .interventioncopy{padding:75px 20px}.scf .closebottom,.scf .foot{display:block}.scf .closebottom a{display:block;margin-top:25px}.scf .foot span{display:block;margin-top:12px}}
      `}</style>

      <nav className={`nav ${menuOpen ? "open" : ""}`}>
        <a className="mark" href="#top" aria-label="Spartan Coaching home"><img src={asset("logo.png")} alt="" />Spartan Coaching</a>
        <div className="navlinks">
          <a href="#system">The system</a><a href="#consulting">Consulting</a><a href="#workflow">Field workflow</a>
          <a className="navcta" href="#start">Start a conversation</a>
        </div>
        <button className="menub" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </nav>

      <section className="hero" id="top">
        <div className="heroimage" />
        <div className="herocontent">
          <div className="eyebrow mono"><i /> Hospice growth / field execution</div>
          <h1>The next move<br />starts <em>before</em><br />the visit.</h1>
          <div className="herofoot">
            <p className="herolede">Spartan combines direct expert consulting with Hospice Sales Pro—the web and iPhone workspace for better hospice conversations.</p>
            <div className="heroactions"><a className="btn" href="#consulting">Work with Spartan <ArrowRight size={15} /></a><a className="btn alt" href="#system">See the workspace <ArrowDownRight size={15} /></a></div>
          </div>
        </div>
      </section>
      <div className="ticker"><span>Prepare the account</span><span>Practice the language</span><span>Execute the conversation</span><span>Capture the next move</span></div>

      <section className="manifesto" id="consulting">
        <div><div className="mono" style={{ color: "var(--orange)", marginBottom: 24 }}>The intervention</div><h2>Activity is not the standard.<br /><span>Clarity is.</span></h2></div>
        <div><p>When field performance drifts, more motivation is not the answer. Spartan Consulting helps leaders and liaisons see what the work requires, build the language to do it, and install a rhythm that can hold up in the field.</p><div className="rule"><strong>Spartan Consulting</strong><small>Direct strategy, coaching, workshops, and territory systems for hospice growth leaders and teams.</small></div></div>
      </section>

      <section className="product" id="system">
        <div className="producthead"><div><div className="mono" style={{ color: "#f07843", marginBottom: 18 }}>The field workspace</div><h2>Hospice Sales Pro keeps the work moving.</h2></div><p>Open the day in Command Center. Use the tool the conversation requires. Capture the outcome while it is still fresh.</p></div>
        <div className="screen"><div className="screenlabel mono">Live workspace</div><div className="screenmain"><img src={asset("command-center.png")} alt="Hospice Sales Pro Command Center" /></div><div className="screenaside"><img src={asset("workflow.png")} alt="Hospice Sales Pro workflow" /><div style={{ background: "#303c38", padding: 18 }}><div className="mono" style={{ color: "#f07843", marginBottom: 12 }}>One system</div><p style={{ margin: 0, color: "#d1d4ca", fontSize: 13, lineHeight: 1.55 }}>Web and iPhone continuity for the work between visits.</p></div></div></div>
        <div className="caption"><p><strong>Command Center</strong> / daily operating view</p><p className="mono">Hospice Sales Pro</p></div>
      </section>

      <section className="sequence" id="workflow">
        <div className="sequencehead"><div><div className="mono" style={{ color: "var(--orange)", marginBottom: 18 }}>Daily operating sequence</div><h2>Make the invisible<br />work visible.</h2></div><p>Tap a stage. The system is built around what liaisons actually do—not generic CRM logging.</p></div>
        <div className="steps">{steps.map(([num, title, copy], i) => <button key={num} className={`step ${activeStep === i ? "active" : ""}`} onClick={() => setActiveStep(i)}><div className="stepnum mono">{num}</div><h3>{title}</h3><p>{copy}</p></button>)}</div>
      </section>

      <section className="intervention">
        <div className="interventionphoto" role="img" aria-label="Nick Lynch, founder of Spartan Coaching" />
        <div className="interventioncopy"><div className="mono">When the system needs a human</div><h2>Software shows the move.<br /><span>Consulting changes the habit.</span></h2><p>Nick Lynch built Spartan Coaching from the field. The work brings together what liaisons see in real conversations and what leaders need to coach performance without guessing.</p><a className="btn" href="#start">Discuss your situation <ArrowRight size={15} /></a></div>
      </section>

      <section className="close" id="start"><div className="mono" style={{ color: "var(--orange)", marginBottom: 20 }}>No generic pitch</div><h2>Bring the real field condition. We will find the next useful move.</h2><div className="closebottom"><span>Consulting for hospice growth leaders, liaisons, and field teams.</span><a href="mailto:hello@spartancoaching.com">Start a conversation <ArrowRight size={14} /></a></div></section>
      <footer className="foot"><strong>Spartan Coaching</strong><span>Hospice growth / field execution / Hospice Sales Pro</span></footer>
    </main>
  );
}