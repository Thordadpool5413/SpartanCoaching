import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { ArrowRight, Shield, Heart, Target, Flame, Eye, ClipboardList, Users } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";

export default function Manifesto() {
  return (
    <div className="w-full">
      <SEO />

      {/* Hero */}
      <section className="relative bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-30" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-red-950/20 via-transparent to-transparent blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 md:py-36 text-center">
          <FadeIn>
            <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-6">The Spartan Ethos</p>
            <h1 className="text-hero font-black text-white mb-8 leading-tight font-display">
              What It Means to Be{" "}
              <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-500 bg-clip-text text-transparent">
                Spartan
              </span>
            </h1>
            <p className="text-body-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              Not a warrior metaphor. Not a brand slogan. A set of commitments that define how we prepare, how we show up, and why the work matters.
            </p>
          </FadeIn>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <BackButton />
      </div>

      {/* Section 1: The Name */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <FadeIn>
          <div className="space-y-8">
            <div className="border-l-4 border-primary pl-6">
              <h2 className="text-h2 text-foreground mb-2">Why Spartan</h2>
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">The origin of the name</p>
            </div>
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
              <p>
                The name Spartan does not exist to sound tough. It exists to make a claim about preparation.
              </p>
              <p>
                Spartan warriors were not the largest armies. They were not the most numerous. They were the most prepared. Every day was structured around getting better at what mattered. They showed up to the hardest moments not hoping for the best, but knowing they had already done the work.
              </p>
              <p>
                That is the connection to hospice sales. Not aggression. Not conquest. Preparation.
              </p>
              <p className="text-foreground font-semibold text-body-lg">
                Because the people you visit every day are managing some of the most difficult moments of their professional and personal lives. A physician deciding whether to have the hospice conversation with a patient. A discharge planner navigating a family in crisis. A facility administrator trying to do right by residents who are running out of time.
              </p>
              <p>
                These people deserve someone who walked in prepared. Someone who knows what they need before they ask. Someone who has practiced what to say when the conversation gets hard.
              </p>
              <p>
                That is what Spartan means. You do not wing it when the stakes are this high.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Pull Quote 1 */}
      <section className="relative bg-[#040404] overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="authority-separator absolute top-0 left-0 w-full" />
        <div className="authority-separator absolute bottom-0 left-0 w-full" />
        <FadeIn>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <p className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
              "You do not wing it when the{" "}
              <span className="text-primary">stakes are this high.</span>"
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Section 2: Discipline */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <FadeIn>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg mt-1">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold mb-1">First Pillar</p>
                <h2 className="text-h2 text-foreground font-display">What Discipline Actually Means</h2>
              </div>
            </div>
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
              <p>
                Discipline is not a personality type. Some people are wired for structure and some are not. That is fine. Discipline, in the Spartan context, is not about who you are. It is about what you build.
              </p>
              <p>
                Discipline is the territory plan you actually follow on Monday instead of reacting to whatever comes in first. It is the follow up you complete on Thursday afternoon even when the week has been long and two of your best accounts have gone quiet. It is the scorecard you fill out honestly even when the numbers make you uncomfortable, because the numbers that make you uncomfortable are exactly the ones that need your attention.
              </p>
              <p>
                Most hospice reps are not failing because they do not care. They are failing because they do not have a system. They have a general sense of which accounts matter and a vague intention to follow up, and those things evaporate when the week gets busy.
              </p>
              <p className="text-foreground font-semibold">
                Discipline is the system that holds when caring is not enough. It is simple enough to run when the week is hard, and specific enough to produce results when the week is not.
              </p>
            </div>

            <Card className="spacing-card bg-muted/40">
              <h3 className="text-h3 font-bold text-foreground mb-4">What discipline looks like on Tuesday at 2pm</h3>
              <ul className="space-y-3">
                {[
                  "You know exactly which three accounts you are visiting and why those three",
                  "You have a written objective for each visit, not a general hope to check in",
                  "You have reviewed your notes from the last visit and you know what the contact said they needed",
                  "You have a specific next step ready to close on before you leave",
                  "At the end of the day you log what happened so you can coach from it next week",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <span className="text-body text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </FadeIn>
      </section>

      {/* Section 3: Empathy */}
      <section className="bg-muted/20 dark:bg-[#060606] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg mt-1">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold mb-1">Second Pillar</p>
                  <h2 className="text-h2 text-foreground font-display">What Empathy Actually Means</h2>
                </div>
              </div>
              <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
                <p>
                  Empathy is not feeling sad about the patients. Empathy, used the way Spartan means it, is clinical fluency combined with genuine human attention.
                </p>
                <p>
                  It means understanding what a discharge planner is managing the moment you walk in. She has eleven patients to place, two families who are not ready to hear the word hospice, a staffing crisis on the floor, and a documentation audit due by Friday. When you call her at 2pm, she is not waiting for your update on your agency. She is in the middle of something hard.
                </p>
                <p>
                  Empathy is knowing that. Empathy is adapting to that. Empathy is showing up in a way that makes her job easier instead of adding to her cognitive load.
                </p>
                <p className="text-foreground font-semibold">
                  Empathy is also understanding that "not yet" from a physician does not mean no. It means they do not yet see the clinical picture the same way you do, or they are carrying something about the patient or family that you have not asked about. Empathy is the skill that lets you hear what is underneath the word "no" and respond to the real concern instead of the stated objection.
                </p>
                <p>
                  Sympathy says "I understand this is hard." Empathy says "Tell me what makes it hard and let's figure out what would make it easier." The first ends the conversation. The second opens it.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    label: "Sympathy",
                    description: "Feeling moved by someone's difficulty from a distance",
                    note: "Closes conversations",
                  },
                  {
                    label: "Spartan Empathy",
                    description: "Clinical fluency plus the skill of asking what is actually in the way",
                    note: "Opens conversations",
                  },
                ].map((item, i) => (
                  <Card key={i} className={`spacing-card ${i === 1 ? "border-primary/30 bg-primary/5" : ""}`}>
                    <p className={`text-sm font-bold uppercase tracking-wide mb-2 ${i === 1 ? "text-primary" : "text-muted-foreground"}`}>{item.label}</p>
                    <p className="text-body text-foreground leading-relaxed mb-3">{item.description}</p>
                    <p className="text-xs text-muted-foreground italic">{item.note}</p>
                  </Card>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Section 4: Strategy */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <FadeIn>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg mt-1">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold mb-1">Third Pillar</p>
                <h2 className="text-h2 text-foreground font-display">What Strategy Actually Means</h2>
              </div>
            </div>
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
              <p>
                Strategy is not a plan you make once in January and revisit at the end of the year. Strategy is the ongoing discipline of deciding where to put your attention this week, and being able to explain why.
              </p>
              <p>
                Most reps know their territory in general. They have a sense of which accounts are warm and which feel cold. They know roughly who refers and who does not. But knowing in general is not strategy. Strategy is knowing specifically. It is knowing that the cardiology practice on the east side sees two hundred heart failure patients a year and has referred exactly four people to hospice in the last twelve months, and being able to articulate exactly what you are going to do about that gap.
              </p>
              <p className="text-foreground font-semibold">
                Strategy is also knowing where not to spend your time. Every hour you spend visiting an account that has no capacity or clinical alignment is an hour you did not spend building the account that does. Strategy means those trade-offs are intentional, not accidental.
              </p>
              <p>
                In 2026, there is no excuse for not knowing the data. Claims data, discharge patterns, census by diagnosis, referral lag time by facility. The information exists. Spartan teaches you how to use it to build a plan that is grounded in market reality instead of optimism.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Pull Quote 2 */}
      <section className="relative bg-[#040404] overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="authority-separator absolute top-0 left-0 w-full" />
        <div className="authority-separator absolute bottom-0 left-0 w-full" />
        <FadeIn>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <p className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
              "Every hour on the wrong account is an hour you did not spend building{" "}
              <span className="text-primary">the right one.</span>"
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Section 5: The Stakes */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <FadeIn>
          <div className="space-y-8">
            <div className="border-l-4 border-primary pl-6">
              <h2 className="text-h2 text-foreground mb-2 font-display">The Stakes</h2>
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Why this work matters beyond a sales quota</p>
            </div>
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
              <p>
                There is a gap in hospice. It is not small.
              </p>
              <p>
                Hundreds of thousands of Americans die each year without hospice care who would have qualified for it and whose families needed it. The average hospice length of stay in the United States is around eighteen days. The Medicare benefit allows up to six months. The math on that gap is not a clinical problem. It is a sales problem.
              </p>
              <p className="text-foreground font-semibold text-body-lg">
                It is a problem of conversations that did not happen, referrals that did not get made, eligibility that got missed because nobody was in that office at the right time with the right relationship to say the right thing.
              </p>
              <p>
                When a rep closes that gap for one patient, here is what actually changes. That patient stops managing their own pain. An expert team takes over. The family stops making decisions in the dark and starts receiving guidance. Someone who was facing their final weeks alone now has a nurse, a social worker, a chaplain, and a home health aide. The daughter who was driving three hours every weekend to check on her father gets a care team who calls her first.
              </p>
              <p>
                That is what a good sales visit produces. Not a commission. Not a referral number. A human being who dies with less pain, surrounded by people who know how to help.
              </p>
              <p>
                The rep who does the work, who runs the system, who follows up, who earns the clinical trust, who shows up prepared, is the reason that happens. They are not in the room. They will never know the patient's name. But the outcome exists because they did the work.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Stakes visual cards */}
      <section className="bg-muted/20 dark:bg-[#060606] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <h2 className="text-h2 text-foreground mb-10 text-center font-display">One Visit. One Referral. What Changes.</h2>
            <StaggerContainer className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  heading: "For the patient",
                  body: "Expert pain and symptom management replaces a family trying to figure it out alone. A nurse who knows exactly what is happening and exactly what to do. Comfort where there was uncertainty.",
                },
                {
                  icon: Heart,
                  heading: "For the family",
                  body: "Someone calls them first. Someone explains what is happening in human language. The weight of being the primary caregiver lifts. They get to be a family member again instead of a medical coordinator.",
                },
                {
                  icon: Users,
                  heading: "For the clinical partner",
                  body: "A patient is transitioned to the right level of care at the right time. The physician does not get a 2am call they cannot manage. The discharge planner closes the case with confidence. The relationship with hospice grows stronger.",
                },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <StaggerItem key={i}>
                    <Card className="spacing-card text-center border-2 h-full">
                      <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-h3 font-bold text-foreground mb-3">{card.heading}</h3>
                      <p className="text-body text-muted-foreground leading-relaxed">{card.body}</p>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </FadeIn>
        </div>
      </section>

      {/* Section 6: What a Spartan Rep Looks Like */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <FadeIn>
          <div className="space-y-8">
            <div className="border-l-4 border-primary pl-6">
              <h2 className="text-h2 text-foreground mb-2 font-display">What a Spartan Rep Looks Like</h2>
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Observable behaviors, not aspirational adjectives</p>
            </div>
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
              <p>
                A Spartan rep is not the most talkative person in the room. They are not necessarily the most charismatic. They are the most prepared.
              </p>
              <p>
                You can identify a Spartan rep by what they do before the visit, not during it. They arrive knowing the account. They know who they are seeing, what that person said they needed last time, and what they are going to ask for as a next step. They do not walk in and see how it goes.
              </p>
              <p>
                They also know what they are measuring. Not in a micromanaged way. They know which behaviors are moving their pipeline and which are just filling their calendar. They can tell you the difference between their A and B accounts without hesitating. They can tell you their conversion rate and what it means.
              </p>
              <p className="text-foreground font-semibold">
                A Spartan rep does not need to be the most experienced rep in the building. They need to be the most intentional. The rep who practices the objection response before the visit instead of hoping it goes well. The rep who debrief after a tough conversation instead of moving on and hoping for better luck next time.
              </p>
              <p>
                They earn trust from clinical partners not because they are likable, although that helps. They earn trust because they show up consistently, they follow through on what they said they would do, and they never make a referral partner feel like a means to an end.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Before the visit", items: ["Account reviewed, not just remembered", "Objective written, not assumed", "Previous notes read and relevant detail ready", "Next step identified before walking in"] },
                { label: "After the visit", items: ["What happened documented within the day", "Commitments made noted and tracked", "Follow up on the calendar with specific content", "One thing learned recorded for coaching"] },
                { label: "With clinical partners", items: ["First question is about them, not about referrals", "Their workflow understood and respected", "Commitments kept without prompting", "Educational value delivered consistently"] },
                { label: "With their own performance", items: ["Scorecard filled out honestly, even the bad weeks", "Patterns reviewed not just numbers reported", "Practice done before conversations, not after failures", "Coaching received as information, not judgment"] },
              ].map((group, i) => (
                <Card key={i} className="spacing-card">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">{group.label}</h3>
                  <ul className="space-y-2">
                    {group.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-body text-muted-foreground">
                        <Eye className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Section 7: Ethics as Identity */}
      <section className="bg-muted/20 dark:bg-[#060606] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="space-y-8">
              <div className="border-l-4 border-primary pl-6">
                <h2 className="text-h2 text-foreground mb-2 font-display">Ethics Is Not a Constraint</h2>
                <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">It is the foundation</p>
              </div>
              <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
                <p>
                  Spartan does not treat compliance and ethics as a list of things you are not allowed to do. Ethics is the reason the work is worth doing at all.
                </p>
                <p>
                  When you earn a referral through honest relationship building, through clinical education, through genuine understanding of what the patient needs, that referral is solid. The family chose appropriately. The clinical partner made a sound decision. The patient receives care that fits their actual condition. The relationship with the referring provider strengthens because you delivered what you promised.
                </p>
                <p className="text-foreground font-semibold">
                  When you earn a referral through pressure, through incentive, through manipulation of information, you have built nothing. You have extracted something from a system that was trying to serve a patient, and you have left that system a little more skeptical of the next hospice rep who walks in the door.
                </p>
                <p>
                  Spartan trains for sustainable growth. Not the kind that peaks and collapses. The kind that compounds because every interaction builds trust, every referral is appropriately placed, and every clinical partner you work with becomes a stronger advocate over time because you have never let them down.
                </p>
                <p>
                  Patient choice is honored at every step. Clinical judgment is supported and never replaced. Privacy is protected by behavior, not just policy. Those are not rules we follow. They are how we operate.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Pull Quote 3 */}
      <section className="relative bg-[#040404] overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="authority-separator absolute top-0 left-0 w-full" />
        <div className="authority-separator absolute bottom-0 left-0 w-full" />
        <FadeIn>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <p className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
              "Ethics is not a constraint. It is the{" "}
              <span className="text-primary">reason the work is worth doing at all.</span>"
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Closing Statement */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <FadeIn>
          <div className="space-y-8">
            <div className="border-l-4 border-primary pl-6">
              <h2 className="text-h2 text-foreground mb-2 font-display">A Closing Statement</h2>
            </div>
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
              <p>
                Spartan Coaching is not for everyone. It is for the rep who is tired of winging it and wants a system they can actually run. It is for the leader who wants to coach behavior, not just manage results. It is for the organization that understands the connection between execution quality and patient access.
              </p>
              <p>
                If you want motivation, a conference, a speaker who fires you up for a week and then fades, there are plenty of those options. We are not one of them.
              </p>
              <p className="text-foreground font-semibold">
                We are for the professionals who understand that the work is hard, the stakes are real, and the gap between eligible patients and enrolled patients does not close itself. It closes one prepared visit at a time, one honest follow up at a time, one trust-based referral relationship at a time.
              </p>
              <p>
                That is the Spartan way. Not flash. Not hype. Just the work, done right, for the people who need it most.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* CTA */}
      <section className="bg-gray-950 py-20">
        <FadeIn>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <Flame className="w-12 h-12 text-red-500 mx-auto mb-8" />
            <h2 className="text-h2 font-bold text-white mb-6">
              If this resonates, reach out.
            </h2>
            <p className="text-body-lg text-white/70 max-w-xl mx-auto leading-relaxed mb-10">
              No obligation, no pressure. Just an honest conversation about where your team is and what it would take to close the gap.
            </p>
            <Button
              size="lg"
              asChild
              className="font-bold shadow-lg touch-manipulation group px-10"
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
