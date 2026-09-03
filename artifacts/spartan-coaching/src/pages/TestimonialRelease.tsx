import { AccentText } from "@/components/AccentText";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn } from "@/components/animations";
import { AgreementSignatureForm } from "@/components/AgreementSignatureForm";

export default function TestimonialRelease() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <BackButton />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-4" data-testid="text-testimonial-release-title"><AccentText>Testimonial / Case Study Release</AccentText></h1>
        <p className="text-body text-muted-foreground mb-10">
          Last Updated: February 2026
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>1. Purpose</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              This Testimonial and Case Study Release Agreement ("Agreement") grants Spartan Coaching ("Consultant") permission to use the Client's testimonials, case study results, and related information for marketing and promotional purposes. This Agreement is entered into by and between Spartan Coaching and the entity or individual providing the testimonial or participating in the case study ("Client").
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>2. Grant of Permission</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              Client grants Spartan Coaching a non-exclusive, royalty-free, perpetual license to use the following in marketing materials, website content, social media, presentations, and promotional materials:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Testimonials and Quotes:</strong> Written or verbal testimonials and quotes attributed to the Client, including statements about their experience with Spartan Coaching's services.</li>
              <li><strong className="text-foreground">Case Study Results:</strong> Case study results, including performance metrics, outcomes, and measurable improvements achieved during or after the consulting engagement.</li>
              <li><strong className="text-foreground">Organization Identity:</strong> Organization name and logo, if separately approved by the Client in writing.</li>
              <li><strong className="text-foreground">Performance Data:</strong> Before/after performance data, which may be anonymized if preferred by the Client.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>3. Approved Use</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              Spartan Coaching will use testimonials and case studies in a professional manner consistent with the Client's reputation and the integrity of the information provided. Content may be used in the following formats:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Website testimonials and success stories</li>
              <li>Social media posts and advertisements</li>
              <li>Marketing brochures and printed materials</li>
              <li>Presentations and speaking engagements</li>
              <li>Case studies and white papers</li>
              <li>Promotional emails and newsletters</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>4. Review and Approval</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              Before publication, Spartan Coaching will provide the Client with a copy of any testimonial or case study for review and approval. The following review process applies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Client will receive a draft of the testimonial or case study content for review prior to any public use.</li>
              <li>Client has ten (10) business days from receipt to approve, request changes, or decline the use of the content.</li>
              <li>If the Client does not respond within the review period, the content will not be published until written approval is received.</li>
              <li>No testimonial or case study content will be published without the Client's written approval.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>5. Anonymity Options</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              Client may choose how they wish to be identified in any testimonial or case study. Available attribution options include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Full Attribution:</strong> Full organization name, contact person's name, and title.</li>
              <li><strong className="text-foreground">Partial Attribution:</strong> First name and state only (e.g., "Sarah, Texas").</li>
              <li><strong className="text-foreground">Anonymous:</strong> Anonymous with industry description only (e.g., "a mid-size hospice agency in the Southeast").</li>
              <li><strong className="text-foreground">Custom Attribution:</strong> Custom attribution format as mutually agreed upon by the Client and Spartan Coaching.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>6. HIPAA Compliance</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              No testimonial or case study will include any Protected Health Information (PHI) or individually identifiable patient data as defined under the Health Insurance Portability and Accountability Act (HIPAA). All performance metrics referenced in testimonials or case studies will be presented in aggregate form only. Both Parties agree to ensure that no patient-specific information is disclosed, referenced, or implied in any testimonial, case study, or marketing material produced under this Agreement.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>7. Revocation</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              Client may revoke this release at any time by providing thirty (30) days written notice to Spartan Coaching. Upon revocation, the following terms apply:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Spartan Coaching will remove the Client's testimonials and case study content from its website and active marketing materials within sixty (60) days of receiving the revocation notice.</li>
              <li>Materials already in distribution (such as printed brochures, previously published social media posts, or third-party publications) may remain in circulation but will not be reprinted or actively redistributed.</li>
              <li>Revocation does not affect any rights or obligations that arose prior to the effective date of revocation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>8. Compensation</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              No compensation is provided for testimonials or case study participation. The Client's participation is entirely voluntary, and the Client acknowledges that they are providing their testimonial or participating in the case study without expectation of payment, discount, or other consideration from Spartan Coaching.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>9. Contact Information</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              For questions about this Testimonial and Case Study Release Agreement, to request changes to your attribution preferences, or to submit a revocation notice, please contact Spartan Coaching through the contact form on our website. We value your partnership and are committed to representing your experience accurately and professionally.
            </p>
          </section>
        </div>
      </FadeIn>

      <AgreementSignatureForm
        agreementType="Testimonial / Case Study Release"
        agreementTitle="Testimonial / Case Study Release"
      />
    </div>
  );
}
