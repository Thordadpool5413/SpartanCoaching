import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";
import { Target, Users, TrendingUp, Linkedin, BookOpen, Repeat, Heart, Handshake, ShieldCheck, ArrowRight } from "lucide-react";
import { Target, Users, TrendingUp, Linkedin, BookOpen, Repeat, Heart, Handshake, ShieldCheck, ArrowRight, Wrench } from "lucide-react";
import { Link } from "wouter";
import nickPhoto from "@assets/nick-photo.jpg";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { PersuasionShell } from "@/components/PersuasionShell";

export default function About() {
  return (
    <PersuasionShell>
      <SEO />
      <BackButton />

      {/* Above-fold two-column authority layout */}
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-stretch mb-16 sm:mb-24">
        <div className="flex flex-col justify-center">
          <p className="text-kicker mb-4">About Spartan Coaching</p>
          <h1 className="text-h1 text-foreground mb-6 font-display leading-[1.05] tracking-tight" data-testid="text-about-title">
            Why Spartan<br /><span className="text-primary">Coaching Exists</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Hospice is not a mystery. It is a promise — and Spartan Coaching exists to make sure sales teams can keep it.
          </p>
          <p className="text-base text-muted-foreground mb-10 leading-relaxed">
            Built in the field by Nick Lynch: hospice-specific sales and leadership coaching for liaisons, directors, and multi-market teams who need structure and heart in the same room.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 self-start">
            <Button size="lg" asChild className="font-bold px-8">
              <Link href="/contact">Book a Strategy Call <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-bold px-8">
              <Link href="/services">View coaching services</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border shadow-elite">
            <img
              src={nickPhoto}
              alt="Nick Lynch — Spartan Coaching"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute bottom-0 inset-x-0 h-1 bg-primary" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">

        {/* The Why Section - Core Message */}
        <div className="space-y-8 md:space-y-12 lg:space-y-16">
          <Card className="spacing-card bg-gradient-to-br from-primary/[0.07] to-card border border-border/80 shadow-elite">
            <div className="space-y-6 text-body-lg leading-relaxed">
              <p className="text-foreground">
                The promise is simple. When a person is eligible, they should receive expert, compassionate care without delay, and their family should feel supported at every step. That promise breaks when sales teams are left with vague goals, light coaching, and a calendar full of activity that does not move referrals.
              </p>
              <p className="text-foreground font-semibold text-body-lg">
                Spartan Coaching exists to close the gap between good intentions and consistent execution so more eligible patients receive care earlier in their journey.
              </p>
              <p className="text-foreground">
                This is about moral clarity and measurable outcomes living in the same room. Ethics without structure does not scale. Structure without heart does not last. We teach both.
              </p>
              <p className="text-foreground">
                Reps learn what to do at 8 on Monday, how to prepare for a physician visit at 11, and how to close the loop by 4 so nothing stalls. Leaders learn how to coach one skill at a time, how to run short pipeline reviews that actually change behavior, and how to build a team rhythm that survives busy seasons, market changes, and turnover.
              </p>
            </div>
          </Card>
        </div>

        {/* The Stakes */}
        <div className="space-y-8 md:space-y-12 lg:space-y-16">
          <h2 className="text-h2 text-foreground mt-12 mb-8">The Stakes Are Real</h2>
          <div className="grid md:grid-cols-3 gap-cards">
            <Card className="border-2 group relative text-center spacing-card" data-testid="card-stakes-teams">
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:glow-primary transition-all duration-300">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-h3 font-bold text-foreground mb-3">For Teams</h3>
                <p className="text-body text-muted-foreground leading-relaxed">
                  When teams communicate clearly with referral partners and remove friction from the pathway, length of stay stabilizes, hospital readmissions drop, and families feel seen.
                </p>
              </div>
            </Card>

            <Card className="border-2 group relative text-center spacing-card" data-testid="card-stakes-reps">
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:glow-primary transition-all duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-h3 font-bold text-foreground mb-3">For Reps</h3>
                <p className="text-body text-muted-foreground leading-relaxed">
                  When reps carry a clean plan for their top accounts, follow up is faster, objections become opportunities to educate, and referrals move from interest to signed order without getting lost.
                </p>
              </div>
            </Card>

            <Card className="border-2 group relative text-center spacing-card" data-testid="card-stakes-orgs">
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:glow-primary transition-all duration-300">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-h3 font-bold text-foreground mb-3">For Organizations</h3>
                <p className="text-body text-muted-foreground leading-relaxed">
                  When the corporate office can see the same standards across markets, wins are repeatable and growth is not guesswork.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* What We Built */}
        <div className="space-y-8 md:space-y-12 lg:space-y-16">
          <Card className="spacing-card mt-16 mb-16">
            <h2 className="text-h2 text-foreground mb-6">Foundation of Spartan Coaching</h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>Spartan Coaching was built because hospice deserves better than motivational posters and one-time pep talks. People need a system they can run on Tuesday afternoon when a clinic is short-staffed, the hospitalist is behind, and the family is scared.</p>
              <p>
                That system has to be simple, honest, and teachable. It has to honor Medicare rules and protect trust with physicians and facilities. It has to turn mission into steps that any trained rep can take and any skilled leader can coach.
              </p>
              <p className="font-semibold text-foreground text-body-lg">
                Spartan is a choice. It means fewer buzzwords and more practice. Fewer meetings and more field work. Clear standards. Straight talk. Daily accountability.
              </p>
              <p>
                It means we measure what matters so effort turns into access for the people who need it most. We do this work because the end of life is not the end of care. It is when care must be at its best.
              </p>
            </div>
          </Card>
        </div>

        {/* The Founding Moment */}
        <div className="space-y-8 md:space-y-12 lg:space-y-16">
          <h2 className="text-h2 text-foreground mt-16 mb-8">Why This Business Exists</h2>
          <Card className="spacing-card bg-gradient-to-br from-primary/5 to-destructive/5 border-2">
            <div className="space-y-6 text-body-lg text-muted-foreground leading-relaxed">
              <p>
                Nick Lynch built Spartan Coaching from a pattern he kept seeing in the field. Good people. Real intentions. Genuine care for patients and families. And yet the execution was inconsistent, the pipeline was flat, and the leaders were reviewing numbers without knowing how to change them.
              </p>
              <p>
                The problem was never motivation. Hospice professionals are among the most mission-driven people in healthcare. The problem was structure. Teams had good values and no system. They had goals and no playbook. They had activity and no accountability rhythm that anyone could actually coach from.
              </p>
              <p className="text-foreground font-semibold">
                Meanwhile, eligible patients were not getting referred. Families were managing end-of-life without expert support because the right conversation had not happened yet. The gap was real and it was widening.
              </p>
              <p>
                Spartan Coaching was built to close that gap. Not through motivation. Not through a conference or a seminar. Through a practical, teachable, repeatable system that any committed rep can run and any skilled leader can coach.
              </p>
              <p>
                The name matters because the preparation matters. You do not show up unprepared to the most important conversations in people's lives.
              </p>
            </div>
          </Card>

          <div className="mt-8 mb-8">
            <Card className="spacing-card bg-card border-2 border-primary/20">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                  "Ethics without structure does not scale. Structure without heart does not last. We teach both."
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* About the Founder */}
        <div className="space-y-8 md:space-y-12 lg:space-y-16">
          <h2 className="text-h2 text-foreground mb-8 text-center">About the Founder</h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-1">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-destructive/20 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-40 h-40 mx-auto overflow-hidden mb-4 border-4 border-card shadow-xl" style={{ borderRadius: '9999px' }}>
                    <img
                      src={nickPhoto}
                      alt="Nick Lynch"
                      className="w-full h-full object-cover"
                      style={{ borderRadius: '9999px' }}
                      data-testid="img-founder"
                    />
                  </div>
                  <h3 className="text-h3 font-bold text-foreground">Nick Lynch</h3>
                  <p className="text-muted-foreground">Founder</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <Card className="spacing-card">
                <div className="space-y-4 text-body text-muted-foreground leading-relaxed">
                  <p>Nick Lynch brings two things into hospice coaching that most people keep separate: what liaisons see in the field every day and what leaders need to see to coach performance without guessing. He has led teams, worked in clinics, and spent real time on ride alongs, seeing firsthand where good plans break down and what actually holds up.</p>
                  <p>Nick helps teams decide the next right move and then follow through. He keeps the work anchored to the field and aligned with clinical workflow, so it stays usable when the week gets busy. When a territory feels unclear, he can use eligibility knowledge and claims data to separate what is true from what is assumed, then turn it into a simple plan the team can run consistently.</p>
                  <p>When Nick steps away, leaders are not just looking at numbers. They understand the people behind them. They know what each rep is strong at, where they hesitate, what they avoid, and what they need next. They can coach the person, not just the pipeline.</p>
                  <p>They also have a real read on the market. Not impressions, not 'it feels slow.' They know the temperature in each territory, what referral sources are shifting, where relationships are strong or slipping, and what needs attention now. That clarity keeps coaching focused and keeps execution steady because the team is working the right plan for the market they are actually in.</p>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 mt-16 mb-16">
            <Card className="border-2 group relative spacing-card" data-testid="card-experience-field">
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative">
                <h3 className="text-h3 font-bold text-primary mb-3">Field Leadership</h3>
                <p className="text-body text-muted-foreground leading-relaxed">
                  Built and led field sales teams across multiple markets, developing territory strategies that respect clinical workflows while driving measurable growth in referrals and patient census.
                </p>
              </div>
            </Card>

            <Card className="border-2 group relative spacing-card" data-testid="card-experience-operations">
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative">
                <h3 className="text-h3 font-bold text-primary mb-3">Operational Excellence</h3>
                <p className="text-body text-muted-foreground leading-relaxed">
                  Designed and implemented systems for admissions speed, start-of-care readiness, and IDT communication that reduce delays and improve patient outcomes.
                </p>
              </div>
            </Card>

            <Card className="border-2 group relative spacing-card" data-testid="card-experience-coaching">
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative">
                <h3 className="text-h3 font-bold text-primary mb-3">Practical Coaching</h3>
                <p className="text-body text-muted-foreground leading-relaxed">
                  Believes in coaching that happens in the work, not in theory. Every framework is field-tested, every playbook is battle-proven, and every strategy prioritizes patient-first outcomes.
                </p>
              </div>
            </Card>
          </div>

          {/* Values and Coaching Philosophy */}
          <div className="mt-16 mb-16">
            <h2 className="text-h2 text-foreground mb-8 text-center">Values and Coaching Philosophy</h2>
            <div className="grid md:grid-cols-2 gap-cards">
              <Card className="border-2 group relative spacing-card" data-testid="card-value-practical">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex gap-4 items-start">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-h3 font-bold text-foreground mb-2">Practical Over Theoretical</h3>
                    <p className="text-body text-muted-foreground leading-relaxed">Coaching happens in the work, not in a classroom</p>
                  </div>
                </div>
              </Card>

              <Card className="border-2 group relative spacing-card" data-testid="card-value-consistency">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex gap-4 items-start">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                    <Repeat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-h3 font-bold text-foreground mb-2">Consistency Over Intensity</h3>
                    <p className="text-body text-muted-foreground leading-relaxed">Simple plans repeated well beat heroic one-time efforts</p>
                  </div>
                </div>
              </Card>

              <Card className="border-2 group relative spacing-card" data-testid="card-value-patient">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex gap-4 items-start">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-h3 font-bold text-foreground mb-2">Patient-First Outcomes</h3>
                    <p className="text-body text-muted-foreground leading-relaxed">Every strategy prioritizes getting eligible patients into care earlier</p>
                  </div>
                </div>
              </Card>

              <Card className="border-2 group relative spacing-card" data-testid="card-value-ethical">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex gap-4 items-start">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                    <Handshake className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-h3 font-bold text-foreground mb-2">Ethical Relationship Building</h3>
                    <p className="text-body text-muted-foreground leading-relaxed">Education-based outreach that respects clinical partners</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Ethical Growth Stance */}
          <div className="mb-16">
            <h2 className="text-h2 text-foreground mb-8 text-center">Ethical Growth Stance</h2>
            <Card className="spacing-card bg-gradient-to-br from-primary/5 to-destructive/5 border-2" data-testid="card-ethical-stance">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-4 text-body text-muted-foreground leading-relaxed">
                  <p>Spartan Coaching focuses on ethical, education-based relationship building. We believe that sustainable growth comes from genuine clinical partnerships, not shortcuts.</p>
                  <p>We do not train inducements, aggressive tactics, or misleading messaging. Every method we teach is designed to be transparent, compliant, and respectful of the clinical professionals we work alongside.</p>
                  <p>Coaching respects clinical workflow and prioritizes patient access. Our strategies are built to integrate with how healthcare teams actually operate, ensuring that patient care is never disrupted.</p>
                  <p className="font-semibold text-foreground">No guarantees of admissions, referrals, or census growth are made. We provide the frameworks, coaching, and accountability. Results depend on consistent execution by committed teams.</p>
                </div>
              </div>
            </Card>
          </div>

          {/* What a Spartan Rep Looks Like */}
          <div className="mt-16 mb-8">
            <h2 className="text-h2 text-foreground mb-4">What a Spartan Rep Looks Like</h2>
            <p className="text-body-lg text-muted-foreground leading-relaxed mb-8">
              Not the most charismatic rep. Not the most experienced. The most prepared. Here is what that looks like in observable behaviors.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  label: "Before the visit",
                  items: [
                    "Account reviewed, not just remembered",
                    "Written objective for the visit, not a general intention",
                    "Notes from the last visit read, relevant detail ready",
                    "Next step identified before walking in",
                  ],
                },
                {
                  label: "After the visit",
                  items: [
                    "What happened documented within the day",
                    "Commitments made tracked and followed up",
                    "Follow up on the calendar with specific content planned",
                    "One observation captured for coaching",
                  ],
                },
                {
                  label: "With clinical partners",
                  items: [
                    "First question is about them, not about referrals",
                    "Their workflow understood and respected",
                    "Commitments kept without prompting",
                    "Educational value delivered consistently, not just when a referral is needed",
                  ],
                },
                {
                  label: "With their own performance",
                  items: [
                    "Scorecard completed honestly, including the bad weeks",
                    "Patterns reviewed, not just numbers reported",
                    "Practice done before difficult conversations, not after failures",
                    "Coaching received as information, not judgment",
                  ],
                },
              ].map((group, i) => (
                <Card key={i} className="spacing-card border-2" data-testid={`card-spartan-rep-${i}`}>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">{group.label}</h3>
                  <ul className="space-y-2">
                    {group.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-body text-muted-foreground">
                        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>

          {/* LinkedIn Connect Section */}
          <div className="mt-8 text-center">
            <Card className="spacing-card bg-gradient-to-br from-primary/5 to-primary/10 border-2">
              <p className="text-muted-foreground mb-4 font-bold">
                Learn more about Nick's professional background and experience
              </p>
              <Button
                asChild
                variant="outline"
                className="gap-2 group"
                data-testid="button-linkedin-about"
              >
                <a
                  href="https://www.linkedin.com/in/nicholas-lynch-coaching?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BzPbXAWy3RZWKMT%2FppHgzbw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Connect on LinkedIn</span>
                </a>
              </Button>
            </Card>
          </div>
        </div>

        <div className="mt-16 mb-12 space-y-6" data-testid="section-about-next-steps">
          <h2 className="text-h2 text-foreground text-center">Explore the work, not another pitch.</h2>
          <p className="text-body text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
            This page is about the person and principles behind Spartan Coaching. See the method for the operating
            standard, or services for a consulting engagement.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <Card className="spacing-card border-2">
              <h3 className="text-h3 font-bold text-foreground mb-2">The Spartan Method</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The four-part practice standard and patient-first ethics that guide the work.
              </p>
              <Link href="/method" className="font-semibold text-primary hover:underline">See the method →</Link>
            </Card>
            <Card className="spacing-card border-2">
              <h3 className="text-h3 font-bold text-foreground mb-2">Consulting services</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Coaching, workshops, and leadership systems scoped to your hospice team.
              </p>
              <Link href="/services" className="font-semibold text-primary hover:underline">View services →</Link>
            </Card>
          </div>
        </div>

        {/* How consulting + Hospice Sales Pro fit together */}
        <div className="mt-16 mb-12 space-y-6" data-testid="section-about-approach">
          <h2 className="text-h2 text-foreground text-center">How we work with clients</h2>
          <p className="text-body text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
            Spartan is a consulting practice first. Coaching and team systems are the core. Hospice Sales Pro is the tools and resources layer — web and iPhone — for people who want execution between sessions or on their own.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Users,
                title: "Human coaching",
                text: "1:1, leadership, and field work that changes behavior on Tuesday — not another deck.",
              },
              {
                icon: Wrench,
                title: "Hospice Sales Pro",
                text: "Command Center, Coach, practice tools, plans, and calculators. Elite recommended at $19.99/wk · Standard $14.99/wk · team seats under contract.",
              },
              {
                icon: ShieldCheck,
                title: "Ethics baked in",
                text: "No PHI in tools. No inducement training. Compliance-aware messaging that protects patients and the profession.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title} className="spacing-card border-2">
                <div className="w-11 h-11 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-h3 font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA — dark authority band; two primary actions only */}
        <div className="surface-band rounded-2xl p-8 md:p-12 text-center mt-16 text-foreground border border-border">
          <h2 className="text-h2 font-bold text-foreground mb-4">
            If this resonates, reach out.
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            No pressure. No obligation. Just an honest conversation about where your team is and what would actually help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="font-bold shadow-lg touch-manipulation group px-10" data-testid="button-about-contact">
              <Link href="/contact">
                <span>Book a strategy call</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-bold border-2 touch-manipulation px-10" data-testid="button-about-services">
              <Link href="/services">
                <span>View coaching services</span>
              </Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            <Link href="/manifesto" className="underline underline-offset-4 hover:text-primary" data-testid="button-about-manifesto">
              Read the Spartan Ethos
            </Link>
          </p>
        </div>
        <PublicConversionPanel
          source="about"
          audience="Hospice professionals evaluating the person, principles, and working style behind the engagement."
          promise="A direct conversation about what is not working and whether Spartan Coaching is the right fit."
          evidence="Founder-led, hospice-specific work with role-based proof and transparent privacy and compliance boundaries."
          primary={{ label: "Book a strategy call", href: "/contact?service=Consulting", token: "strategy_call" }}
          secondary={{ label: "View coaching services", href: "/services", token: "services" }}
        />
      </div>
    </PersuasionShell>
  );
}
