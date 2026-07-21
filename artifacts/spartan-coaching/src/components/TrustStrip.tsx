import { Link } from "wouter";
import { Shield, Lock, UserCheck, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ITEMS = [
  {
    icon: Shield,
    title: "No PHI in tools",
    body: "Field Kit is for planning and messaging — never patient identifiers or clinical records.",
  },
  {
    icon: UserCheck,
    title: "Request → approve → trial",
    body: "Access is not self-serve checkout. Nick reviews every request, then opens a timed evaluation.",
  },
  {
    icon: Lock,
    title: "Manual paid activation",
    body: "No Stripe on the site. Membership continues by conversation and invoice after evaluation.",
  },
  {
    icon: FileCheck,
    title: "Privacy & compliance first",
    body: "Clear data practices, ethics boundaries, and a BAA path for corporate accounts.",
  },
];

interface TrustStripProps {
  className?: string;
  compact?: boolean;
  showLinks?: boolean;
}

/** Public credibility strip — privacy, access model, consulting posture. */
export function TrustStrip({ className, compact = false, showLinks = true }: TrustStripProps) {
  return (
    <section
      className={cn(
        "border border-white/10 dark:bg-[#0a0a0a]/80 rounded-2xl",
        compact ? "p-5 sm:p-6" : "p-6 sm:p-8",
        className,
      )}
      data-testid="section-trust-strip"
      aria-label="Trust and access practices"
    >
      {!compact && (
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-red-400 uppercase mb-3">How we work with you</p>
          <h2 className="text-h3 font-display font-bold text-foreground mb-2">
            A consulting practice — not a self-serve SaaS checkout
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Field Kit is private. Coaching is human. You request access; we approve, evaluate, and activate when it is a fit.
          </p>
        </div>
      )}

      <div
        className={cn(
          "grid gap-4",
          compact ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {DEFAULT_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex gap-3 sm:flex-col sm:gap-2"
              data-testid={`trust-item-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showLinks && (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 pt-5 border-t border-white/8 text-xs">
          <Link href="/compliance" className="text-muted-foreground hover:text-primary transition-colors font-medium">
            Compliance &amp; data practices
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors font-medium">
            Privacy policy
          </Link>
          <Link href="/request-access" className="text-primary hover:underline font-bold">
            Request Field Kit access
          </Link>
          <Link href="/field-kit-membership" className="text-muted-foreground hover:text-primary transition-colors font-medium">
            Membership path
          </Link>
        </div>
      )}
    </section>
  );
}
