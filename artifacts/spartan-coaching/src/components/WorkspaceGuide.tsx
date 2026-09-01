import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Crosshair, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: Wrench,
    title: "Explore Tools",
    body: "Choose the outcome and open one focused workspace.",
    href: "/tools",
  },
  {
    icon: Crosshair,
    title: "Try Command",
    body: "Plan the conversation, then capture the next commitment.",
    href: "/tools/sales-workflow",
  },
  {
    icon: BookOpen,
    title: "View Resources",
    body: "Use a current script, checklist, template, or guide.",
    href: "/resources",
  },
];

export function WorkspaceGuide() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <Card
      className="mb-8 border border-primary/25 bg-card p-5 sm:p-6"
      data-testid="workspace-guide"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-primary">
            Start here
          </p>
          <h2 className="mt-1 text-xl font-black text-foreground">
            Three steps to finish useful work
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Choose a job, complete it in one workspace, then keep the result in
            My Work.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label="Dismiss workspace guide"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, body, href }, index) => (
          <li
            key={title}
            className="min-w-0 rounded-xl border border-border/75 bg-background/50 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-black text-foreground">
              <Icon className="h-4 w-4 text-primary" />
              {index + 1}. {title}
            </div>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              {body}
            </p>
            <Link
              href={href}
              className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Open <ArrowRight className="h-4 w-4" />
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
