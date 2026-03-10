import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { LeadGateState } from "@/hooks/use-lead-gate";

interface LeadGateDialogProps {
  gateState: LeadGateState;
}

export function LeadGateDialog({ gateState }: LeadGateDialogProps) {
  const { open, setOpen, nameVal, setNameVal, emailVal, setEmailVal, isPending, onSubmit } = gateState;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unlock This Tool</DialogTitle>
          <DialogDescription>
            Enter your name and email to access this resource. You'll only need to do this once.
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
          <Button
            onClick={onSubmit}
            disabled={isPending || !nameVal.trim() || !emailVal.trim()}
            data-testid="button-gate-submit"
          >
            {isPending ? "Please wait..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
