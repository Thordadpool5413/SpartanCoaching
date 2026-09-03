import { AccentText } from "@/components/AccentText";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, Shield, Lock, Database, Users, Scale, MessageSquare, ArrowRight } from "lucide-react";

const agreements = [
  {
    title: "Services Contract Agreement",
    description: "Defines consulting scope, deliverables, fees, payment terms, confidentiality obligations, and termination conditions.",
    href: "/contract",
    icon: FileText,
    testId: "card-legal-contract",
  },
  {
    title: "Non-Disclosure Agreement",
    description: "Mutual protection of confidential business information, trade secrets, and proprietary materials exchanged during engagements.",
    href: "/nda",
    icon: Lock,
    testId: "card-legal-nda",
  },
  {
    title: "EMR / Data Access Agreement",
    description: "Governs consultant access to electronic medical records systems, security requirements, and credential management policies.",
    href: "/emr-access",
    icon: Database,
    testId: "card-legal-emr-access",
  },
  {
    title: "Conflict of Interest Disclosure",
    description: "Transparent disclosure about consulting with multiple hospice organizations, information barriers, and ethical guidelines.",
    href: "/conflict-of-interest",
    icon: Users,
    testId: "card-legal-conflict-of-interest",
  },
  {
    title: "Liability Waiver / Hold Harmless",
    description: "Covers consulting services, on-site activities, implementation responsibility, and mutual indemnification provisions.",
    href: "/liability-waiver",
    icon: Scale,
    testId: "card-legal-liability-waiver",
  },
  {
    title: "Testimonial / Case Study Release",
    description: "Permission for using client testimonials and case study results in marketing materials, with review and anonymity options.",
    href: "/testimonial-release",
    icon: MessageSquare,
    testId: "card-legal-testimonial-release",
  },
];

export default function LegalAgreements() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <BackButton />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-4" data-testid="text-legal-title"><AccentText>Legal Agreements</AccentText></h1>
        <p className="text-body text-muted-foreground mb-10">
          Review and digitally sign the agreements required for your consulting engagement with Spartan Coaching. Each document can be signed electronically and a confirmation will be sent to your email.
        </p>
      </FadeIn>

      <FadeIn>
        <Card
          className="p-6 mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
          data-testid="card-legal-baa-featured"
        >
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="mt-1 p-3 rounded-md bg-primary/10 text-primary shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground mb-1"><AccentText>HIPAA Business Associate Agreement</AccentText></h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                Safeguards Protected Health Information (PHI) in compliance with HIPAA, HITECH Act, and related regulations during consulting engagements.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Corporate and hospital-system clients: if your procurement process requires a BAA before engagement, you can review our template below or request a signed copy directly.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button size="sm" asChild className="font-bold gap-1" data-testid="button-view-baa">
                  <Link href="/baa">
                    View BAA Template
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="font-bold gap-1" data-testid="button-request-baa-legal">
                  <Link href="/contact?service=HIPAA+BAA+Request">
                    Request a BAA
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      <StaggerContainer className="space-y-4">
        {agreements.map((agreement) => (
          <StaggerItem key={agreement.href}>
            <Link href={agreement.href}>
              <Card
                className="p-5 hover-elevate cursor-pointer transition-colors group"
                data-testid={agreement.testId}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-md bg-primary/10 text-primary shrink-0">
                    <agreement.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-foreground mb-1"><AccentText>{agreement.title}</AccentText></h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {agreement.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
