import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadIcon } from "@/components/icons";

export default function Resources() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  const resources = [
    {
      title: "Quick Start Guide",
      description: "Your first 30 days as a hospice liaison—everything you need to hit the ground running.",
      cta: "Download PDF",
      link: "/resources/quick-start-guide",
    },
    {
      title: "Objection Response Cards",
      description: "Pocket-sized response cards for the 8 most common hospice objections.",
      cta: "Download PDF",
      link: "/resources/objection-cards",
    },
    {
      title: "Territory Planning Template",
      description: "Map your market, prioritize accounts, and build your weekly route.",
      cta: "Download PDF",
      link: "/resources/territory-template",
    },
    {
      title: "Metrics Dashboard",
      description: "Track referrals, conversions, and start-of-care speed in one simple view.",
      cta: "Download PDF",
      link: "/resources/metrics-dashboard",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4" data-testid="text-resources-title">
          Field-Ready Resources
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Download these field-tested PDF templates to bring clarity, structure, and discipline to your sales process.
        </p>
      </div>

      {/* Spartan Weekly Plan */}
      <Card className="bg-gradient-to-br from-primary/10 to-destructive/10 mb-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Get The Spartan Weekly Plan PDF
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              A one-page tool to define your objective, set daily priorities, track key metrics like referrals and start-of-care speed, and plan your recovery. Delivered instantly to your inbox.
            </p>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                  data-testid="input-email"
                />
                <Button type="submit" className="font-bold whitespace-nowrap" data-testid="button-get-plan">
                  Get The Plan
                </Button>
              </form>
            ) : (
              <div className="bg-primary/20 border border-primary rounded-lg p-4">
                <p className="text-foreground font-semibold mb-2" data-testid="text-success">
                  ✓ Success! Check your inbox for the Spartan Weekly Plan PDF.
                </p>
                <Link href="/resources/weekly-plan">
                  <Button variant="outline" size="sm" className="font-bold">
                    Or View It Now →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Additional Resources */}
      <div className="grid md:grid-cols-2 gap-6">
        {resources.map((resource, idx) => (
          <Card key={idx} className="hover-elevate transition-all" data-testid={`card-resource-${idx}`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <DownloadIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">{resource.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {resource.description}
                </p>
                <Button
                  asChild
                  className="w-full font-bold"
                  data-testid={`button-resource-${idx}`}
                  onClick={() => {
                    // Track resource access
                    fetch('/api/analytics/resource-access', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        resourceName: resource.title,
                        timestamp: Date.now()
                      })
                    }).catch(console.error);
                  }}
                >
                  <Link href={resource.link}>{resource.cta}</Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}