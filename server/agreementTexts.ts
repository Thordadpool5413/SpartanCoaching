export const AGREEMENT_TEXTS: Record<string, { title: string; sections: Array<{ heading?: string; body: string }> }> = {
  "Services Contract Agreement": {
    title: "Services Contract Agreement",
    sections: [
      { heading: "1. Parties", body: 'This Services Contract Agreement ("Agreement") is entered into by and between Spartan Coaching ("Consultant") and the entity or individual engaging Spartan Coaching\'s services ("Client"), collectively referred to as the "Parties." This Agreement establishes the terms and conditions under which the Consultant will provide professional consulting services to the Client.' },
      { heading: "2. Scope of Services", body: "The Consultant agrees to provide the following professional services to the Client, as further detailed in any applicable Statement of Work (\"SOW\"):\n\n- Sales Consulting: Strategic guidance on hospice sales processes, referral development, and market positioning.\n- Coaching: One-on-one and group coaching sessions for sales professionals and leadership teams.\n- Training: Customized training programs covering sales techniques, objection handling, compliance, and professional development.\n- Performance Analysis: Assessment of current sales performance metrics, identification of areas for improvement, and development of actionable recommendations.\n- Strategy Development: Creation of comprehensive sales strategies, territory plans, and growth roadmaps tailored to the Client's market.\n\nSpecific deliverables, timelines, and milestones shall be determined and documented in the applicable Statement of Work, which shall be incorporated into and governed by this Agreement." },
      { heading: "3. Term and Schedule", body: "Effective Date: This Agreement shall become effective upon execution by both Parties and shall remain in effect for the initial term as specified in the applicable Statement of Work.\n\nRenewal: Upon expiration of the initial term, this Agreement may be renewed by mutual written agreement of both Parties.\n\nScheduling: All coaching sessions, training sessions, and consulting engagements shall be scheduled at mutually agreed-upon times." },
      { heading: "4. Fees and Payment", body: "- Fee Structure: Fees for services shall be as outlined in the applicable Statement of Work.\n- Invoicing: The Consultant shall invoice the Client monthly or per engagement.\n- Payment Terms: Payment is due within thirty (30) days of the invoice date.\n- Late Payments: Any payments not received within the specified payment period shall be subject to a late fee of one and one-half percent (1.5%) per month on the outstanding balance.\n- Travel Expenses: If on-site services are requested, the Client shall be responsible for all reasonable travel expenses." },
      { heading: "5. Cancellation and Rescheduling", body: "- Individual Sessions: 24 hours advance notice required.\n- Group and Team Training: 48 hours advance notice required.\n- Late Cancellations: May be billed at the full session rate.\n- Consultant Cancellations: Will be rescheduled at no additional cost." },
      { heading: "6. Confidentiality", body: "Both Parties acknowledge that during the course of this engagement, each Party may have access to confidential and proprietary information. The Consultant shall not disclose the Client's proprietary data, and the Client shall not disclose the Consultant's proprietary methods. Confidentiality obligations survive for three (3) years." },
      { heading: "7. Independent Contractor", body: "The Consultant is an independent contractor and is not an employee, agent, partner, or joint venturer of the Client." },
      { heading: "8. Intellectual Property", body: "Spartan Coaching retains all intellectual property rights in its methods, frameworks, and training materials. The Client is granted a non-exclusive, non-transferable, revocable license to use the Consultant's materials solely for internal business purposes." },
      { heading: "9. Limitation of Liability", body: "The Consultant's total aggregate liability shall not exceed the total fees paid during the twelve (12) months preceding the event giving rise to the claim. Neither party shall be liable for indirect, incidental, special, consequential, or punitive damages." },
      { heading: "10. Termination", body: "Either Party may terminate with thirty (30) days written notice. Upon termination, the Client shall pay for all services rendered. Either Party may terminate immediately for material breach not cured within fifteen (15) days." },
      { heading: "11. Indemnification", body: "Each Party agrees to indemnify, defend, and hold harmless the other Party from and against any claims arising out of negligence, willful misconduct, or breach of this Agreement." },
      { heading: "12. Governing Law", body: "This Agreement shall be governed by the laws of the state in which the Client is located. Disputes shall be resolved through negotiation, mediation, or binding arbitration." },
      { heading: "13. Entire Agreement", body: "This Agreement constitutes the entire agreement between the Parties. No amendment shall be effective unless in writing and signed by both Parties." },
    ],
  },

  "HIPAA Business Associate Agreement": {
    title: "HIPAA Business Associate Agreement",
    sections: [
      { body: 'This HIPAA Business Associate Agreement ("BAA") is entered into by and between Spartan Coaching ("Business Associate") and the entity or individual engaging Spartan Coaching\'s services ("Covered Entity").' },
      { heading: "1. Purpose", body: "The purpose of this Agreement is to ensure that the Business Associate will appropriately safeguard Protected Health Information (\"PHI\") in compliance with HIPAA, the HITECH Act, and their implementing regulations." },
      { heading: "2. Definitions", body: "- Protected Health Information (PHI): Individually identifiable health information transmitted or maintained in any form.\n- Electronic Protected Health Information (ePHI): PHI in electronic media.\n- Breach: Unauthorized acquisition, access, use, or disclosure of PHI.\n- Security Incident: Attempted or successful unauthorized access to information systems.\n- Business Associate: Spartan Coaching.\n- Covered Entity: The hospice organization or healthcare provider engaging services." },
      { heading: "3. Obligations of the Business Associate", body: "The Business Associate agrees to:\n- Not use or disclose PHI except as permitted\n- Implement appropriate administrative, physical, and technical safeguards\n- Report unauthorized use or disclosure of PHI\n- Ensure subcontractors agree to the same restrictions\n- Make PHI available for individual access per 45 CFR 164.524\n- Support amendment of PHI per 45 CFR 164.526\n- Provide accounting of disclosures per 45 CFR 164.528\n- Make records available to HHS for compliance determination\n- Return or destroy all PHI at termination" },
      { heading: "4. Permitted Uses and Disclosures", body: "The Business Associate may use and disclose PHI as necessary to perform services, for proper management and administration, to de-identify PHI, and to provide data aggregation services." },
      { heading: "5. Obligations of the Covered Entity", body: "The Covered Entity agrees to provide notice of privacy practices, notify of restrictions, notify of changes in individual permissions, and not request impermissible uses." },
      { heading: "6. Breach Notification", body: "In the event of a Breach, the Business Associate shall notify the Covered Entity within thirty (30) calendar days, identify affected individuals, provide required information, cooperate in investigation, and mitigate harmful effects." },
      { heading: "7. Security Measures", body: "The Business Associate shall implement access controls, encryption, regular risk assessments, workforce compliance policies, audit controls, and contingency plans." },
      { heading: "8. Term and Termination", body: "This Agreement is effective upon execution and terminates when all PHI is returned or destroyed. Either Party may terminate for material breach with thirty (30) days written notice and opportunity to cure." },
      { heading: "9. Miscellaneous", body: "Amendment requires written agreement. Obligations under Sections 3 and 6 survive termination. Governed by applicable federal law including HIPAA and the HITECH Act." },
    ],
  },

  "Non-Disclosure Agreement (NDA)": {
    title: "Non-Disclosure Agreement (NDA)",
    sections: [
      { heading: "1. Parties", body: 'This Mutual Non-Disclosure Agreement ("NDA") is entered into by Spartan Coaching and the engaging entity, each a "Disclosing Party" or "Receiving Party" as context requires.' },
      { heading: "2. Purpose", body: "To facilitate the exchange of confidential information for evaluating and engaging in consulting services related to hospice sales training, coaching, and professional development." },
      { heading: "3. Definition of Confidential Information", body: "Confidential Information includes:\n- Business Strategies: Marketing plans, growth strategies, operational plans\n- Financial Data: Revenue figures, pricing, budgets, projections\n- Patient Data: Subject to HIPAA and applicable privacy laws\n- Referral Source Lists: Contact information and referral patterns\n- Proprietary Methodologies: Sales frameworks, coaching techniques, assessment tools\n- Training Materials: Curricula, presentations, templates\n- Trade Secrets: Information deriving value from not being generally known\n- Other: Information marked as Confidential or reasonably understood to be confidential" },
      { heading: "4. Obligations of Receiving Party", body: "The Receiving Party shall hold all Confidential Information in strict confidence, use it solely for the stated purpose, not disclose to third parties, limit access to those with need-to-know, use reasonable care in protection, and promptly notify of unauthorized disclosure." },
      { heading: "5. Exclusions", body: "Obligations do not apply to information that was publicly available, already known, independently developed, rightfully received from third parties, or required by law." },
      { heading: "6. Term", body: "Confidentiality obligations survive for three (3) years following disclosure. Trade secrets are protected indefinitely." },
      { heading: "7. Return of Materials", body: "Upon termination or request, the Receiving Party shall return or destroy all Confidential Information within thirty (30) days and certify in writing." },
      { heading: "8. No License", body: "Nothing in this Agreement grants any license or rights in intellectual property." },
      { heading: "9. Remedies", body: "Breach may cause irreparable harm; the Disclosing Party may seek injunctive relief without proving actual damages." },
      { heading: "10. Governing Law", body: "Governed by the laws of the state in which the Client is located. Disputes resolved through negotiation, mediation, or arbitration." },
    ],
  },

  "EMR/Data Access Agreement": {
    title: "EMR/Data Access Agreement",
    sections: [
      { heading: "1. Parties", body: 'This EMR/Data Access Agreement is entered into by Spartan Coaching ("Consultant") and the hospice organization ("Organization").' },
      { heading: "2. Purpose", body: "Establishes terms for the Consultant's access to EMR systems and other data systems for consulting services including sales performance analysis, workflow optimization, and training." },
      { heading: "3. Scope of Access", body: "Access is limited to specific modules and data as agreed. Common platforms include Axxess, MatrixCare, WellSky, Enhabit. The Organization retains sole discretion over access levels." },
      { heading: "4. Credential Management", body: "The Organization provides unique credentials. The Consultant shall not share credentials, use MFA where available, log out after sessions, report suspected compromises, and use strong passwords." },
      { heading: "5. Permitted Use", body: "Access is permitted for: viewing referral and admission data, reviewing workflow processes, analyzing territory and market data, supporting training activities. PHI access is governed by the separate BAA." },
      { heading: "6. Prohibited Use", body: "The Consultant shall not: modify or delete patient records, export patient-level data without authorization, access clinical records beyond scope, use data outside the engagement scope, access unauthorized system areas, or install software." },
      { heading: "7. Security Requirements", body: "The Consultant shall use secure networks only, encrypted devices, current software, and comply with IT security policies. EMR data shall not be stored on personal devices without authorization." },
      { heading: "8. Audit and Monitoring", body: "The Organization may monitor and audit all access, review logs, and suspend access if unauthorized activity is detected." },
      { heading: "9. Termination of Access", body: "Access terminates upon completion of engagement. Credentials should be revoked within 24 hours. The Consultant shall cease access and return or destroy all materials." },
      { heading: "10. Liability", body: "The Consultant is liable for unauthorized access resulting from negligence. The Consultant is not liable for system issues caused by the Organization or third parties." },
    ],
  },

  "Conflict of Interest Disclosure": {
    title: "Conflict of Interest Disclosure",
    sections: [
      { heading: "1. Purpose", body: "To transparently disclose potential conflicts of interest when Spartan Coaching provides consulting services to multiple hospice organizations in overlapping or adjacent markets." },
      { heading: "2. Disclosure", body: "Spartan Coaching provides consulting services to multiple hospice organizations. It is possible that the Consultant may work with organizations in the same or adjacent service areas." },
      { heading: "3. Information Barriers", body: "The Consultant maintains strict information barriers:\n- Confidential information from one client will never be shared with another\n- Separate files and working materials for each engagement\n- Strategies developed independently based solely on each client's data" },
      { heading: "4. Scope Limitations", body: "General best practices and industry knowledge are shared equally. Territory-specific strategies, referral relationships, and competitive intelligence remain confidential. No introductions or contacts shared between competing clients." },
      { heading: "5. Notification", body: "If a material conflict cannot be managed, the Consultant will promptly notify the affected Organization and may decline or terminate the conflicting engagement." },
      { heading: "6. Client's Right to Terminate", body: "The Organization may terminate with fifteen (15) days written notice without penalty if the conflict cannot be managed." },
      { heading: "7. Ongoing Obligation", body: "Obligations remain in effect during engagement and for twelve (12) months following conclusion." },
      { heading: "8. Acknowledgment", body: "By signing, the Organization acknowledges this disclosure and agrees that the existence of other client relationships does not constitute a breach." },
    ],
  },

  "Liability Waiver / Hold Harmless Agreement": {
    title: "Liability Waiver / Hold Harmless Agreement",
    sections: [
      { heading: "1. Parties", body: 'This Liability Waiver and Hold Harmless Agreement is entered into by Spartan Coaching ("Consultant") and the engaging entity ("Client").' },
      { heading: "2. Purpose", body: "To limit liability and establish risk acknowledgment for consulting services including on-site visits, training sessions, coaching engagements, and strategy implementation." },
      { heading: "3. Assumption of Risk", body: "Client acknowledges that sales consulting involves recommendations implemented at Client's discretion. Results may vary. Client assumes full responsibility for evaluating recommendations." },
      { heading: "4. On-Site Activities", body: "Client provides a safe working environment. Consultant is responsible for own safety during transit. Neither party liable for the other's injuries from normal business activities." },
      { heading: "5. No Guaranteed Outcomes", body: "Consultant makes no guarantees regarding business outcomes, referral increases, revenue growth, or patient census improvements. All projections are for educational and informational purposes only." },
      { heading: "6. Implementation Responsibility", body: "Client is solely responsible for implementing strategies and ensuring compliance with:\n- CMS Conditions of Participation\n- State Licensure Requirements\n- Anti-Kickback Statutes\n- Additional applicable regulations" },
      { heading: "7. Hold Harmless", body: "Client agrees to hold harmless Spartan Coaching from claims arising from implementation of recommendations. Spartan Coaching agrees to hold harmless the Client from claims arising from Consultant's negligence on premises." },
      { heading: "8. Insurance", body: "Consultant maintains professional liability insurance. Client is encouraged to maintain appropriate insurance coverage." },
      { heading: "9. Limitation of Liability", body: "Total liability limited to fees paid during the preceding twelve (12) months. Neither party liable for indirect, incidental, consequential, special, or punitive damages." },
      { heading: "10. Severability", body: "Invalid provisions shall be modified to the minimum extent necessary while preserving the original intent." },
    ],
  },

  "Testimonial / Case Study Release": {
    title: "Testimonial / Case Study Release",
    sections: [
      { heading: "1. Purpose", body: 'This Agreement grants Spartan Coaching permission to use the Client\'s testimonials, case study results, and related information for marketing and promotional purposes.' },
      { heading: "2. Grant of Permission", body: "Client grants a non-exclusive, royalty-free, perpetual license to use:\n- Testimonials and quotes\n- Case study results and performance metrics\n- Organization name and logo (if separately approved)\n- Before/after performance data (may be anonymized)" },
      { heading: "3. Approved Use", body: "Content may be used in website testimonials, social media, marketing brochures, presentations, case studies, white papers, promotional emails, and newsletters." },
      { heading: "4. Review and Approval", body: "Client receives draft content for review with ten (10) business days to approve, request changes, or decline. No content published without written approval." },
      { heading: "5. Anonymity Options", body: "Attribution options include:\n- Full Attribution: Organization name, contact name, and title\n- Partial Attribution: First name and state only\n- Anonymous: Industry description only\n- Custom Attribution: As mutually agreed" },
      { heading: "6. HIPAA Compliance", body: "No testimonial or case study will include any Protected Health Information (PHI). All metrics presented in aggregate form only." },
      { heading: "7. Revocation", body: "Client may revoke with thirty (30) days written notice. Content will be removed within sixty (60) days. Previously distributed materials may remain in circulation but will not be redistributed." },
      { heading: "8. Compensation", body: "No compensation is provided for testimonials or case study participation. Participation is entirely voluntary." },
    ],
  },
};
