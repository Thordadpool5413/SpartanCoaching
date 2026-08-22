import React from "react";
import { SEO } from "@/components/SEO";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { AppHandoffPanel } from "@/components/AppHandoffPanel";
import { Shield, Target, Zap, Clock, Smartphone, Layers, CheckCircle } from "lucide-react";
import {
  APP_STORE_URL,
  normalizeAppHandoffDestination,
} from "@/lib/appHandoff";

function destinationFromLocation(): ReturnType<typeof normalizeAppHandoffDestination> {
  if (typeof window === "undefined") return "home";
  return normalizeAppHandoffDestination(
    new URLSearchParams(window.location.search).get("open"),
  );
}

export default function AppLander() {
  const destination = destinationFromLocation();
  return (
    <div className="w-full flex flex-col min-h-screen bg-background" data-testid="page-app-lander">
      <SEO 
        title="Hospice Sales Pro App | Spartan Coaching"
        description="The field system in your pocket. Hospice Sales Pro brings Command Center, objection handlers, and practice tools to your iPhone."
      />
      
      {/* 1. HERO */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-10 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <p className="text-kicker justify-center">The Field System</p>
              <h1 className="text-h1 font-display font-black text-foreground leading-[1.08] tracking-tight">
                Hospice Sales Pro.<br />
                <span className="text-primary">Now in your pocket.</span>
              </h1>
              <p className="text-body-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Not a generic CRM. A disciplined field companion built by a real hospice operator. 
                Execute your weekly plan, role-play objections, and manage your Command Center from anywhere.
              </p>
              <div className="pt-8 flex justify-center">
                 <AppHandoffPanel 
                  appStoreUrl={APP_STORE_URL}
                  destination={destination}
                   title="Take it into the field"
                  description="Open the app when it is installed; otherwise use the App Store or keep working on web."
                   compact
                   className="w-full max-w-2xl text-left"
                 />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 2. CORE FEATURES (Mirroring actual features) */}
      <section className="py-20 sm:py-28 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
               <h2 className="text-h2 font-display font-bold text-foreground">
                 Walk in prepared.
               </h2>
               <p className="text-body text-muted-foreground mt-4 leading-relaxed">
                 The same methodology that powers the web experience, optimized for the moments between visits.
               </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Layers,
                title: "Sales Command Center",
                desc: "Turn every visit into a continuous, coachable account workflow — not ten random tabs."
              },
              {
                icon: Target,
                title: "The Objection Handler",
                 desc: "Open the right practice tool before you walk into the room and rehearse the response that fits."
              },
              {
                icon: Clock,
                title: "Weekly Plan Builder",
                desc: "Make Monday intentional. Review and update your territory plan on the go."
              },
              {
                icon: Zap,
                title: "Calculators & Math",
                desc: "Run ROI, rep cost, and branch profitability numbers right in the facility."
              },
              {
                icon: Shield,
                title: "No PHI Required",
                desc: "Built for planning and messaging. Never patient identifiers or clinical records."
              },
              {
                icon: Smartphone,
                title: "Seamless Sync",
                 desc: "Use the same Hospice Sales Pro account on web and iPhone so your permitted work follows you."
              }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <StaggerItem key={i}>
                  <div className="h-full p-6 sm:p-8 rounded-2xl border border-border bg-background hover-elevate transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 ring-1 ring-primary/20">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-3">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* 3. DISCIPLINE / WHY OVER CRM */}
      <section className="py-24 sm:py-32 relative surface-band">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <FadeIn>
            <h2 className="text-h2 font-display font-black text-foreground mb-6">
              A companion, not a tracker.
            </h2>
            <p className="text-body-lg text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto">
              Most mobile CRMs ask you to log what happened. Hospice Sales Pro prepares you for what's next. 
              Review the exact script for a stalled referral in the parking lot. Adjust your weekly activity goals. 
              Keep the discipline alive when the week gets hard.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {[
                "Field-tested frameworks",
                "Compliance-aware messaging",
                 "One account across surfaces"
              ].map(tag => (
                <div key={tag} className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-border bg-card text-sm font-bold text-foreground shadow-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  {tag}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 4. FINAL HANDOFF */}
      <section className="py-20 sm:py-32 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
           <FadeIn>
             <AppHandoffPanel 
                appStoreUrl={APP_STORE_URL}
                destination={destination}
               title="Ready for the field?"
                description="Sign in with the same Hospice Sales Pro account on web and iPhone. Purchases stay managed in the storefront where you started them."
             />
           </FadeIn>
        </div>
      </section>
    </div>
  );
}
