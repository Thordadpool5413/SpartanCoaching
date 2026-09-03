import { AccentText } from "@/components/AccentText";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Crosshair, FolderCheck, Wrench } from "lucide-react";
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
    title: "Use Resources",
    body: "Open a field-ready script, checklist, template, or guide.",
    href: "/resources",
  },
  {
    icon: FolderCheck,
    title: "Keep the Result",
    body: "Return to saved work and continue on web or iPhone.",
    href: "/my-work",
  },
];

export function WorkspaceGuide() {
  return (
    <Card
      className="workspace-guide mb-7 border border-primary/25 bg-card p-5 sm:p-6"
      data-testid="workspace-guide"
    >
      <div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-primary">
            How the workspace works
          </p>
          <h2 className="mt-1 text-xl font-black text-foreground">
            <span className="sr-only">One system. Four clear moves.</span>
            <span aria-hidden="true"><AccentText>One system. Four clear moves.</AccentText></span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Command runs the day. Tools finish a specific job. Resources provide
            field-ready structure. My Work keeps the result connected.
          </p>
        </div>
      </div>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
