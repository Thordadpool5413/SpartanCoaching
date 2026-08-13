import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { LeadGateState } from "@/hooks/use-lead-gate";
import { CONSENT_COPY } from "@/lib/complianceCopy";
import { Link } from "wouter";

interface LeadGateDialogProps {
  gateState: LeadGateState;
}

export function LeadGateDialog({ gateState }: LeadGateDialogProps) {
  const {
    open,
    setOpen,
    nameVal,
    setNameVal,
    emailVal,
    setEmailVal,
    marketingOptIn,
    setMarketingOptIn,
    isPending,
    onSubmit,
    isReturning,
  } = gateState;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isReturning ? "Confirm to continue" : CONSENT_COPY.resourceDeliveryTitle}
          </DialogTitle>
          <DialogDescription>
            {isReturning
              ? "Confirm your details below to continue. Resource delivery does not require marketing email."
              : CONSENT_COPY.resourceDeliveryBody}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="gate-name">Name</Label>
            <Input
              id="gate-name"
              placeholder="Your name"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isPending}
              data-testid="input-gate-name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gate-email">Email</Label>
            <Input
              id="gate-email"
              type="email"
              placeholder="your@email.com"
              value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isPending}
              data-testid="input-gate-email"
            />
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-3">
            <Checkbox
              id="gate-marketing"
              checked={marketingOptIn}
              onCheckedChange={(v) => setMarketingOptIn(v === true)}
              disabled={isPending}
              data-testid="checkbox-gate-marketing"
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor="gate-marketing" className="text-sm font-medium leading-snug cursor-pointer">
                {CONSENT_COPY.marketingOptInLabel}
              </Label>
              <p className="text-xs text-muted-foreground leading-snug">
                {CONSENT_COPY.marketingOptInHint}{" "}
                <Link href="/trust" className="text-primary font-semibold hover:underline">
                  Trust Center
                </Link>
              </p>
            </div>
          </div>
          <Button
            onClick={onSubmit}
            disabled={isPending || !nameVal.trim() || !emailVal.trim()}
            data-testid="button-gate-submit"
          >
            {isPending ? "Please wait..." : isReturning ? "Continue" : "Continue with resource"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
