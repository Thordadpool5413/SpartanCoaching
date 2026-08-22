import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Home() {
  return (
    <div className="approved-home" data-testid="approved-home">
      <SEO />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: "Spartan Coaching",
            url: "https://spartanhospicecoaching.com",
            founder: { "@type": "Person", name: "Nick Lynch" },
            serviceType: ["Hospice Growth Consulting", "Hospice Sales Training"],
            areaServed: "US",
          })}
        </script>
      </Helmet>

      <section className="approved-home-hero" data-testid="section-hero">
        <div className="approved-home-shell approved-home-hero-grid">
          <div className="approved-home-copy">
            <h1 data-testid="text-home-hero-title">
              Executive authority
              <br />
              that closes the gap<span aria-hidden="true">.</span>
            </h1>
            <p className="approved-home-lead">
              Nick Lynch helps hospice leaders turn conversations into admissions and growth with ethics,
              clarity, and a repeatable system.
            </p>
            <p className="approved-home-founded">
              Founded by Nick Lynch. Built from real hospice growth leadership.
            </p>
            <div className="approved-home-actions">
              <Link className="approved-home-primary" href="/contact" data-testid="button-hero-contact">
                <span>Book a Strategy Call</span>
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link className="approved-home-secondary" href="/hospice-sales-pro" data-testid="button-hero-product">
                <span>Explore Hospice Sales Pro</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="approved-home-mark" aria-hidden="true">
            <img src="/spartan-helmet.png" alt="" width="980" height="602" />
          </div>
        </div>
      </section>

      <section className="approved-home-paths" aria-label="Choose your path" data-testid="section-offers">
        <div className="approved-home-shell approved-home-path-grid">
          <article>
            <p className="approved-home-path-label">Path One</p>
            <h2>Executive Strategy Call</h2>
            <span className="approved-home-rule" aria-hidden="true" />
            <p>A focused conversation to solve your biggest growth challenges and align on a clear path forward.</p>
            <Link href="/contact">
              <span>Book a Strategy Call</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </article>

          <article>
            <p className="approved-home-path-label">Path Two</p>
            <h2>Hospice Sales Pro</h2>
            <span className="approved-home-rule" aria-hidden="true" />
            <p>The system your team uses every day to run conversations, stay consistent, and win more admissions.</p>
            <div className="approved-home-tier">
              <img src="/spartan-helmet.png" alt="" width="32" height="24" />
              <strong>Elite</strong>
              <span>Recommended</span>
            </div>
            <p className="approved-home-standard">Standard available</p>
            <Link href="/hospice-sales-pro">
              <span>Explore Hospice Sales Pro</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
