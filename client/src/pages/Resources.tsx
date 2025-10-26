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
        <Card className="hover-elevate transition-all">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <DownloadIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Quick Start Guide
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your first 30 days as a hospice liaison—everything you need to hit the ground running.
              </p>
              <Link href="/resources/quick-start-guide">
                <Button variant="outline" className="font-bold" data-testid="button-download-guide">
                  Download PDF
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="hover-elevate transition-all">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <DownloadIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Objection Response Cards
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Pocket-sized response cards for the 8 most common hospice objections.
              </p>
              <Link href="/resources/objection-cards">
                <Button variant="outline" className="font-bold" data-testid="button-download-cards">
                  Download PDF
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="hover-elevate transition-all">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <DownloadIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Territory Planning Template
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Map your market, prioritize accounts, and build your weekly route.
              </p>
              <Link href="/resources/territory-template">
                <Button variant="outline" className="font-bold" data-testid="button-download-template">
                  Download PDF
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="hover-elevate transition-all">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <DownloadIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Metrics Dashboard
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track referrals, conversions, and start-of-care speed in one simple view.
              </p>
              <Link href="/resources/metrics-dashboard">
                <Button variant="outline" className="font-bold" data-testid="button-download-dashboard">
                  Download PDF
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
