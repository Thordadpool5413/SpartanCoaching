import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn } from "@/components/animations";

export default function TermsOfService() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <BackButton />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-4" data-testid="text-terms-title">
          Terms of Service
        </h1>
        <p className="text-body text-muted-foreground mb-10">
          Last Updated: July 2026
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-h2 text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              By accessing or using the Spartan Coaching website, tools, and services, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you may not access or use our services. These terms apply to all visitors, users, and others who access our website or engage with our services.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">2. Description of Services</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Spartan Coaching provides consulting and educational services focused on hospice sales training, coaching, and professional development. Our services include one-on-one coaching, group training programs, AI-powered sales tools, downloadable resources, and educational content. Our services are consulting and educational in nature and do not constitute medical advice, legal advice, or any other form of licensed professional counsel. Nothing on this website or within our services should be interpreted as a substitute for the guidance of a qualified medical, legal, or financial professional.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">3. Use of Website</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Permitted Use:</strong> You may use this website and its tools for personal and professional development purposes related to hospice sales. You agree to use the website in compliance with all applicable laws and regulations.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Prohibited Use:</strong> You may not use this website or any of its content to engage in any unlawful activity, distribute malware, attempt to gain unauthorized access to our systems, reproduce or redistribute our proprietary content without written permission, or use our AI tools to generate content that is misleading, harmful, or misrepresents our services.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">4. Intellectual Property</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              All content on this website, including but not limited to text, graphics, logos, images, videos, audio recordings, training materials, downloadable resources, AI tool outputs, and the underlying software, is the property of Spartan Coaching or its content suppliers and is protected by applicable intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our content or services without prior written consent from Spartan Coaching.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">5. No Resale or Redistribution</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              All content made available through the Spartan Coaching website and services — including but not limited to articles, podcast episodes, downloadable resources, training materials, templates, AI tool outputs, and any printed or digital materials — is licensed for your personal, non-commercial use only.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">You may not:</strong> resell, sublicense, redistribute, republish, reproduce, or share this content in any form — whether in whole or in part, in print or digitally — without prior written consent from Spartan Coaching. This prohibition applies regardless of whether the content is accessed freely or as part of a paid engagement.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              Violations of this restriction may result in immediate termination of your access to Spartan Coaching services and may subject you to legal action under applicable intellectual property and copyright law. To request permission for any use beyond personal use, contact Spartan Coaching directly.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">6. Hospice Sales Pro &amp; Billing</h2>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Individual membership:</strong> When you subscribe to the individual
              Hospice Sales Pro plan, you authorize recurring charges of <strong className="text-foreground">$14.99 USD per week</strong>{" "}
              (or the then-current posted individual rate) via our payment processor (Stripe). Subscriptions renew
              automatically each week until you cancel.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Cancel anytime:</strong> Individual members may cancel through Account
              → Manage billing (Stripe Customer Portal). Cancellation takes effect at the end of the current paid
              period unless otherwise stated at checkout. You retain access through that period; no pro-rata refund is
              required for the remainder of a week already paid, except where required by law.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Provider / corporate seats:</strong> Multi-seat and provider accounts
              are priced as a weekly rate per end-user seat under a separate contract or written order. Seat counts,
              unit rates, invoice terms, and cancellation rules for those accounts are governed by that contract, not
              by the public individual self-serve price.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Failed payments:</strong> If a payment fails, we may suspend membership
              access until the payment method is updated or the account is otherwise restored. We may send email notices
              to the account email on file.
            </p>
            <p className="text-body text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Evaluation access:</strong> Timed evaluation (trial) access is
              complimentary or promotional and may end without conversion to a paid plan. Complimentary (“comp”) access
              may be granted at our discretion without a self-serve charge.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">7. AI Tools Disclaimer</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Spartan Coaching offers AI-powered tools designed to assist with sales training and professional development. Content generated by these tools is for educational and informational purposes only and should not be considered professional advice. AI-generated outputs may contain errors, omissions, or inaccuracies. Users are responsible for reviewing, verifying, and adapting any AI-generated content before applying it in professional settings. Spartan Coaching does not guarantee the accuracy, completeness, or suitability of AI-generated content for any specific purpose.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">8. User Submissions</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Any information, inquiries, or content you submit through our website, including contact forms, email communications, or AI tool inputs, grants Spartan Coaching permission to use that information to respond to your inquiry and provide relevant services. We will handle your personal information in accordance with our Privacy Policy. By submitting information, you represent that you have the right to share such information and that it does not violate any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">9. Third-Party Links</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Our website may contain links to third-party websites, services, or resources that are not owned or controlled by Spartan Coaching. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that Spartan Coaching shall not be responsible or liable for any damage or loss caused by or in connection with the use of any such third-party content, goods, or services.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">10. Limitation of Liability</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              To the fullest extent permitted by applicable law, Spartan Coaching and its owner, employees, affiliates, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) our services, any conduct or content of any third party on the services, or unauthorized access, use, or alteration of your information.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">11. Indemnification</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              You agree to defend, indemnify, and hold harmless Spartan Coaching and its owner, employees, contractors, and affiliates from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of and access to the website and services, your violation of these Terms of Service, or your violation of any third-party right, including without limitation any intellectual property or privacy right.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">12. Changes to Terms</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Spartan Coaching reserves the right to modify or replace these Terms of Service at any time at our sole discretion. If a revision is material, we will make reasonable efforts to provide notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our services after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">13. Contact Information</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through the contact form on our website or reach out to Spartan Coaching directly. We are committed to addressing your concerns in a timely and professional manner.
            </p>
          </section>
        </div>
      </FadeIn>
    </div>
  );
}
