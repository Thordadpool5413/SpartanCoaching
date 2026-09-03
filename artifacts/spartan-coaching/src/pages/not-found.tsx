import { AccentText } from "@/components/AccentText";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { FadeIn } from "@/components/animations";
import { Home, Briefcase, Wrench, Mail } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Services", href: "/services", icon: Briefcase },
  { label: "Tools", href: "/tools", icon: Wrench },
  { label: "Contact", href: "/contact", icon: Mail },
];

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <SEO
        title="Page Not Found - Spartan Coaching"
        description="The page you are looking for does not exist. Return to Spartan Coaching to access expert hospice sales training and tools."
        keywords="404, page not found, error page"
        ogImage="/spartan-logo.png"
        noIndex
      />
      <FadeIn>
        <div className="text-center max-w-lg mx-auto">
          <h1 className="text-9xl font-black text-primary mb-4" data-testid="text-404"><AccentText>404</AccentText></h1>
          <h2 className="text-h2 font-bold text-foreground mb-4" data-testid="text-not-found-title"><AccentText>Page Not Found</AccentText></h2>
          <p className="text-body-lg text-muted-foreground mb-10 max-w-md mx-auto" data-testid="text-not-found-description">
            This page does not exist or may have been moved. Here are some places to get started.
          </p>

          <Card className="spacing-card" data-testid="card-quick-links">
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="outline"
                  asChild
                  className="font-semibold justify-start gap-2"
                  data-testid={`link-404-${link.label.toLowerCase()}`}
                >
                  <Link href={link.href}>
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </FadeIn>
    </div>
  );
}
