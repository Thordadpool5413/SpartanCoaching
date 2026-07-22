import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { SEO } from "@/components/SEO";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { Shield, Lock, Heart, AlertTriangle, CheckCircle, ShieldOff, BookOpen, Target, ServerCrash, FileCheck, ArrowRight, Mail } from "lucide-react";
import { Link } from "wouter";

const dataCollectedItems = [
  { text: "Name, email, phone number, and organization (provided via contact form)" },
  { text: "Role and team information for engagement planning" },
  { text: "Coaching session notes and action plans (non-clinical)" },
  { text: "Territory and market analysis data (aggregate, de-identified)" },
];

const noPhiItems = [
  { icon: ShieldOff, text: "No patient names, medical record numbers, or diagnosis information" },
  { icon: ShieldOff, text: "No protected health information (PHI) entered, stored, or processed" },
  { icon: ShieldOff, text: "No clinical documentation or electronic medical records accessed through this platform" },
  { icon: ShieldOff, text: "AI-powered tools are designed for workflow planning only, never for patient data" },
];

const dataProtectionItems = [
  { icon: Lock, text: "All data transmitted over HTTPS with TLS encryption in transit" },
  { icon: ServerCrash, text: "Application hosted on secure, SOC 2-compliant infrastructure" },
  { icon: Shield, text: "Access controls limit data visibility to authorized personnel only" },
  { icon: FileCheck, text: "Regular review of data handling practices and security posture" },
];

const boundaryItems = [
  { text: "We do not train inducements or kickbacks of any kind" },
  { text: "We do not coach aggressive or high-pressure sales tactics" },
  { text: "We do not encourage misleading clinical messaging" },
  { text: "We do not train reps to circumvent clinical eligibility criteria" },
  { text: "We do not support documentation shortcuts" },
];

const ethicalItems = [
  { icon: Heart, text: "Coaching focuses on ethical relationship building and education, not inducements" },
  { icon: BookOpen, text: "Reps learn to communicate clinical value clearly and honestly" },
  { icon: Target, text: "Territory strategy respects clinical workflow and provider relationships" },
  { icon: CheckCircle, text: "Follow-up cadences are designed to add value, not to pressure" },
];

export default function ComplianceEthics() {
  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <BackButton />
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-16">
            <h1 className="text-h1 text-foreground mb-6" data-testid="text-compliance-title">
              Compliance & Data Practices
            </h1>
            <p className="text-h3 text-muted-foreground leading-relaxed">
              Spartan Coaching is committed to ethical hospice sales coaching that prioritizes patient access, clinical integrity, and full regulatory compliance. We do not store, process, or transmit Protected Health Information (PHI).
            </p>
          </div>
        </FadeIn>

        <div className="space-y-12 md:space-y-16">

          <FadeIn>
            <div>
              <div className="flex gap-4 items-center mb-8">
                <div className="w-14 h-14 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-h2 text-foreground">What Data We Collect</h2>
              </div>
              <Card className="spacing-card border-2" data-testid="card-data-collected">
                <StaggerContainer className="space-y-4">
                  {dataCollectedItems.map((item, index) => (
                    <StaggerItem key={index}>
                      <div className="flex gap-3 items-start" data-testid={`text-data-collected-${index}`}>
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
            <div>
              <div className="flex gap-4 items-center mb-8">
                <div className="w-14 h-14 shrink-0 rounded-full bg-spartan-gradient flex items-center justify-center shadow-lg">
                  <ShieldOff className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-h2 text-foreground">What We Do Not Store (No PHI)</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-cards">
                {noPhiItems.map((item, index) => (
                  <Card key={index} className="border-2 group relative spacing-card" data-testid={`card-no-phi-${index}`}>
                    <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    <div className="relative flex gap-4 items-start">
                      <div className="w-12 h-12 shrink-0 rounded-full bg-destructive/10 flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-destructive" />
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
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-h2 text-foreground">How Data Is Protected</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-cards">
                {dataProtectionItems.map((item, index) => (
                  <Card key={index} className="border-2 group relative spacing-card" data-testid={`card-protection-${index}`}>
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
                <h2 className="text-h2 text-foreground">BAA Availability for Corporate Accounts</h2>
              </div>
              <Card className="spacing-card border-2 bg-gradient-to-br from-primary/5 to-transparent" data-testid="card-baa-availability">
                <div className="space-y-4">
                  <p className="text-body-lg text-foreground leading-relaxed">
                    For corporate hospice providers and hospital-system clients, Spartan Coaching offers a HIPAA Business Associate Agreement (BAA) as part of our engagement process. While our platform does not store or process PHI, we understand that enterprise procurement requires formal documentation of data handling commitments.
                  </p>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    Our BAA covers the scope of consulting engagements, data safeguards, breach notification procedures, and termination obligations in compliance with HIPAA, the HITECH Act, and related regulations.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button asChild className="font-bold gap-2" data-testid="button-request-baa-compliance">
                      <Link href="/contact?service=HIPAA+BAA+Request">
                        <Shield className="w-4 h-4" />
                        Request a BAA
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="font-bold gap-2" data-testid="link-view-baa-compliance">
                      <Link href="/baa">
                        <FileCheck className="w-4 h-4" />
                        View BAA Template
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </FadeIn>

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
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-h2 text-foreground">Ethical Education-Based Relationship Building</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-cards">
                {ethicalItems.map((item, index) => (
                  <Card key={index} className="border-2 group relative spacing-card" data-testid={`card-ethical-${index}`}>
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
            <div className="surface-band rounded-3xl p-10 md:p-16 text-center mt-16 text-foreground border border-border">
              <h2 className="text-h2 font-black text-foreground mb-4">
                Compliance Questions?
              </h2>
              <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
                Our team is available to answer questions about data handling, HIPAA compliance posture, or BAA requests. Reach out and we will respond within one business day.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="font-bold shadow-lg gap-2" data-testid="button-compliance-contact">
                  <Link href="/contact?service=HIPAA+BAA+Request">
                    <Mail className="w-5 h-5" />
                    Contact Us About Compliance
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="font-bold border-2" data-testid="link-compliance-manifesto">
                  <Link href="/legal">View All Legal Agreements</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
