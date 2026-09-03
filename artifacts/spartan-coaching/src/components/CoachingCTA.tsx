import { AccentText } from "@/components/AccentText";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachingCTAProps {
  className?: string;
}

export function CoachingCTA({ className }: CoachingCTAProps) {
  return (
    <Card className={cn("spacing-card border-2 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6", className)}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">Ready to go deeper?</p>
        <h3 className="text-h3 font-bold text-foreground mb-1"><AccentText>Take This Further With Nick</AccentText></h3>
        <p className="text-body text-muted-foreground leading-relaxed">
          Apply this to your specific territory and situation with direct, personalized coaching.
        </p>
      </div>
      <div className="shrink-0">
        <Button asChild size="lg" className="font-bold group w-full sm:w-auto" data-testid="button-coaching-cta">
          <Link href="/contact">
            <span>Get In Touch</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
