import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";

export default function RequestAccess() {
  const { toast } = useToast();
  const [type, setType] = useState<"individual" | "company">("individual");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [noPhi, setNoPhi] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    companyName: "",
    jobTitle: "",
    role: "",
    teamSize: "",
    primaryGoal: "",
    market: "",
    message: "",
    seatsRequested: "5",
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms || !noPhi) {
      toast({
        title: "Please confirm",
        description: "Accept terms and the no-PHI commitment to continue.",
        variant: "destructive",
      });
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          name: form.name.trim(),
          email: form.email.trim(),
          companyName: form.companyName.trim() || undefined,
          jobTitle: form.jobTitle.trim() || undefined,
          role: form.role || undefined,
          teamSize: form.teamSize || undefined,
          primaryGoal: form.primaryGoal || undefined,
          market: form.market.trim() || undefined,
          message: form.message.trim() || undefined,
          seatsRequested: type === "company" ? Number(form.seatsRequested) || 5 : 1,
          acceptTerms: true,
          noPhi: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Unable to submit request");
      }
      setSubmitted(true);
    } catch (err: any) {
      toast({
        title: "Request not sent",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16" data-testid="page-request-access-success">
        <SEO />
        <Card className="w-full max-w-lg border border-white/10 dark:bg-[#0c0c0c] p-10 text-center space-y-6">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h1 className="text-2xl font-display font-black">Request received</h1>
          <p className="text-muted-foreground leading-relaxed">
            Thank you. We review every Field Kit access request personally and respond within{" "}
            <strong className="text-foreground">one business day</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            If approved, you will receive a secure email to set your password and begin your evaluation window.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild className="font-bold">
              <Link href="/contact">Book a strategy call</Link>
            </Button>
            <Button asChild variant="outline" className="font-bold">
              <Link href="/">Return home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 sm:py-16" data-testid="page-request-access">
      <SEO />
      <div className="text-center mb-10 space-y-3">
        <p className="text-xs font-bold tracking-widest text-red-400 uppercase">Field Kit</p>
        <h1 className="text-h1 font-display font-black text-foreground">Request evaluation access</h1>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          The Field Kit is private — for Spartan clients and approved evaluators. Tell us who you are and what you are trying to improve. We will review within one business day.
        </p>
      </div>

      <Card className="border border-white/10 dark:bg-[#0c0c0c] p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex gap-2 p-1 rounded-lg bg-muted/40">
            {(["individual", "company"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`button-type-${t}`}
              >
                {t === "individual" ? "Individual" : "Hospice company"}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Full name *</Label>
              <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="input-name" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Work email *</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} data-testid="input-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Organization {type === "company" ? "*" : ""}</Label>
              <Input
                id="company"
                required={type === "company"}
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                data-testid="input-company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Job title</Label>
              <Input id="title" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} data-testid="input-title" />
            </div>
            <div className="space-y-2">
              <Label>Your role</Label>
              <Select value={form.role} onValueChange={(v) => set("role", v)}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rep">Sales rep / liaison</SelectItem>
                  <SelectItem value="director">Sales director / manager</SelectItem>
                  <SelectItem value="vp">VP / executive</SelectItem>
                  <SelectItem value="owner">Owner / operator</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primary goal</Label>
              <Select value={form.primaryGoal} onValueChange={(v) => set("primaryGoal", v)}>
                <SelectTrigger data-testid="select-goal">
                  <SelectValue placeholder="What are you solving?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pipeline">Stronger referral pipeline</SelectItem>
                  <SelectItem value="admissions">Admissions consistency</SelectItem>
                  <SelectItem value="coaching">Coaching system for leaders</SelectItem>
                  <SelectItem value="ramp">New hire ramp</SelectItem>
                  <SelectItem value="profitability">Branch profitability</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === "company" && (
              <>
                <div className="space-y-2">
                  <Label>Team size</Label>
                  <Select value={form.teamSize} onValueChange={(v) => set("teamSize", v)}>
                    <SelectTrigger data-testid="select-team-size">
                      <SelectValue placeholder="Approx. team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5">1–5</SelectItem>
                      <SelectItem value="6-15">6–15</SelectItem>
                      <SelectItem value="16-40">16–40</SelectItem>
                      <SelectItem value="40+">40+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats">Seats requested</Label>
                  <Input
                    id="seats"
                    type="number"
                    min={1}
                    max={500}
                    value={form.seatsRequested}
                    onChange={(e) => set("seatsRequested", e.target.value)}
                    data-testid="input-seats"
                  />
                </div>
              </>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="market">Market / states (optional)</Label>
              <Input id="market" value={form.market} onChange={(e) => set("market", e.target.value)} placeholder="e.g. North Texas" data-testid="input-market" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="message">Anything else we should know?</Label>
              <Textarea id="message" rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} data-testid="input-message" />
            </div>
          </div>

          {type === "company" && (
            <p className="text-xs text-muted-foreground leading-relaxed border border-white/10 rounded-md p-3">
              Company evaluations default to a longer window so leaders can loop in the team.{" "}
              <Link href="/compliance" className="text-primary hover:underline">BAA and compliance details</Link> are available for corporate accounts.
            </p>
          )}

          <div className="space-y-3">
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(v === true)} data-testid="check-terms" />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <Checkbox checked={noPhi} onCheckedChange={(v) => setNoPhi(v === true)} data-testid="check-nophi" />
              <span>
                I will not enter protected health information (PHI) into Field Kit tools.{" "}
                <Link href="/compliance" className="text-primary hover:underline">Compliance details</Link>
              </span>
            </label>
          </div>

          <Button type="submit" className="w-full font-bold" size="lg" disabled={pending} data-testid="button-submit-request">
            {pending ? "Submitting…" : "Submit access request"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already approved?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
            {" · "}
            <Link href="/contact" className="text-primary font-semibold hover:underline">
              Book a call instead
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
