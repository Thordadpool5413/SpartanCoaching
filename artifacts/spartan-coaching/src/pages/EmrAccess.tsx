import { AccentText } from "@/components/AccentText";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn } from "@/components/animations";
import { AgreementSignatureForm } from "@/components/AgreementSignatureForm";

export default function EmrAccess() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <BackButton />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-4" data-testid="text-emr-access-title"><AccentText>EMR/Data Access Agreement</AccentText></h1>
        <p className="text-body text-muted-foreground mb-10">
          Last Updated: February 2026
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>1. Parties</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              This EMR/Data Access Agreement ("Agreement") is entered into by and between Spartan Coaching ("Consultant") and the hospice organization engaging the Consultant's services ("Organization"), collectively referred to as the "Parties." This Agreement governs the Consultant's access to the Organization's electronic systems and data in connection with the consulting engagement.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>2. Purpose</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              The purpose of this Agreement is to establish terms and conditions for the Consultant's access to the Organization's Electronic Medical Records (EMR) system and other data systems for the purpose of providing consulting services, including sales performance analysis, workflow optimization, and training. This Agreement supplements and is made a part of the underlying services agreement between the Parties.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>3. Scope of Access</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              Access granted under this Agreement is limited to the specific modules, systems, and data as mutually agreed upon in the Statement of Work or consulting engagement letter. The following terms apply:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Access is restricted to data and system areas necessary for the consulting engagement.</li>
              <li>Common EMR platforms that the Consultant may access include, but are not limited to, Axxess, MatrixCare, WellSky, Enhabit, and others as specified by the Organization.</li>
              <li>The Organization retains sole discretion over the level of access provided and may modify or restrict access at any time.</li>
              <li>Access does not imply ownership of, or any proprietary rights to, the Organization's data or systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>4. Credential Management</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Organization will provide the Consultant with unique login credentials for all authorized systems. The Consultant agrees to the following credential management obligations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Not share login credentials with any third party, including other Consultant personnel not authorized under this Agreement.</li>
              <li>Use multi-factor authentication (MFA) where available and as required by the Organization's security policies.</li>
              <li>Log out of all systems after each session and not leave sessions unattended while logged in.</li>
              <li>Immediately report any suspected compromise of credentials to the Organization's designated IT contact.</li>
              <li>Use strong, unique passwords that comply with the Organization's password policies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>5. Permitted Use</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Consultant is permitted to access the Organization's systems for the following purposes in connection with the consulting engagement:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>View referral and admission data for sales performance analysis and reporting.</li>
              <li>Review workflow processes to identify opportunities for optimization and improvement.</li>
              <li>Analyze territory and market data to support strategic planning and growth initiatives.</li>
              <li>Support training and coaching activities by reviewing relevant operational data and metrics.</li>
              <li>Any access to Protected Health Information (PHI) is governed by the separate HIPAA Business Associate Agreement (BAA) between the Parties.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>6. Prohibited Use</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Consultant shall not engage in any of the following activities when accessing the Organization's systems:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Modify, alter, or delete any patient records or clinical documentation.</li>
              <li>Export or download patient-level data without prior written authorization from the Organization.</li>
              <li>Access clinical records, treatment plans, or medical information beyond the scope of the consulting engagement.</li>
              <li>Use any data obtained from the Organization's systems for purposes outside the scope of the consulting engagement.</li>
              <li>Attempt to access system areas, modules, or data not explicitly authorized under this Agreement.</li>
              <li>Install any software, plugins, or extensions on the Organization's systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>7. Security Requirements</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Consultant shall adhere to the following security requirements when accessing the Organization's systems:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Access systems only from secure, trusted networks. Public or unsecured Wi-Fi networks shall not be used without a VPN or equivalent encryption.</li>
              <li>Use only encrypted devices (laptops, tablets, or other endpoints) when accessing the Organization's systems.</li>
              <li>Keep all operating systems, browsers, and security software current with the latest patches and updates.</li>
              <li>Do not store EMR data, screenshots, or system exports on personal devices unless explicitly authorized in writing.</li>
              <li>Comply with all of the Organization's IT security policies, acceptable use policies, and any additional security requirements communicated by the Organization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>8. Audit and Monitoring</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Organization retains the right to monitor and audit the Consultant's access to its systems. The following terms apply:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>The Organization may monitor, log, and audit all system access by the Consultant at any time and without prior notice.</li>
              <li>The Consultant will cooperate fully with any audit requests, including providing information about access patterns, devices used, and data viewed.</li>
              <li>Access logs may be reviewed periodically or in response to a suspected security incident.</li>
              <li>The Organization may suspend or revoke access immediately if any unauthorized or suspicious activity is detected.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>9. Termination of Access</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              Access to the Organization's systems under this Agreement shall terminate under the following conditions:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li>Access terminates automatically upon completion or termination of the consulting engagement, whichever occurs first.</li>
              <li>The Organization should disable or revoke the Consultant's credentials within twenty-four (24) hours of the termination of the consulting engagement.</li>
              <li>Upon termination, the Consultant will immediately cease all access to the Organization's systems and return or securely destroy any downloaded materials, reports, or data obtained from the systems.</li>
              <li>The Consultant will provide written confirmation of the return or destruction of all materials upon request.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>10. Liability</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Consultant Liability:</strong> The Consultant shall be liable for any unauthorized access, data breaches, or security incidents resulting from the Consultant's negligence, willful misconduct, or failure to comply with the terms of this Agreement.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Limitations:</strong> The Consultant shall not be held liable for system outages, data loss, or service interruptions caused by the Organization, the Organization's technology vendors, or third-party breaches that are outside the Consultant's control. The Organization is responsible for maintaining the security and integrity of its own systems and for promptly disabling access upon termination of the engagement.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3"><AccentText>11. Contact Information</AccentText></h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              For questions about this EMR/Data Access Agreement, to request modifications to access permissions, or to report a security concern, please contact Spartan Coaching through the contact form on our website. We are committed to maintaining the security and confidentiality of all data accessed during our consulting engagements.
            </p>
          </section>
        </div>
      </FadeIn>

      <AgreementSignatureForm
        agreementType="EMR/Data Access Agreement"
        agreementTitle="EMR/Data Access Agreement"
      />
    </div>
  );
}
