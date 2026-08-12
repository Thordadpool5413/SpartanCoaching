import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackProductOutcome } from "@/lib/analytics";

/**
 * Bridge after Stripe Checkout.
 * Web: lands on portal with activation ceremony.
 * iOS (opened from mobile checkout): tries app deep link, falls back to portal.
 */
export default function CheckoutReturn() {
  const search = useSearch();
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fromApp = params.get("from") === "app" || params.get("open") === "app";
  const { refresh, canUseFieldKit } = useAuth();
  const [triedApp, setTriedApp] = useState(false);

  useEffect(() => {
    void refresh();
    // Product outcome — no free text; identity from session on server
    trackProductOutcome("subscription_start", {
      surface: fromApp ? "ios_return" : "web",
      source: "checkout_return",
    });
  }, [refresh, fromApp]);

  useEffect(() => {
    if (!fromApp || triedApp) return;
    setTriedApp(true);
    // Custom scheme used by Expo app (see app.config.js)
    const deep = "spartan-coaching-mobile://account?activated=1";
    try {
      window.location.href = deep;
    } catch {
      // ignore
    }
  }, [fromApp, triedApp]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 text-center gap-6">
      <SEO title="Checkout complete | Hospice Sales Pro" noIndex />
      <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Hospice Sales Pro</p>
      <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground max-w-lg">
        {canUseFieldKit ? "You're in" : "Payment received"}
      </h1>
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
        {fromApp
          ? "Return to the app to continue — if it did not open automatically, tap the button below or switch back to Hospice Sales Pro."
          : "Opening your portal. Tools unlock as soon as billing confirms (usually a few seconds)."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {fromApp ? (
          <Button asChild size="lg" className="font-bold" data-testid="checkout-open-app">
            <a href="spartan-coaching-mobile://account?activated=1">Open app</a>
          </Button>
        ) : null}
        <Button asChild size="lg" variant={fromApp ? "outline" : "default"} className="font-bold">
          <Link href="/portal?activated=1">Continue on web</Link>
        </Button>
      </div>
    </div>
  );
}
