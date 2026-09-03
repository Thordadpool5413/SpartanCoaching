import { AccentText } from "@/components/AccentText";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn } from "@/components/animations";
import { AgreementSignatureForm } from "@/components/AgreementSignatureForm";

export default function LiabilityWaiver() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <BackButton />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-4" data-testid="text-liability-waiver-title"><AccentText>Liability Waiver / Hold Harmless Agreement</AccentText></h1>
        <p className="text-body text-muted-foreground mb-10">
          Last Updated: February 2026
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>1. Parties</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              This Liability Waiver and Hold Harmless Agreement ("Agreement") is entered into by and between Spartan Coaching ("Consultant") and the entity or individual engaging Spartan Coaching's services ("Client"), collectively referred to as the "Parties." This Agreement is incorporated into and made a part of the underlying consulting services agreement between the Parties.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>2. Purpose</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              The purpose of this Agreement is to limit liability and establish risk acknowledgment for consulting services provided by Spartan Coaching, including but not limited to on-site visits, training sessions, coaching engagements, and the implementation of recommended strategies. Both Parties acknowledge and understand the nature of the consulting relationship and the inherent risks associated with business consulting services.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>3. Assumption of Risk</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Client acknowledges that sales consulting involves recommendations and strategies that the Client may choose to implement at their own discretion. Results may vary based on market conditions, team execution, regulatory changes, and other factors outside the Consultant's control. The Client assumes full responsibility for evaluating the suitability of any recommendations before implementation and understands that past performance or case study results do not guarantee future outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>4. On-Site Activities</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              For in-person training sessions, ride-alongs, or on-site consulting engagements, the following terms apply:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Client agrees to provide a safe working environment for all on-site consulting activities, including adequate workspace, necessary equipment access, and compliance with applicable workplace safety standards.</li>
              <li>Consultant is responsible for their own safety during transit to and from Client locations, including travel by personal vehicle, rental car, or other transportation.</li>
              <li>Neither party shall be liable for the other party's injuries resulting from normal business activities conducted in accordance with standard professional practices.</li>
              <li>Client shall inform Consultant of any known hazards or safety protocols specific to their facilities prior to on-site visits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>5. No Guaranteed Outcomes</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Consultant makes no guarantees regarding specific business outcomes, referral increases, revenue growth, or patient census improvements. All projections, estimates, and benchmarks provided by the Consultant are based on industry experience and are provided for educational and informational purposes only. Actual results will depend on numerous factors, including but not limited to market conditions, competitive landscape, team performance, management decisions, regulatory environment, and the Client's commitment to implementing recommended strategies.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>6. Implementation Responsibility</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              Client is solely responsible for implementing strategies and recommendations provided by the Consultant. The Client should ensure all implementations comply with applicable federal, state, and local regulations, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">CMS Conditions of Participation:</strong> All hospice marketing and outreach activities must comply with the Medicare Conditions of Participation for hospice providers.</li>
              <li><strong className="text-foreground">State Licensure Requirements:</strong> Client is responsible for ensuring that all sales and marketing activities comply with applicable state licensure and regulatory requirements.</li>
              <li><strong className="text-foreground">Anti-Kickback Statutes:</strong> Client must ensure that no recommended strategy, as implemented, violates federal or state anti-kickback statutes or the Stark Law.</li>
              <li><strong className="text-foreground">Additional Regulations:</strong> Client should consult with their own legal counsel to ensure compliance with all applicable laws, regulations, and industry standards.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>7. Hold Harmless</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Client's Indemnification of Consultant:</strong> Client agrees to hold harmless and indemnify Spartan Coaching, its owner, employees, contractors, and affiliates from and against any and all claims, damages, losses, liabilities, costs, or expenses (including reasonable attorney's fees) arising from the Client's implementation of recommendations, use of training materials, or actions taken based on consulting advice provided by Spartan Coaching.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Consultant's Indemnification of Client:</strong> Spartan Coaching agrees to hold harmless and indemnify the Client from any claims, damages, losses, or expenses arising directly from the Consultant's negligence or willful misconduct while on Client premises or in the performance of on-site consulting activities.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>8. Insurance</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Consultant maintains professional liability insurance (Errors and Omissions coverage) appropriate for the consulting services provided. Client is encouraged to maintain appropriate insurance coverage for their organization and employees, including general liability, professional liability, and workers' compensation insurance as required by applicable law. Upon request, either Party shall provide the other with certificates of insurance evidencing current coverage.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>9. Limitation of Liability</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Consultant's total aggregate liability under this Agreement shall be limited to the total fees paid by the Client to the Consultant during the twelve (12) months immediately preceding the event giving rise to the claim.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              Neither party shall be liable to the other for any indirect, incidental, consequential, special, or punitive damages, including but not limited to loss of profits, loss of revenue, loss of data, or loss of business opportunity, regardless of whether such damages were foreseeable or whether either party has been advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>10. Severability</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              If any provision of this Agreement is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect. The invalid or unenforceable provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving the original intent of the Parties.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>11. Contact Information</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              For questions about this Liability Waiver and Hold Harmless Agreement, please contact Spartan Coaching through the contact form on our website. We are committed to addressing your concerns and ensuring a clear understanding of the terms outlined in this Agreement.
            </p>
          </section>
        </div>
      </FadeIn>

      <AgreementSignatureForm
        agreementType="Liability Waiver / Hold Harmless Agreement"
        agreementTitle="Liability Waiver"
      />
    </div>
  );
}
