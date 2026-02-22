import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { SEO } from "@/components/SEO";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { ContactForm } from "@/components/ContactForm";
import { Shield, Lock, Heart, AlertTriangle, CheckCircle, ShieldOff, BookOpen, Target } from "lucide-react";

const boundaryItems = [
  { text: "We do not train inducements or kickbacks of any kind" },
  { text: "We do not coach aggressive or high-pressure sales tactics" },
  { text: "We do not encourage misleading clinical messaging" },
  { text: "We do not train reps to circumvent clinical eligibility criteria" },
  { text: "We do not support documentation shortcuts" },
];

const phiItems = [
  { icon: ShieldOff, text: "Do not enter patient identifiers or protected health information into any tools" },
  { icon: Lock, text: "Tools are for planning and messaging workflows, not clinical documentation" },
  { icon: Shield, text: "Client data is not used to train public models" },
  { icon: CheckCircle, text: "All tools are designed for workflow support, not patient records" },
];

const ethicalItems = [
  { icon: Heart, text: "Coaching focuses on ethical relationship building and education, not inducements" },
  { icon: BookOpen, text: "Reps learn to communicate clinical value clearly and honestly" },
  { icon: Target, text: "Territory strategy respects clinical workflow and provider relationships" },
  { icon: CheckCircle, text: "Follow-up cadences are designed to add value, not to pressure" },
];

const guaranteeItems = [
  { text: "Spartan Coaching does not guarantee admissions, referrals, or census growth" },
  { text: "Outcomes depend on execution, market conditions, and organizational commitment" },
  { text: "We measure progress through behavior changes and process consistency" },
  { text: "Success is earned through discipline, not promised through marketing" },
];

export default function ComplianceEthics() {
  const [contactOpen, setContactOpen] = useState(false);
  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <BackButton />
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-16">
            <h1 className="text-h1 text-foreground mb-6" data-testid="text-compliance-title">
              Compliance and Ethics
            </h1>
            <p className="text-h3 text-muted-foreground leading-relaxed">
              Spartan Coaching is committed to ethical hospice sales coaching that prioritizes patient access, clinical integrity, and full regulatory compliance.
            </p>
          </div>
        </FadeIn>

        <div className="space-y-12 md:space-y-16">
          <FadeIn>
            <div>
              <div className="flex gap-4 items-center mb-8">
                <div className="w-14 h-14 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-h2 text-foreground">What We Will Not Train</h2>
              </div>
              <Card className="spacing-card bg-gradient-to-br from-primary/5 to-destructive/5 border-2" data-testid="card-boundaries">
                <StaggerContainer className="space-y-4">
                  {boundaryItems.map((item, index) => (
                    <StaggerItem key={index}>
                      <div className="flex gap-3 items-start" data-testid={`text-boundary-${index}`}>
                        <ShieldOff className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-body-lg text-foreground leading-relaxed">{item.text}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </Card>
            </div>
          </FadeIn>

          <FadeIn>
            <div>
              <div className="flex gap-4 items-center mb-8">
                <div className="w-14 h-14 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-h2 text-foreground">PHI and AI Tool Usage Boundaries</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-cards">
                {phiItems.map((item, index) => (
                  <Card key={index} className="border-2 group relative card-lift spacing-card" data-testid={`card-phi-${index}`}>
                    <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    <div className="relative flex gap-4 items-start">
                      <div className="w-12 h-12 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-body text-muted-foreground leading-relaxed">{item.text}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn>
            <div>
              <div className="flex gap-4 items-center mb-8">
                <div className="w-14 h-14 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-h2 text-foreground">Ethical Education-Based Relationship Building</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-cards">
                {ethicalItems.map((item, index) => (
                  <Card key={index} className="border-2 group relative card-lift spacing-card" data-testid={`card-ethical-${index}`}>
                    <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    <div className="relative flex gap-4 items-start">
                      <div className="w-12 h-12 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-body text-muted-foreground leading-relaxed">{item.text}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn>
            <div>
              <div className="flex gap-4 items-center mb-8">
                <div className="w-14 h-14 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-h2 text-foreground">No Guarantees Statement</h2>
              </div>
              <Card className="spacing-card bg-gradient-to-br from-primary/5 to-destructive/5 border-2" data-testid="card-guarantees">
                <StaggerContainer className="space-y-4">
                  {guaranteeItems.map((item, index) => (
                    <StaggerItem key={index}>
                      <div className="flex gap-3 items-start" data-testid={`text-guarantee-${index}`}>
                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-body-lg text-foreground leading-relaxed">{item.text}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </Card>
            </div>
          </FadeIn>

          <FadeIn>
            <div className="bg-gradient-to-br from-primary/10 to-destructive/10 rounded-2xl p-8 md:p-12 text-center mt-16">
              <h2 className="text-h2 font-bold text-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
                Partner with a coaching program built on integrity, compliance, and a commitment to ethical hospice sales practices.
              </p>
              <Button
                size="lg"
                className="font-bold py-3"
                onClick={() => setContactOpen(true)}
                data-testid="button-compliance-apply"
              >
                Apply Now
              </Button>
              <ContactForm open={contactOpen} onOpenChange={setContactOpen} />
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
