import { Component, type ErrorInfo, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/PageShell";
import { StateBlock } from "@/components/StateBlock";
import { cn } from "@/lib/utils";

export function PageLoadingState({
  label = "Loading page",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 py-12 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="page-loading-state"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

type RouteErrorBoundaryProps = {
  children: ReactNode;
  resetKey: string;
};

type RouteErrorBoundaryState = {
  failed: boolean;
};

/**
 * Keeps one bad route chunk or page render from turning the full application blank.
 * Navigation clears the error boundary, while a reload can recover a stale chunk.
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route failed to render", error, info);
  }

  componentDidUpdate(previousProps: RouteErrorBoundaryProps) {
    if (this.state.failed && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <PageShell width="sm" className="min-h-[60vh] flex items-center">
        <div className="w-full">
          <h1 className="sr-only">We could not load this page</h1>
          <StateBlock
            variant="error"
            title="We could not load this page"
            description="Your account, subscription, and saved work are unchanged. Refresh this page, or return to a safe starting point."
          >
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Button type="button" onClick={() => window.location.reload()}>
                Refresh page
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href="/">Go to homepage</a>
              </Button>
            </div>
          </StateBlock>
        </div>
      </PageShell>
    );
  }
}