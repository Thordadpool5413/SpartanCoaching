import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn } from "@/components/animations";
import { AgreementSignatureForm } from "@/components/AgreementSignatureForm";

export default function NDA() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <BackButton />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-4" data-testid="text-nda-title">
          Non-Disclosure Agreement
        </h1>
        <p className="text-body text-muted-foreground mb-10">
          Last Updated: February 2026
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-h2 text-foreground mb-3">1. Parties</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              This Mutual Non-Disclosure Agreement ("Agreement" or "NDA") is entered into by and between Spartan Coaching and the entity or individual engaging Spartan Coaching's services, each of whom may be referred to as a "Disclosing Party" or a "Receiving Party" depending on the context in which confidential information is shared, and collectively referred to as the "Parties." This Agreement is mutual in nature, meaning that both Parties may disclose and receive confidential information under its terms.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">2. Purpose</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              The purpose of this Agreement is to facilitate the exchange of confidential and proprietary information between the Parties for the purpose of evaluating, negotiating, and engaging in consulting services related to hospice sales training, coaching, and professional development. Both Parties acknowledge that the disclosure of certain confidential information is necessary to enable the Consultant to provide effective and customized services to the Client.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">3. Definition of Confidential Information</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              For the purposes of this Agreement, "Confidential Information" means any and all non-public information disclosed by either Party to the other, whether in written, oral, electronic, or visual form, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Business Strategies:</strong> Marketing plans, growth strategies, operational plans, organizational structures, and competitive analyses.</li>
              <li><strong className="text-foreground">Financial Data:</strong> Revenue figures, pricing structures, fee schedules, budgets, financial projections, and billing information.</li>
              <li><strong className="text-foreground">Patient Data:</strong> Any patient-related information that may be shared in the course of consulting, which is subject to the Health Insurance Portability and Accountability Act (HIPAA) and applicable state privacy laws.</li>
              <li><strong className="text-foreground">Referral Source Lists:</strong> Contact information, relationship details, and referral patterns related to physicians, facilities, and other referral sources.</li>
              <li><strong className="text-foreground">Proprietary Methodologies:</strong> Sales frameworks, coaching techniques, assessment tools, and performance measurement systems developed by either Party.</li>
              <li><strong className="text-foreground">Training Materials:</strong> Curricula, presentations, handouts, scripts, templates, and other educational content.</li>
              <li><strong className="text-foreground">Trade Secrets:</strong> Any information that derives independent economic value from not being generally known to the public or to competitors.</li>
              <li><strong className="text-foreground">Other Confidential Information:</strong> Any information that is marked as "Confidential," "Proprietary," or with a similar designation, or that a reasonable person would understand to be confidential given the nature of the information and the circumstances of disclosure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">4. Obligations of Receiving Party</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Receiving Party agrees to the following obligations with respect to the Disclosing Party's Confidential Information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Hold all Confidential Information in strict confidence and protect it from unauthorized disclosure, access, or use.</li>
              <li>Use the Confidential Information solely for the purpose set forth in this Agreement and not for any other purpose without the prior written consent of the Disclosing Party.</li>
              <li>Not disclose, publish, or disseminate the Confidential Information to any third party without the prior written consent of the Disclosing Party.</li>
              <li>Limit access to the Confidential Information to those employees, agents, contractors, and advisors who have a legitimate need to know such information in connection with the purpose of this Agreement, and who are bound by confidentiality obligations at least as restrictive as those contained herein.</li>
              <li>Use at least the same degree of care to protect the Disclosing Party's Confidential Information as the Receiving Party uses to protect its own confidential information, but in no event less than reasonable care.</li>
              <li>Promptly notify the Disclosing Party upon discovery of any unauthorized use or disclosure of Confidential Information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">5. Exclusions</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The obligations set forth in this Agreement shall not apply to any information that the Receiving Party can demonstrate:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Was publicly available or became publicly available through no fault, act, or omission of the Receiving Party.</li>
              <li>Was already known to the Receiving Party at the time of disclosure, as evidenced by written records predating the disclosure.</li>
              <li>Was independently developed by the Receiving Party without reference to or use of the Disclosing Party's Confidential Information, as evidenced by written records.</li>
              <li>Was rightfully received by the Receiving Party from a third party without restriction on disclosure and without breach of any obligation of confidentiality.</li>
              <li>Is required to be disclosed by applicable law, regulation, court order, or governmental authority, provided that the Receiving Party gives the Disclosing Party prompt written notice of such requirement (to the extent legally permitted) and cooperates with the Disclosing Party's efforts to seek a protective order or other appropriate remedy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">6. Term</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">General Obligations:</strong> The confidentiality obligations set forth in this Agreement shall survive for a period of three (3) years following the date of each disclosure of Confidential Information, unless a longer period is required by applicable law.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Trade Secrets:</strong> Notwithstanding the foregoing, any Confidential Information that constitutes a trade secret under applicable law shall be protected indefinitely, for so long as the information continues to qualify as a trade secret.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">7. Return of Materials</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Upon termination or expiration of this Agreement, or upon the written request of the Disclosing Party, the Receiving Party shall, within thirty (30) days, return to the Disclosing Party or destroy all documents, materials, and other tangible manifestations of the Confidential Information, including all copies, reproductions, summaries, analyses, and extracts thereof. The Receiving Party shall certify in writing that all such materials have been returned or destroyed. Notwithstanding the foregoing, the Receiving Party may retain one archival copy of the Confidential Information solely for the purpose of monitoring compliance with this Agreement, provided that such copy remains subject to the confidentiality obligations herein.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">8. No License</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Nothing in this Agreement shall be construed as granting, either expressly or by implication, estoppel, or otherwise, any license, right, title, or interest in or to any intellectual property, trade secret, patent, copyright, trademark, or other proprietary right of the Disclosing Party. All Confidential Information remains the exclusive property of the Disclosing Party, and no transfer of ownership or rights is intended or effected by this Agreement.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">9. Remedies</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Both Parties acknowledge and agree that any breach or threatened breach of this Agreement may cause irreparable harm to the Disclosing Party for which monetary damages alone would be an inadequate remedy. Accordingly, in addition to any other remedies available at law or in equity, the Disclosing Party shall be entitled to seek injunctive relief, specific performance, or other equitable relief, without the necessity of proving actual damages or posting a bond or other security. The pursuit of equitable remedies shall not limit the Disclosing Party's right to pursue any other remedies available under law, including the recovery of monetary damages.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">10. Governing Law</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              This Agreement shall be governed by and construed in accordance with the laws of the state in which the Client is located, without regard to its conflict of laws principles. Any disputes arising under or in connection with this Agreement shall be resolved through good faith negotiation between the Parties. If the Parties are unable to resolve a dispute through negotiation, either Party may pursue resolution through mediation or, if necessary, binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">11. Contact Information</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              For questions about this Non-Disclosure Agreement, to request execution of an NDA, or to discuss confidentiality concerns, please contact Spartan Coaching through the contact form on our website. We take the protection of confidential information seriously and will respond to all inquiries promptly.
            </p>
          </section>
        </div>
      </FadeIn>

      <AgreementSignatureForm
        agreementType="Non-Disclosure Agreement (NDA)"
        agreementTitle="Non-Disclosure Agreement"
      />
    </div>
  );
}
