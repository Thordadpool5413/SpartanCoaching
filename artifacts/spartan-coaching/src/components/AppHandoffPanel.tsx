import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  APP_STORE_URL,
  buildNativeAppOpenUrl,
  getWebAppFallbackPath,
  type AppHandoffDestination,
} from "@/lib/appHandoff";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";

export interface AppHandoffPanelProps {
  /** Public App Store fallback. */
  appStoreUrl?: string;
  /** Web destination when the visitor continues in the browser. */
  webAppUrl?: string;
  /** Native destination to request when Hospice Sales Pro is installed. */
  destination?: AppHandoffDestination;
  /** Overrides the generated native launch target when a source needs a fixed route. */
  openAppUrl?: string;
  /** Contextual title, e.g. "Take Hospice Sales Pro into the field" */
  title?: React.ReactNode;
  /** Contextual description */
  description?: React.ReactNode;
  /** Custom class names for the wrapper */
  className?: string;
  /** Determines if we show the panel in a compact layout */
  compact?: boolean;
}

export function AppHandoffPanel({
  appStoreUrl = APP_STORE_URL,
  webAppUrl,
  destination = "home",
  openAppUrl,
  title = "Hospice Sales Pro on iPhone",
  description = "Use the same account on web and iPhone, then reopen the right part of your field system when the next visit is in front of you.",
  className,
  compact = false,
}: AppHandoffPanelProps) {
  const [isIOS, setIsIOS] = useState(false);
  const nativeAppLink = openAppUrl ?? buildNativeAppOpenUrl(destination);
  const browserFallback = webAppUrl ?? getWebAppFallbackPath(destination);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setIsIOS(true);
    }
  }, []);

  return (
    <Card 
      className={cn(
        "relative overflow-hidden border border-border bg-card shadow-sm transition-all duration-300", 
        className
      )}
      data-testid="app-handoff-panel"
    >
      <div className="absolute inset-0 bg-spartan-gradient-radial opacity-10 pointer-events-none" />
      <div className={cn("relative z-10", compact ? "p-5 sm:p-6" : "p-8 sm:p-10")}>
        <div className={cn("flex flex-col md:flex-row gap-6 md:gap-10", compact ? "items-start" : "items-center")}>
          <div className="flex-1 space-y-3 sm:space-y-4">
            <h3 className={cn("font-display font-bold text-foreground leading-tight tracking-tight", compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")}>
              {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {description}
            </p>
            {!compact && (
              <ul className="space-y-2.5 mt-5">
                {[
                  "Daily execution workflows",
                  "Practice and planning between visits",
                  "One Hospice Sales Pro account"
                ].map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-foreground items-center font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={cn("flex flex-col gap-3 shrink-0", compact ? "w-full sm:w-auto" : "w-full md:w-[280px]")}>
            {isIOS ? (
              <Button
                asChild
                size="lg"
                className="w-full font-bold justify-start shadow-elite-red border-primary/20"
                data-testid="button-handoff-open-app"
              >
                <a
                  href={nativeAppLink}
                  onClick={() =>
                    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.appInterest, "handoff_open_app")
                  }
                >
                  <Smartphone className="mr-2.5 w-5 h-5" />
                  Open the iPhone app
                </a>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="w-full font-bold justify-start shadow-elite-red border-primary/20"
                data-testid="button-handoff-appstore"
              >
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.appInterest, "handoff_app_store")
                  }
                >
                  <Smartphone className="mr-2.5 w-5 h-5" />
                  Get the iPhone app
                </a>
              </Button>
            )}

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full font-bold justify-start bg-card hover:bg-muted/60"
              data-testid="button-handoff-webapp"
            >
              <Link
                href={browserFallback}
                onClick={() =>
                  trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "handoff_web_fallback")
                }
              >
                <Monitor className="mr-2.5 w-5 h-5" />
                {isIOS ? "Continue in a browser" : "Continue on web"}
              </Link>
            </Button>
            {isIOS && (
              <a
                href={appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.appInterest, "handoff_app_store_fallback")
                }
                className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-handoff-appstore-fallback"
              >
                View in the App Store
                <ExternalLink className="w-3 h-3" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
