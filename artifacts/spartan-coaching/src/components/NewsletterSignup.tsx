import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CONSENT_COPY } from "@/lib/complianceCopy";
import { Mail, CheckCircle } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/newsletter/subscribe", { email });

      setIsSubscribed(true);
      toast({
        title: "Subscribed",
        description: CONSENT_COPY.newsletterSuccess,
      });
      setEmail("");
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle className="w-5 h-5 shrink-0" />
        <span className="font-medium text-sm leading-snug">{CONSENT_COPY.newsletterSuccess}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-md">
      <p className="text-xs text-muted-foreground leading-snug">{CONSENT_COPY.newsletterExplicit}</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 min-h-[48px] text-base"
          disabled={isLoading}
          data-testid="input-newsletter-email"
          aria-label="Email for optional coaching updates"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="whitespace-nowrap touch-manipulation"
          data-testid="button-newsletter-subscribe"
        >
          <Mail className="w-4 h-4 mr-2" />
          {isLoading ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>
      <p className="text-[11px] text-muted-foreground leading-snug">
        Optional marketing email only. See the{" "}
        <Link href="/trust" className="text-primary font-semibold hover:underline">
          Trust Center
        </Link>
        .
      </p>
    </div>
  );
}
