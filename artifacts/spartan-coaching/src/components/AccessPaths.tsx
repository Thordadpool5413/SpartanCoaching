import { Link } from "wouter";
import { ArrowRight, User, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRICING_FACTS } from "@/lib/complianceCopy";

/**
 * Clear dual access model: self-serve individual vs team/evaluation.
 * Prevents Home/TrustStrip contradiction.
 */
export function AccessPaths({ className }: { className?: string }) {
  return (
    <section
      className={cn("w-full", className)}
      data-testid="section-access-paths"
      aria-label="How to get Hospice Sales Pro access"
    >
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <p className="text-kicker justify-center">Two clear paths</p>
        <h2 className="text-h2 text-foreground font-display">
          How Hospice Sales Pro access works
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Individuals self-serve. Teams and evaluations request access — so pricing never feels mixed up.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
        <Card className="p-6 space-y-4 h-full flex flex-col" data-testid="access-path-individual">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-primary mb-1">
              Path A · Individual · {PRICING_FACTS.productName}
            </p>
            <h3 className="text-lg font-display font-bold text-foreground">
              Create account → subscribe
            </h3>
          </div>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed flex-1">
            <li>Create your account</li>
            <li>
              Start {PRICING_FACTS.productName} at {PRICING_FACTS.individualWeeklyLabel} (cancel anytime)
            </li>
            <li>Unlock live tools the same day — web + iOS</li>
          </ol>
          <Button asChild className="font-bold w-full sm:w-auto">
            <Link href="/register">
              Create account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>
        <Card className="p-6 space-y-4 h-full flex flex-col" data-testid="access-path-team">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">
              Path B · Team / evaluation
            </p>
            <h3 className="text-lg font-display font-bold text-foreground">
              Request → approve → trial
            </h3>
          </div>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed flex-1">
            <li>Request team or evaluation access</li>
            <li>Nick reviews and opens a timed evaluation</li>
            <li>Continue under team contract when it fits</li>
          </ol>
          <Button asChild variant="outline" className="font-bold w-full sm:w-auto">
            <Link href="/request-access">
              Request team access
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>
    </section>
  );
}
