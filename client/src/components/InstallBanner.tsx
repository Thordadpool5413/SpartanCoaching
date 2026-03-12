import { useState, useEffect } from "react";
import { X, Share } from "lucide-react";

const STORAGE_KEY = "spartan-install-dismissed";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (
    ("standalone" in navigator && (navigator as any).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      isIOS() &&
      !isInStandaloneMode() &&
      !localStorage.getItem(STORAGE_KEY)
    ) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <div
      className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-40 lg:hidden bg-background border rounded-lg shadow-lg p-3 flex items-start gap-3 animate-slide-in-up"
      role="banner"
      data-testid="banner-install"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground leading-tight mb-0.5">
          Install Spartan Coaching
        </p>
        <p className="text-xs text-muted-foreground leading-snug">
          Tap <Share className="inline w-3 h-3 mx-0.5 align-text-bottom" /> then{" "}
          <span className="font-medium">Add to Home Screen</span> for the best experience.
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 text-muted-foreground hover:text-foreground touch-manipulation"
        aria-label="Dismiss"
        data-testid="button-dismiss-install-banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
