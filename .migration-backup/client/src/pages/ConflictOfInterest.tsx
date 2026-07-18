import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn } from "@/components/animations";
import { AgreementSignatureForm } from "@/components/AgreementSignatureForm";

export default function ConflictOfInterest() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <BackButton />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-4" data-testid="text-conflict-of-interest-title">
          Conflict of Interest Disclosure
        </h1>
        <p className="text-body text-muted-foreground mb-10">
          Last Updated: February 2026
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-h2 text-foreground mb-3">1. Purpose</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              The purpose of this Conflict of Interest Disclosure ("Disclosure") is to transparently disclose potential conflicts of interest and establish clear boundaries when Spartan Coaching ("Consultant") provides consulting services to multiple hospice organizations, potentially in overlapping or adjacent markets. This Disclosure supplements and is made a part of the underlying services agreement between Spartan Coaching and the engaging hospice organization ("Organization").
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">2. Disclosure</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Spartan Coaching provides consulting services to multiple hospice organizations across various markets throughout the United States. It is possible that the Consultant may work with organizations that operate in the same or adjacent service areas. The Consultant believes that this breadth of experience enhances the quality of consulting services provided to each client, while recognizing the importance of maintaining strict confidentiality and ethical boundaries between engagements.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">3. Information Barriers</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Consultant maintains strict information barriers between all client engagements. The following commitments apply:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Confidential information from one client will never be shared with, disclosed to, or used for the benefit of another client.</li>
              <li>Confidential information includes, but is not limited to, referral sources, referral volume data, market strategies, pricing structures, compensation models, staffing details, and organizational data.</li>
              <li>The Consultant maintains separate files, notes, and working materials for each client engagement.</li>
              <li>Strategies, recommendations, and deliverables are developed independently for each client based solely on that client's data, goals, and circumstances.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">4. Scope Limitations</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              When working with multiple organizations in overlapping or adjacent markets, the Consultant will adhere to the following scope limitations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>The Consultant will provide general best practices and industry knowledge to all clients equally. These include widely available industry benchmarks, regulatory guidance, and proven sales methodologies.</li>
              <li>Territory-specific strategies, referral source relationships, and competitive intelligence remain strictly confidential to each client.</li>
              <li>The Consultant will not facilitate introductions or share contacts between competing clients.</li>
              <li>Market-specific insights gained through one engagement will not be applied to benefit a competing organization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">5. Notification</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              If the Consultant becomes aware of a material conflict of interest that cannot be adequately managed through the information barriers described in this Disclosure, the Consultant will promptly notify the affected Organization in writing. Upon such notification, the Consultant may decline to undertake the conflicting engagement or, if the conflict arises during an existing engagement, may terminate the conflicting engagement. The Consultant will work with the Organization to ensure a smooth transition if termination becomes necessary.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">6. Client's Right to Terminate</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              If a conflict of interest arises that the Organization believes cannot be adequately managed through the information barriers and scope limitations described in this Disclosure, the Organization has the right to terminate the consulting engagement with fifteen (15) days written notice without penalty. In the event of such termination, the Organization shall only be responsible for fees and expenses incurred up to the effective date of termination, and the Consultant shall deliver all completed and in-progress deliverables.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">7. Ongoing Obligation</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              This Disclosure and the Consultant's obligations under it remain in effect for the duration of the consulting engagement and for twelve (12) months following its conclusion. During this period, the Consultant will continue to maintain all information barriers and confidentiality obligations with respect to the Organization's confidential information, regardless of whether the Consultant continues to provide services to other organizations in the same or adjacent markets.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">8. Acknowledgment</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              By signing below, the Organization acknowledges that it has received and reviewed this Conflict of Interest Disclosure. The Organization agrees that the existence of other client relationships does not, by itself, constitute a breach of any agreement or duty owed to the Organization by Spartan Coaching. The Organization further acknowledges that the Consultant's experience working with multiple hospice organizations contributes to the depth and quality of the consulting services provided.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">9. Contact Information</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              For questions about this Conflict of Interest Disclosure or to discuss any concerns regarding potential conflicts, please contact Spartan Coaching through the contact form on our website. We are committed to transparency and will address all inquiries promptly and professionally.
            </p>
          </section>
        </div>
      </FadeIn>

      <AgreementSignatureForm
        agreementType="Conflict of Interest Disclosure"
        agreementTitle="Conflict of Interest Disclosure"
      />
    </div>
  );
}
