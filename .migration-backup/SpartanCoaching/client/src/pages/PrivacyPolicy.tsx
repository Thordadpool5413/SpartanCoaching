import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn } from "@/components/animations";

export default function PrivacyPolicy() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <BackButton />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-4" data-testid="text-privacy-title">
          Privacy Policy
        </h1>
        <p className="text-body text-muted-foreground mb-10">
          Last Updated: February 2026
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-h2 text-foreground mb-3">1. Information We Collect</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              We collect personal information that you voluntarily provide to us when you use our website. This includes your name and email address when you submit a contact form or download resources. We also collect website usage analytics to understand how visitors interact with our site, including pages visited, time spent on pages, and general browsing patterns.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">2. How We Use Your Information</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              We use the information we collect to respond to your inquiries and provide the services you request, deliver requested resources such as training materials and guides, send coaching tips and updates if you have subscribed to our newsletter, and improve our services and website experience based on usage patterns and feedback.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">3. Information Sharing</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Spartan Coaching does not sell or share your personal data with third parties. We may share information only as needed for service delivery purposes, such as using third-party email delivery services to send you communications you have requested. Any service providers we work with are bound to protect your information and use it only for the purposes we specify.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">4. Cookies and Tracking</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Our website uses basic analytics to help us understand how visitors use the site and to improve the overall experience. We do not use third-party advertising trackers or sell your browsing data to advertisers. Any tracking we employ is solely for the purpose of improving our website and services for our users.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">5. Data Security</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              We implement reasonable measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. While no method of transmission over the Internet or method of electronic storage is completely secure, we strive to use commercially acceptable means to protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">6. Your Rights</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              You have the right to unsubscribe from our emails at any time by using the unsubscribe link included in every email we send. You may also request deletion of your personal data by contacting us through the contact form on our website or by emailing us directly. We will process your request in a timely manner and confirm when your data has been removed.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">7. Children's Privacy</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Our website and services are not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete that information as quickly as possible.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">8. Changes to This Policy</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              Spartan Coaching reserves the right to update or modify this Privacy Policy at any time. Changes will be effective immediately upon posting on this website. Your continued use of our website following the posting of changes constitutes your acceptance of those changes. We encourage you to review this page periodically to stay informed about how we protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-foreground mb-3">9. Contact Us</h2>
            <p className="text-body text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us through the contact form on our website or reach out to Spartan Coaching directly via email. We are committed to addressing your privacy concerns in a timely and professional manner.
            </p>
          </section>
        </div>
      </FadeIn>
    </div>
  );
}
