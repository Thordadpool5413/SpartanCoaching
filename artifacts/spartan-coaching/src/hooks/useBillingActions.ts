import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { openBillingPortal, startIndividualCheckout } from "@/lib/billingClient";

/** Shared website billing CTAs (Account, gate, trial banner, portal). */
export function useBillingActions() {
  const { toast } = useToast();
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [portalPending, setPortalPending] = useState(false);

  const startCheckout = useCallback(async () => {
    setCheckoutPending(true);
    try {
      const { url } = await startIndividualCheckout();
      window.location.href = url;
    } catch (err: any) {
      toast({
        title: "Checkout unavailable",
        description: err?.message || "Try again from Account or contact support.",
        variant: "destructive",
      });
      setCheckoutPending(false);
    }
  }, [toast]);

  const openPortal = useCallback(async () => {
    setPortalPending(true);
    try {
      const { url } = await openBillingPortal();
      window.location.href = url;
    } catch (err: any) {
      toast({
        title: "Billing portal unavailable",
        description: err?.message || "Try again from Account or contact support.",
        variant: "destructive",
      });
      setPortalPending(false);
    }
  }, [toast]);

  return { startCheckout, openPortal, checkoutPending, portalPending };
}
