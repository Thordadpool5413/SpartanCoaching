import { AccentText } from "@/components/AccentText";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn } from "@/components/animations";
import { AgreementSignatureForm } from "@/components/AgreementSignatureForm";

export default function HipaaBAA() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <BackButton />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-4" data-testid="text-baa-title"><AccentText>HIPAA Business Associate Agreement</AccentText></h1>
        <p className="text-body text-muted-foreground mb-10">
          Last Updated: February 2026
        </p>

        <div className="space-y-8">
          <section>
            <p className="text-body text-muted-foreground leading-relaxed">
              This HIPAA Business Associate Agreement ("BAA" or "Agreement") is entered into by and between Spartan Coaching ("Business Associate") and the entity or individual engaging Spartan Coaching's services ("Covered Entity"), collectively referred to as the "Parties." This Agreement supplements and is made a part of the underlying services agreement between the Parties.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>1. Purpose</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              The purpose of this Agreement is to ensure that the Business Associate will appropriately safeguard Protected Health Information ("PHI") that may be created, received, maintained, or transmitted on behalf of the Covered Entity in compliance with the Health Insurance Portability and Accountability Act of 1996 ("HIPAA"), the Health Information Technology for Economic and Clinical Health Act ("HITECH Act"), and their implementing regulations, including the HIPAA Privacy Rule (45 CFR Part 160 and Subparts A and E of Part 164), the HIPAA Security Rule (45 CFR Part 160 and Subparts A and C of Part 164), and the HIPAA Breach Notification Rule (45 CFR Part 160 and Subparts A and D of Part 164).
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>2. Definitions</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              Terms used but not otherwise defined in this Agreement shall have the same meaning as those terms in the HIPAA Rules. The following definitions apply to this Agreement:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Protected Health Information (PHI):</strong> Individually identifiable health information transmitted or maintained in any form or medium, as defined in 45 CFR 160.103.</li>
              <li><strong className="text-foreground">Electronic Protected Health Information (ePHI):</strong> PHI that is transmitted by or maintained in electronic media, as defined in 45 CFR 160.103.</li>
              <li><strong className="text-foreground">Breach:</strong> The acquisition, access, use, or disclosure of PHI in a manner not permitted under the HIPAA Privacy Rule that compromises the security or privacy of the PHI, as defined in 45 CFR 164.402.</li>
              <li><strong className="text-foreground">Security Incident:</strong> The attempted or successful unauthorized access, use, disclosure, modification, or destruction of information or interference with system operations in an information system, as defined in 45 CFR 164.304.</li>
              <li><strong className="text-foreground">Business Associate:</strong> Spartan Coaching, which performs certain functions or activities on behalf of, or provides certain services to, the Covered Entity that involve the use or disclosure of PHI.</li>
              <li><strong className="text-foreground">Covered Entity:</strong> The hospice organization, healthcare provider, or health plan engaging the services of Spartan Coaching.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>3. Obligations of the Business Associate</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Business Associate agrees to the following obligations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Not use or disclose PHI other than as permitted or required by this Agreement, the underlying services agreement, or as required by law.</li>
              <li>Implement appropriate administrative, physical, and technical safeguards to prevent the unauthorized use or disclosure of PHI, including implementing requirements of the HIPAA Security Rule with respect to ePHI.</li>
              <li>Report to the Covered Entity any use or disclosure of PHI not provided for by this Agreement of which the Business Associate becomes aware, including any Breach of Unsecured PHI as required by 45 CFR 164.410.</li>
              <li>In accordance with 45 CFR 164.502(e)(1)(ii), ensure that any subcontractors that create, receive, maintain, or transmit PHI on behalf of the Business Associate agree to the same restrictions and conditions that apply to the Business Associate with respect to such PHI.</li>
              <li>Make available PHI in accordance with 45 CFR 164.524, to the extent the Business Associate has PHI in a Designated Record Set, to satisfy the Covered Entity's obligations to provide individuals with access to their PHI.</li>
              <li>Make available PHI for amendment and incorporate any amendments to PHI in accordance with 45 CFR 164.526, to the extent the Business Associate has PHI in a Designated Record Set.</li>
              <li>Make available the information required to provide an accounting of disclosures in accordance with 45 CFR 164.528.</li>
              <li>Make its internal practices, books, and records relating to the use and disclosure of PHI available to the Secretary of the Department of Health and Human Services for purposes of determining the Covered Entity's compliance with HIPAA.</li>
              <li>At termination of this Agreement, return or destroy all PHI received from, or created or received on behalf of, the Covered Entity. If such return or destruction is not feasible, the protections of this Agreement shall extend to such PHI and the Business Associate shall limit further uses and disclosures to those purposes that make the return or destruction infeasible.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>4. Permitted Uses and Disclosures</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Business Associate is permitted to use and disclose PHI as follows:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>As necessary to perform services for, or on behalf of, the Covered Entity as specified in the underlying services agreement, including but not limited to sales consulting, coaching, training, and performance analysis.</li>
              <li>For the proper management and administration of the Business Associate or to carry out the legal responsibilities of the Business Associate, provided that any disclosures are required by law or the Business Associate obtains reasonable assurances from the person to whom the information is disclosed that it will be held confidentially.</li>
              <li>To de-identify PHI in accordance with 45 CFR 164.514(a)-(c). De-identified information is not subject to the terms of this Agreement.</li>
              <li>To provide data aggregation services relating to the healthcare operations of the Covered Entity, if permitted by the underlying services agreement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>5. Obligations of the Covered Entity</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Covered Entity agrees to the following obligations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Provide the Business Associate with the notice of privacy practices produced by the Covered Entity in accordance with 45 CFR 164.520, as well as any changes or limitations to such notice.</li>
              <li>Notify the Business Associate of any restrictions on the use or disclosure of PHI that the Covered Entity has agreed to or is required to abide by under 45 CFR 164.522.</li>
              <li>Notify the Business Associate of any changes in, or revocation of, the permission by an individual to use or disclose their PHI, to the extent that such changes may affect the Business Associate's use or disclosure of PHI.</li>
              <li>Not request the Business Associate to use or disclose PHI in any manner that would not be permissible under HIPAA if done by the Covered Entity, except for uses and disclosures permitted under Sections 4(b) and 4(c) of this Agreement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>6. Breach Notification</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              In the event of a Breach of Unsecured PHI, the Business Associate shall:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Notify the Covered Entity without unreasonable delay, and in no case later than thirty (30) calendar days after discovery of the Breach.</li>
              <li>Include in the notification the identification of each individual whose Unsecured PHI has been, or is reasonably believed to have been, accessed, acquired, used, or disclosed during the Breach, to the extent known.</li>
              <li>Provide the Covered Entity with any other available information that the Covered Entity is required to include in notification to the individual under 45 CFR 164.404(c), as such information becomes available.</li>
              <li>Cooperate with the Covered Entity in investigating the Breach and in meeting the Covered Entity's obligations under the Breach Notification Rule.</li>
              <li>Mitigate, to the extent practicable, any harmful effect that is known to the Business Associate of a use or disclosure of PHI by the Business Associate in violation of the requirements of this Agreement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>7. Security Measures</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Business Associate shall implement and maintain reasonable and appropriate security measures, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Access controls to limit access to ePHI to authorized personnel only.</li>
              <li>Encryption of ePHI at rest and in transit where technically feasible and appropriate.</li>
              <li>Regular assessment and management of risks to the confidentiality, integrity, and availability of ePHI.</li>
              <li>Implementation of policies and procedures to ensure the workforce complies with HIPAA requirements.</li>
              <li>Maintenance of audit controls to record and examine activity in information systems that contain or use ePHI.</li>
              <li>Contingency plans to respond to emergencies or other occurrences that could damage systems containing ePHI.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>8. Term and Termination</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Term:</strong> This Agreement shall be effective as of the date both Parties execute the underlying services agreement and shall terminate when all PHI provided by the Covered Entity to the Business Associate, or created or received by the Business Associate on behalf of the Covered Entity, is destroyed or returned to the Covered Entity, or if not feasible, protections are extended in accordance with Section 3 of this Agreement.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Termination for Cause:</strong> Either Party may terminate this Agreement and the underlying services agreement if it determines that the other Party has violated a material term of this Agreement. The non-breaching Party shall provide the breaching Party with written notice of the violation and an opportunity to cure within thirty (30) days. If the breach is not cured within the cure period, the non-breaching Party may terminate this Agreement.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Effect of Termination:</strong> Upon termination of this Agreement, the Business Associate shall return or destroy all PHI received from the Covered Entity, or created or received on behalf of the Covered Entity. This provision shall apply to PHI that is in the possession of subcontractors or agents of the Business Associate. The Business Associate shall retain no copies of the PHI unless return or destruction is infeasible.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>9. Miscellaneous Provisions</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Amendment:</strong> This Agreement may not be modified or amended except in writing signed by both Parties. The Parties agree to negotiate in good faith any amendment to this Agreement that may be necessary to ensure compliance with HIPAA and its implementing regulations.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Survival:</strong> The obligations of the Business Associate under Sections 3 and 6 of this Agreement shall survive the termination of this Agreement to the extent that the Business Associate continues to maintain PHI.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Regulatory References:</strong> Any reference in this Agreement to a section of HIPAA or its implementing regulations means the section as in effect or as amended from time to time.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Governing Law:</strong> This Agreement shall be governed by and construed in accordance with applicable federal law, including HIPAA and the HITECH Act. To the extent not preempted by federal law, the laws of the state in which the Covered Entity is located shall apply.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>10. Contact Information</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              For questions about this HIPAA Business Associate Agreement, to request execution of a BAA, or to report a potential Breach, please contact Spartan Coaching through the contact form on our website or reach out directly. We are committed to maintaining the privacy and security of all Protected Health Information entrusted to us and will respond to all inquiries promptly.
            </p>
          </section>
        </div>
      </FadeIn>

      <AgreementSignatureForm
        agreementType="HIPAA Business Associate Agreement"
        agreementTitle="HIPAA Business Associate Agreement"
      />
    </div>
  );
}
