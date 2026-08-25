import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { ArrowRight, Shield, Heart, Target, Eye } from "lucide-react";
import { FadeIn, SlideUpFade, StaggerContainer, StaggerItem } from "@/components/animations";

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative bg-background overflow-hidden min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-spartan-gradient-radial opacity-15 pointer-events-none" />
      <div className="authority-separator absolute top-0 left-0 w-full" />
      <div className="authority-separator absolute bottom-0 left-0 w-full" />
      <SlideUpFade>
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 text-center py-20">
          <p
            className="font-display font-black text-white leading-[1.0] tracking-tight"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 5rem)" }}
          >
            {children}
          </p>
        </div>
      </SlideUpFade>
    </section>
  );
}

interface PillarProps {
  number: string;
  label: string;
  title: string;
  Icon: React.ElementType;
  dark?: boolean;
  children: React.ReactNode;
}

function Pillar({ number, label, title, Icon, dark = false, children }: PillarProps) {
  return (
    <section className={dark ? "relative bg-background py-20 sm:py-28 overflow-hidden" : "relative py-20 sm:py-28 overflow-hidden"}>
      <div className="absolute inset-0 select-none pointer-events-none overflow-hidden" aria-hidden>
        <span
          className="absolute -right-8 top-1/2 -translate-y-1/2 font-display font-black leading-none text-white/[0.025]"
          style={{ fontSize: "clamp(12rem, 30vw, 22rem)" }}
        >
          {number}
        </span>
      </div>
      <div className="relative max-w-4xl mx-auto px-6 sm:px-8">
        <SlideUpFade>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 shrink-0 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.3em] mb-0.5">{label}</p>
              <h2
                className="font-display font-black text-foreground leading-tight"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
              >
                {title}
              </h2>
            </div>
          </div>
          {children}
        </SlideUpFade>
      </div>
    </section>
  );
}

export default function Manifesto() {
  return (
    <div className="w-full">
      <SEO />

      {/* Hero — full viewport, stamp watermark, massive headline */}
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <img
          src="/spartan-logo-stamp.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain opacity-[0.04] select-none pointer-events-none scale-110"
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 text-center">
          <SlideUpFade delay={0.1}>
            <p className="text-white/40 text-xs sm:text-sm font-semibold tracking-[0.5em] uppercase mb-8">
              The Spartan Ethos
            </p>
          </SlideUpFade>
          <SlideUpFade delay={0.25}>
            <h1
              className="font-display font-black text-white leading-[0.9] mb-8"
              style={{ fontSize: "clamp(3.5rem, 9vw, 9rem)" }}
            >
              What It Means<br />
              to Be{" "}
              <span className="text-[#e8291e]">Spartan</span>
            </h1>
          </SlideUpFade>
          <SlideUpFade delay={0.4}>
            <p className="text-white/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-12">
              Not a warrior metaphor. Not a brand slogan. A set of commitments that define how we prepare, how we show up, and why the work matters.
            </p>
          </SlideUpFade>
          <SlideUpFade delay={0.55}>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-px bg-white/20" />
              <p className="text-white/30 text-xs tracking-widest uppercase">Scroll to read</p>
              <div className="w-8 h-px bg-white/20" />
            </div>
          </SlideUpFade>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-8 pb-4">
        <BackButton />
      </div>

      {/* Why Spartan */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 select-none pointer-events-none overflow-hidden" aria-hidden>
          <span
            className="absolute -right-8 top-1/2 -translate-y-1/2 font-display font-black leading-none text-white/[0.025]"
            style={{ fontSize: "clamp(12rem, 30vw, 22rem)" }}
          >
            WHY
          </span>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 sm:px-8">
          <SlideUpFade>
            <div className="border-l-4 border-primary pl-6 mb-10">
              <h2 className="font-display font-black text-foreground leading-tight mb-1" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
                Why Spartan
              </h2>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] font-semibold">The origin of the name</p>
            </div>
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
              <p>The name Spartan does not exist to sound tough. It exists to make a claim about preparation.</p>
              <p>Spartan warriors were not the largest armies. They were not the most numerous. They were the most prepared. Every day was structured around getting better at what mattered. They showed up to the hardest moments not hoping for the best, but knowing they had already done the work.</p>
              <p>That is the connection to hospice sales. Not aggression. Not conquest. Preparation.</p>
              <p className="text-foreground font-semibold text-body-lg">
                Because the people you visit every day are managing some of the most difficult moments of their professional and personal lives. A physician deciding whether to have the hospice conversation with a patient. A discharge planner navigating a family in crisis. A facility administrator trying to do right by residents who are running out of time.
              </p>
              <p>These people deserve someone who walked in prepared. Someone who knows what they need before they ask. Someone who has practiced what to say when the conversation gets hard.</p>
              <p>That is what Spartan means. You do not wing it when the stakes are this high.</p>
            </div>
          </SlideUpFade>
        </div>
      </section>

      <PullQuote>
        "You do not wing it when the{" "}
        <span className="text-[#e8291e]">stakes are this high.</span>"
      </PullQuote>

      {/* Pillar 1: Discipline */}
      <Pillar number="01" label="First Pillar" title="What Discipline Actually Means" Icon={Target}>
        <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed mb-8">
          <p>Discipline is not a personality type. Some people are wired for structure and some are not. That is fine. Discipline, in the Spartan context, is not about who you are. It is about what you build.</p>
          <p>Discipline is the territory plan you actually follow on Monday instead of reacting to whatever comes in first. It is the follow up you complete on Thursday afternoon even when the week has been long and two of your best accounts have gone quiet. It is the scorecard you fill out honestly even when the numbers make you uncomfortable.</p>
          <p>Most hospice reps are not failing because they do not care. They are failing because they do not have a system.</p>
          <p className="text-foreground font-semibold">
            Discipline is the system that holds when caring is not enough. It is simple enough to run when the week is hard, and specific enough to produce results when the week is not.
          </p>
        </div>
        <div className="border border-border bg-card bg-muted/40 rounded-sm p-6">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-5">What discipline looks like on Tuesday at 2pm</h3>
          <ul className="space-y-3">
            {[
              "You know exactly which three accounts you are visiting and why those three",
              "You have a written objective for each visit, not a general hope to check in",
              "You have reviewed your notes from the last visit and you know what the contact said they needed",
              "You have a specific next step ready to close on before you leave",
              "At the end of the day you log what happened so you can coach from it next week",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="font-display text-sm font-black text-primary flex-shrink-0 w-5 mt-0.5 leading-none">{i + 1}</span>
                <span className="text-body text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Pillar>

      {/* Pillar 2: Empathy */}
      <Pillar number="02" label="Second Pillar" title="What Empathy Actually Means" Icon={Heart} dark>
        <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed mb-8">
          <p>Empathy is not feeling sad about the patients. Empathy, used the way Spartan means it, is clinical fluency combined with genuine human attention.</p>
          <p>It means understanding what a discharge planner is managing the moment you walk in. She has eleven patients to place, two families who are not ready to hear the word hospice, a staffing crisis on the floor, and a documentation audit due by Friday. When you call her at 2pm, she is not waiting for your update on your agency.</p>
          <p className="text-foreground font-semibold">
            Empathy is also understanding that "not yet" from a physician does not mean no. It means they do not yet see the clinical picture the same way you do. Empathy is the skill that lets you hear what is underneath the word "no."
          </p>
          <p>Sympathy says "I understand this is hard." Empathy says "Tell me what makes it hard and let's figure out what would make it easier." The first ends the conversation. The second opens it.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Sympathy", description: "Feeling moved by someone's difficulty from a distance", note: "Closes conversations", muted: true },
            { label: "Spartan Empathy", description: "Clinical fluency plus the skill of asking what is actually in the way", note: "Opens conversations", muted: false },
          ].map((item, i) => (
            <div key={i} className={`border rounded-sm p-5 ${i === 1 ? "border-primary/30 bg-primary/5" : "border-border bg-card bg-muted/40"}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${i === 1 ? "text-primary" : "text-muted-foreground"}`}>{item.label}</p>
              <p className="text-body text-foreground leading-relaxed mb-2">{item.description}</p>
              <p className="text-xs text-muted-foreground italic">{item.note}</p>
            </div>
          ))}
        </div>
      </Pillar>

      {/* Pillar 3: Strategy */}
      <Pillar number="03" label="Third Pillar" title="What Strategy Actually Means" Icon={Target}>
        <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
          <p>Strategy is not a plan you make once in January and revisit at the end of the year. Strategy is the ongoing discipline of deciding where to put your attention this week, and being able to explain why.</p>
          <p>Most reps know their territory in general. They have a sense of which accounts are warm and which feel cold. But knowing in general is not strategy. Strategy is knowing specifically — the cardiology practice that sees two hundred heart failure patients a year and has referred exactly four people to hospice in twelve months.</p>
          <p className="text-foreground font-semibold">
            Strategy is also knowing where not to spend your time. Every hour you spend visiting an account that has no capacity or clinical alignment is an hour you did not spend building the account that does. Strategy means those trade-offs are intentional, not accidental.
          </p>
          <p>In 2026, there is no excuse for not knowing the data. Claims data, discharge patterns, census by diagnosis, referral lag time by facility. The information exists. Spartan teaches you how to use it.</p>
        </div>
      </Pillar>

      <PullQuote>
        "Every hour on the wrong account is an hour you did not spend building{" "}
        <span className="text-[#e8291e]">the right one.</span>"
      </PullQuote>

      {/* The Stakes */}
      <section className="relative bg-background py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <SlideUpFade>
            <div className="border-l-4 border-primary pl-6 mb-10">
              <h2 className="font-display font-black text-foreground leading-tight mb-1" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
                The Stakes
              </h2>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] font-semibold">Why this work matters beyond a sales quota</p>
            </div>
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed mb-12">
              <p>There is a gap in hospice. It is not small.</p>
              <p>Hundreds of thousands of Americans die each year without hospice care who would have qualified for it and whose families needed it. The average hospice length of stay in the United States is around eighteen days. The Medicare benefit allows up to six months. The math on that gap is not a clinical problem. It is a sales problem.</p>
              <p className="text-foreground font-semibold text-body-lg">
                It is a problem of conversations that did not happen, referrals that did not get made, eligibility that got missed because nobody was in that office at the right time with the right relationship to say the right thing.
              </p>
              <p>When a rep closes that gap for one patient, here is what actually changes. That patient stops managing their own pain. An expert team takes over. The family stops making decisions in the dark and starts receiving guidance. The daughter who was driving three hours every weekend now has a care team who calls her first.</p>
              <p>That is what a good sales visit produces. Not a commission. Not a referral number. A human being who dies with less pain, surrounded by people who know how to help.</p>
            </div>
          </SlideUpFade>

          <FadeIn>
            <StaggerContainer className="grid sm:grid-cols-3 gap-4">
              {[
                { Icon: Shield, heading: "For the patient", body: "Expert pain and symptom management replaces a family trying to figure it out alone. Comfort where there was uncertainty." },
                { Icon: Heart, heading: "For the family", body: "Someone calls them first. The weight of being the primary caregiver lifts. They get to be a family member again." },
                { Icon: Eye, heading: "For the clinical partner", body: "A patient is transitioned to the right level of care at the right time. The relationship with hospice grows stronger." },
              ].map(({ Icon, heading, body }, i) => (
                <StaggerItem key={i}>
                  <div className="border border-border bg-card bg-muted/40 rounded-sm p-6 h-full">
                    <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/25 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display font-black text-foreground text-lg mb-2">{heading}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </FadeIn>
        </div>
      </section>

      {/* What a Spartan Rep Looks Like */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 select-none pointer-events-none overflow-hidden" aria-hidden>
          <span
            className="absolute -right-8 top-1/2 -translate-y-1/2 font-display font-black leading-none text-white/[0.02]"
            style={{ fontSize: "clamp(12rem, 30vw, 22rem)" }}
          >
            YOU
          </span>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 sm:px-8">
          <SlideUpFade>
            <div className="border-l-4 border-primary pl-6 mb-10">
              <h2 className="font-display font-black text-foreground leading-tight mb-1" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
                What a Spartan Rep Looks Like
              </h2>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] font-semibold">Observable behaviors, not aspirational adjectives</p>
            </div>
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed mb-10">
              <p>A Spartan rep is not the most talkative person in the room. They are not necessarily the most charismatic. They are the most prepared.</p>
              <p>You can identify a Spartan rep by what they do before the visit, not during it. They arrive knowing the account. They know who they are seeing, what that person said they needed last time, and what they are going to ask for as a next step. They do not walk in and see how it goes.</p>
              <p className="text-foreground font-semibold">
                A Spartan rep does not need to be the most experienced rep in the building. They need to be the most intentional. The rep who practices the objection response before the visit instead of hoping it goes well.
              </p>
            </div>
          </SlideUpFade>

          <FadeIn delay={0.15}>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Before the visit", items: ["Account reviewed, not just remembered", "Objective written, not assumed", "Previous notes read and relevant detail ready", "Next step identified before walking in"] },
                { label: "After the visit", items: ["What happened documented within the day", "Commitments made noted and tracked", "Follow up on the calendar with specific content", "One thing learned recorded for coaching"] },
                { label: "With clinical partners", items: ["First question is about them, not about referrals", "Their workflow understood and respected", "Commitments kept without prompting", "Educational value delivered consistently"] },
                { label: "With their own performance", items: ["Scorecard filled out honestly, even the bad weeks", "Patterns reviewed not just numbers reported", "Practice done before conversations, not after failures", "Coaching received as information, not judgment"] },
              ].map((group, i) => (
                <div key={i} className="border border-border bg-card bg-muted/40 rounded-sm p-5">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">{group.label}</h3>
                  <ul className="space-y-2">
                    {group.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Eye className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Ethics */}
      <section className="relative bg-background py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <SlideUpFade>
            <div className="border-l-4 border-primary pl-6 mb-10">
              <h2 className="font-display font-black text-foreground leading-tight mb-1" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
                Ethics Is Not a Constraint
              </h2>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] font-semibold">It is the foundation</p>
            </div>
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
              <p>Spartan does not treat compliance and ethics as a list of things you are not allowed to do. Ethics is the reason the work is worth doing at all.</p>
              <p>When you earn a referral through honest relationship building, through clinical education, through genuine understanding of what the patient needs, that referral is solid. The clinical partner made a sound decision. The relationship strengthens because you delivered what you promised.</p>
              <p className="text-foreground font-semibold">
                When you earn a referral through pressure, through incentive, through manipulation of information, you have built nothing. You have extracted something from a system that was trying to serve a patient, and left it a little more skeptical of the next hospice rep who walks in.
              </p>
              <p>Spartan trains for sustainable growth. The kind that compounds because every interaction builds trust, every referral is appropriately placed, and every clinical partner becomes a stronger advocate because you have never let them down.</p>
            </div>
          </SlideUpFade>
        </div>
      </section>

      <PullQuote>
        "Ethics is not a constraint. It is the{" "}
        <span className="text-[#e8291e]">reason the work is worth doing at all.</span>"
      </PullQuote>

      {/* Closing Statement */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <SlideUpFade>
            <div className="border-l-4 border-primary pl-6 mb-10">
              <h2 className="font-display font-black text-foreground leading-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
                A Closing Statement
              </h2>
            </div>
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
              <p>Spartan Coaching is not for everyone. It is for the rep who is tired of winging it and wants a system they can actually run. It is for the leader who wants to coach behavior, not just manage results. It is for the organization that understands the connection between execution quality and patient access.</p>
              <p>If you want motivation, a conference, a speaker who fires you up for a week and then fades, there are plenty of those options. We are not one of them.</p>
              <p className="text-foreground font-semibold">
                We are for the professionals who understand that the work is hard, the stakes are real, and the gap between eligible patients and enrolled patients does not close itself. It closes one prepared visit at a time, one honest follow up at a time, one trust-based referral relationship at a time.
              </p>
              <p>That is the Spartan way. Not flash. Not hype. Just the work, done right, for the people who need it most.</p>
            </div>
          </SlideUpFade>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-background py-28 sm:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <img src="/spartan-logo-stamp.png" alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain opacity-[0.03] select-none pointer-events-none" />
        <FadeIn>
          <div className="relative max-w-3xl mx-auto px-6 sm:px-8 text-center">
            <p className="text-white/40 text-xs font-semibold tracking-[0.4em] uppercase mb-6">Ready to close the gap?</p>
            <h2
              className="font-display font-black text-white leading-tight mb-6"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
            >
              If this resonates,<br />
              <span className="text-[#e8291e]">reach out.</span>
            </h2>
            <p className="text-white/55 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
              No obligation, no pressure. Just an honest conversation about where your team is and what it would take to close the gap.
            </p>
            <Button
              size="lg"
              asChild
              className="font-bold px-10 text-base group"
              data-testid="button-manifesto-contact"
            >
              <Link href="/contact">
                <span>Contact Spartan Coaching</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
