import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn } from "@/components/animations";

export default function Disclaimer() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <BackButton />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-4" data-testid="text-disclaimer-title">
          Disclaimer
        </h1>
        <p className="text-body text-muted-foreground mb-10">
          Last Updated: February 2026
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-h2 text-foreground mb-3">General Disclaimer</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              The information provided by Spartan Coaching on this website and through our services is for educational and informational purposes only. All content, including articles, training materials, AI tool outputs, podcasts, videos, and downloadable resources, is intended to support professional development in hospice sales. Nothing on this website should be construed as a substitute for professional advice from a licensed or credentialed expert in medicine, law, finance, or any other regulated field.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">Not Medical Advice</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Spartan Coaching is a sales consulting and training firm. We do not provide medical advice, diagnosis, or treatment recommendations. While our content may reference hospice care, patient eligibility, clinical terminology, or healthcare regulations, this information is provided solely in the context of sales education. Healthcare professionals should always consult qualified medical practitioners and follow established clinical guidelines and organizational policies when making decisions related to patient care.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">Not Legal Advice</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              The content on this website does not constitute legal advice. While we may reference healthcare regulations, compliance requirements, or industry standards, this information is provided for general educational purposes only. You should consult with a qualified attorney or compliance professional for advice regarding your specific legal situation, regulatory obligations, or compliance questions.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">No Guaranteed Results</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Any results, metrics, or performance statements shared on this website, including testimonials, case studies, and success stories, are examples of what has been achieved by specific individuals or organizations under specific circumstances. These statements are illustrative and should not be interpreted as a guarantee or promise that you will achieve similar results. Individual results will vary based on numerous factors including market conditions, organizational support, individual effort, experience level, territory dynamics, and other variables beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">Professional Judgment</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Users of this website and our services should rely on their own professional judgment when applying any strategies, techniques, or recommendations discussed in our content. Spartan Coaching provides frameworks and guidance based on industry experience, but the application of these principles must be adapted to your specific professional context, organizational policies, regulatory environment, and ethical standards. You are solely responsible for your professional conduct and decisions.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">AI-Generated Content</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Spartan Coaching offers AI-powered tools that generate sales playbooks, objection responses, email templates, territory research, and other content. These tools provide general guidance based on AI models and should not be considered personalized professional advice. AI-generated content may contain inaccuracies, outdated information, or suggestions that may not be appropriate for your specific situation. Users are responsible for reviewing all AI-generated content, verifying its accuracy, and ensuring it complies with their organization's policies and applicable regulations before use in any professional setting.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">Earnings and Results</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Spartan Coaching makes no guarantees regarding income, revenue growth, referral increases, or any other financial or performance outcomes. Any financial figures, growth percentages, or performance improvements referenced on this website are not guarantees of future performance. Your results will depend on many factors that are outside of our control, including your dedication, work ethic, market conditions, organizational resources, and the application of the strategies taught. We do not guarantee that you will earn any specific amount of money or achieve any specific business outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">External Links</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              This website may contain links to external websites, resources, or services that are not provided or maintained by Spartan Coaching. We do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites. The inclusion of any link does not imply endorsement, approval, or recommendation by Spartan Coaching. You access external links at your own risk and should review the terms and privacy policies of any third-party websites you visit.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">Changes to This Disclaimer</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Spartan Coaching reserves the right to update or modify this Disclaimer at any time without prior notice. Changes will be effective immediately upon posting on this website. Your continued use of this website following the posting of changes constitutes your acceptance of those changes. We encourage you to review this page periodically to stay informed about our disclaimers.
            </p>
          </section>
        </div>
      </FadeIn>
    </div>
  );
}
