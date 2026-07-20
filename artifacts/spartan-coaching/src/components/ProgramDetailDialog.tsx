import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckIcon } from "@/components/icons";
import { Target, Lightbulb, Rocket, Award } from "lucide-react";
import { CoachingCTA } from "@/components/CoachingCTA";

export interface ProgramDetail {
  title: string;
  description: string;
  why: {
    problem: string;
    impact: string;
  };
  delivery: {
    approach: string;
    phases: {
      name: string;
      description: string;
    }[];
  };
  outcomes: string[];
  whoItsFor: string;
  deliverables: string[];
}

interface ProgramDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: ProgramDetail | null;
}

export function ProgramDetailDialog({
  open,
  onOpenChange,
  program,
}: ProgramDetailDialogProps) {
  if (!program) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-[#0d0d0d] dark:border-white/10" data-testid="dialog-program-detail">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-foreground">
            {program.title}
          </DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground pt-2">
            {program.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 pt-6">
          {/* The Why */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">The Why</h3>
            </div>
            <Card className="bg-muted/50">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-foreground mb-2">The Problem</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {program.why.problem}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">The Impact</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {program.why.impact}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* The Delivery */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">The Delivery</h3>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {program.delivery.approach}
              </p>
              <div className="space-y-3">
                {program.delivery.phases.map((phase, idx) => (
                  <Card key={idx} className="bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground mb-1">{phase.name}</h4>
                        <p className="text-sm text-muted-foreground">{phase.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Expected Outcomes */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">Expected Outcomes</h3>
            </div>
            <ul className="space-y-3">
              {program.outcomes.map((outcome, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{outcome}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Who It's For */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">Who It's For</h3>
            </div>
            <Card className="bg-primary/5">
              <p className="text-muted-foreground leading-relaxed">
                {program.whoItsFor}
              </p>
            </Card>
          </section>

          {/* All Deliverables */}
          <section>
            <h3 className="text-xl font-bold text-foreground mb-4">All Deliverables</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {program.deliverables.map((deliverable, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{deliverable}</span>
                </div>
              ))}
            </div>
          </section>

          <CoachingCTA />

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="touch-manipulation"
              data-testid="button-close-detail"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
