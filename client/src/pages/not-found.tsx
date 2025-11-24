import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

export default function NotFound() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <SEO 
        title="Page Not Found - Spartan Coaching"
        description="The page you're looking for doesn't exist. Return to Spartan Coaching to access expert hospice sales training and tools."
        keywords="404, page not found, error page"
        ogImage="/spartan-logo.png"
        canonical={`${baseUrl}/`}
      />
      <div className="text-center">
        <h1 className="text-9xl font-black text-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold text-foreground mb-4">Page Not Found</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist. Let's get you back on track.
        </p>
        <Button asChild size="lg" className="font-bold">
          <Link href="/" data-testid="button-home">
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
