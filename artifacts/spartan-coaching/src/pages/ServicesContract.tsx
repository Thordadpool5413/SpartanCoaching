import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn } from "@/components/animations";
import { AgreementSignatureForm } from "@/components/AgreementSignatureForm";

export default function ServicesContract() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <BackButton />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-4" data-testid="text-contract-title">
          Services Contract Agreement
        </h1>
        <p className="text-body text-muted-foreground mb-10">
          Last Updated: February 2026
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-h2 text-foreground mb-3">1. Parties</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              This Services Contract Agreement ("Agreement") is entered into by and between Spartan Coaching ("Consultant") and the entity or individual engaging Spartan Coaching's services ("Client"), collectively referred to as the "Parties." This Agreement establishes the terms and conditions under which the Consultant will provide professional consulting services to the Client.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">2. Scope of Services</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              The Consultant agrees to provide the following professional services to the Client, as further detailed in any applicable Statement of Work ("SOW"):
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Sales Consulting:</strong> Strategic guidance on hospice sales processes, referral development, and market positioning.</li>
              <li><strong className="text-foreground">Coaching:</strong> One-on-one and group coaching sessions for sales professionals and leadership teams.</li>
              <li><strong className="text-foreground">Training:</strong> Customized training programs covering sales techniques, objection handling, compliance, and professional development.</li>
              <li><strong className="text-foreground">Performance Analysis:</strong> Assessment of current sales performance metrics, identification of areas for improvement, and development of actionable recommendations.</li>
              <li><strong className="text-foreground">Strategy Development:</strong> Creation of comprehensive sales strategies, territory plans, and growth roadmaps tailored to the Client's market.</li>
            </ul>
            <p className="text-body text-muted-foreground leading-relaxed mt-3">
              Specific deliverables, timelines, and milestones shall be determined and documented in the applicable Statement of Work, which shall be incorporated into and governed by this Agreement.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">3. Term and Schedule</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Effective Date:</strong> This Agreement shall become effective upon execution by both Parties and shall remain in effect for the initial term as specified in the applicable Statement of Work.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Renewal:</strong> Upon expiration of the initial term, this Agreement may be renewed by mutual written agreement of both Parties. Renewal terms, including any changes to fees or scope of services, shall be documented in a new or amended Statement of Work.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Scheduling:</strong> All coaching sessions, training sessions, and consulting engagements shall be scheduled at mutually agreed-upon times. The Consultant will make reasonable efforts to accommodate the Client's scheduling preferences and business needs.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">4. Fees and Payment</h2>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Fee Structure:</strong> Fees for services shall be as outlined in the applicable Statement of Work. Fees may be structured on a per-session, monthly retainer, or per-engagement basis as agreed upon by both Parties.</li>
              <li><strong className="text-foreground">Invoicing:</strong> The Consultant shall invoice the Client monthly or per engagement, as specified in the Statement of Work. Each invoice shall include a detailed description of services rendered during the billing period.</li>
              <li><strong className="text-foreground">Payment Terms:</strong> Payment is due within thirty (30) days of the invoice date. All payments shall be made in U.S. dollars via the payment method agreed upon by the Parties.</li>
              <li><strong className="text-foreground">Late Payments:</strong> Any payments not received within the specified payment period shall be subject to a late fee of one and one-half percent (1.5%) per month on the outstanding balance, or the maximum rate permitted by applicable law, whichever is less.</li>
              <li><strong className="text-foreground">Travel Expenses:</strong> If on-site services are requested by the Client, the Client shall be responsible for all reasonable travel expenses incurred by the Consultant, including transportation, lodging, and meals. Such expenses shall be pre-approved by the Client and invoiced separately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">5. Cancellation and Rescheduling</h2>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Individual Sessions:</strong> The Client must provide at least twenty-four (24) hours advance notice to cancel or reschedule an individual coaching or consulting session.</li>
              <li><strong className="text-foreground">Group and Team Training:</strong> The Client must provide at least forty-eight (48) hours advance notice to cancel or reschedule group or team training sessions.</li>
              <li><strong className="text-foreground">Late Cancellations:</strong> Cancellations made without the required advance notice may be billed at the full session rate. The Consultant reserves the right to waive this fee at their discretion for extenuating circumstances.</li>
              <li><strong className="text-foreground">Consultant Cancellations:</strong> In the event the Consultant must cancel a session, the Consultant will provide as much advance notice as possible and reschedule the session at a mutually convenient time at no additional cost to the Client.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">6. Confidentiality</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              Both Parties acknowledge that during the course of this engagement, each Party may have access to confidential and proprietary information belonging to the other Party. Both Parties agree to the following confidentiality obligations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Consultant Obligations:</strong> The Consultant shall not disclose, share, or use the Client's proprietary data, patient information, business strategies, financial information, referral source lists, or any other confidential information for any purpose other than the performance of services under this Agreement.</li>
              <li><strong className="text-foreground">Client Obligations:</strong> The Client shall not disclose, share, or reproduce the Consultant's proprietary methods, frameworks, training materials, pricing structures, or business strategies without prior written consent from the Consultant.</li>
              <li><strong className="text-foreground">Survival:</strong> The confidentiality obligations set forth in this section shall survive the termination or expiration of this Agreement for a period of three (3) years.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">7. Independent Contractor</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              The Consultant is an independent contractor and is not an employee, agent, partner, or joint venturer of the Client. The Consultant shall be solely responsible for all taxes, insurance, and other obligations arising from the Consultant's status as an independent contractor. Nothing in this Agreement shall be construed to create an employer-employee relationship between the Parties. The Consultant retains the right to perform services for other clients, provided such services do not create a conflict of interest or breach the confidentiality provisions of this Agreement.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">8. Intellectual Property</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Ownership:</strong> Spartan Coaching retains all intellectual property rights, including copyrights, trademarks, and trade secrets, in and to all methods, frameworks, training materials, templates, tools, and other proprietary content developed by or on behalf of the Consultant, whether created before or during the engagement.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              <strong className="text-foreground">License:</strong> During the term of this Agreement, the Client is granted a non-exclusive, non-transferable, revocable license to use the Consultant's materials solely for internal business purposes directly related to the engagement. This license does not include the right to modify, reproduce for distribution, sell, or sublicense any of the Consultant's materials. Upon termination of this Agreement, the Client's license to use the Consultant's materials shall cease unless otherwise agreed in writing.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">9. Limitation of Liability</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Cap on Liability:</strong> The Consultant's total aggregate liability arising out of or related to this Agreement shall not exceed the total fees paid by the Client to the Consultant during the twelve (12) months immediately preceding the event giving rise to the claim.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Exclusion of Damages:</strong> In no event shall the Consultant be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, loss of business, loss of data, or loss of goodwill, regardless of whether such damages were foreseeable or whether the Consultant was advised of the possibility of such damages. The services provided by the Consultant are advisory in nature, and the Client acknowledges that results may vary based on implementation, market conditions, and other factors beyond the Consultant's control.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">10. Termination</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Termination for Convenience:</strong> Either Party may terminate this Agreement at any time by providing thirty (30) days written notice to the other Party. Written notice may be provided via email to the contact information on file.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Payment Upon Termination:</strong> Upon termination, the Client shall pay the Consultant for all services rendered and expenses incurred through the effective date of termination. Any prepaid fees for services not yet rendered shall be refunded on a pro-rata basis.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Termination for Cause:</strong> Either Party may terminate this Agreement immediately upon written notice if the other Party materially breaches any provision of this Agreement and fails to cure such breach within fifteen (15) days after receiving written notice of the breach.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">11. Indemnification</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Each Party agrees to indemnify, defend, and hold harmless the other Party and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to the indemnifying Party's negligence, willful misconduct, or breach of any term or condition of this Agreement. This indemnification obligation shall survive the termination or expiration of this Agreement.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">12. Governing Law</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              This Agreement shall be governed by and construed in accordance with the laws of the state in which the Client is located, without regard to its conflict of laws principles. Any disputes arising under or in connection with this Agreement shall be resolved through good faith negotiation between the Parties. If the Parties are unable to resolve a dispute through negotiation, either Party may pursue resolution through mediation or, if necessary, binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">13. Entire Agreement</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              This Agreement, together with any applicable Statement of Work, constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, representations, warranties, and understandings, whether written or oral, relating to such subject matter. No amendment, modification, or waiver of any provision of this Agreement shall be effective unless made in writing and signed by both Parties. The failure of either Party to enforce any provision of this Agreement shall not constitute a waiver of that Party's right to enforce that provision or any other provision in the future.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">14. Contact Information</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              For questions about this Services Contract Agreement, to request a Statement of Work, or to discuss engagement terms, please contact Spartan Coaching through the contact form on our website. We are committed to establishing clear, transparent, and mutually beneficial consulting relationships and will respond to all inquiries promptly.
            </p>
          </section>
        </div>
      </FadeIn>

      <AgreementSignatureForm
        agreementType="Services Contract Agreement"
        agreementTitle="Services Contract Agreement"
      />
    </div>
  );
}
