import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SEO } from "@/components/SEO";
import { TrustStrip } from "@/components/TrustStrip";
import { PersuasionShell } from "@/components/PersuasionShell";
import { useToast } from "@/hooks/use-toast";
import { PRICING_FACTS } from "@/lib/complianceCopy";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  Mail,
  Shield,
  ArrowRight,
  Building2,
  User,
  HelpCircle,
} from "lucide-react";

const STEPS = [
  {
    n: "1",
    title: "You request",
    body: "Tell us who you are and what you need — individual or company seats.",
  },
  {
    n: "2",
    title: "Nick reviews",
    body: "Every request is personal. Usually within one business day.",
  },
  {
    n: "3",
    title: "Timed evaluation",
    body: "If approved: set password, then 24h (individual) or 72h (company).",
  },
  {
    n: "4",
    title: "Continue as client",
    body: `Individuals: subscribe ${PRICING_FACTS.individualWeeklyShort} from Account. Teams: seats under contract.`,
  },
];

const FAQ_LINKS = [
  { href: "/faq#how-to-get-access", label: "How do I get access?" },
  { href: "/faq#trial-hours", label: "How long is the trial?" },
  { href: "/faq#patient-data", label: "PHI / privacy" },
  { href: "/faq#what-after-trial", label: "After evaluation ends" },
  { href: "/hospice-sales-pro", label: "Hospice Sales Pro path" },
  { href: "/compliance", label: "Compliance details" },
];

export default function RequestAccess() {
  const { toast } = useToast();
  const [type, setType] = useState<"individual" | "company">("individual");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
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
  const trialHours = type === "company" ? 72 : 24;

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
    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, `request_access:${type}:submit`);
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
        if (data.code === "ACCOUNT_EXISTS") {
          toast({
            title: "Account already exists",
            description: "Sign in with that email, or use forgot password if you need a reset.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error || "Unable to submit request");
      }
      setSubmittedEmail(form.email.trim());
      setSubmitted(true);
      trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.contactSubmit, `request_access:${type}`);
    } catch (err: any) {
      trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.contactFailure, `request_access:${type}`);
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
      <PersuasionShell className="min-h-[70vh]">
        <SEO />
        <div
          className="flex items-center justify-center py-8"
          data-testid="page-request-access-success"
        >
          <Card className="w-full max-w-xl border-2 bg-card shadow-sm p-8 sm:p-10 space-y-6">
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <h1 className="text-2xl font-display font-black text-foreground">Request received</h1>
              <p className="text-muted-foreground leading-relaxed">
                Thank you. We review every membership request personally and respond within{" "}
                <strong className="text-foreground">one business day</strong>.
              </p>
              {submittedEmail && (
                <p className="text-sm text-muted-foreground">
                  Confirmation sent to{" "}
                  <strong className="text-foreground">{submittedEmail}</strong> (check spam if needed).
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">What to expect</p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    You should already have a “we received your request” email with the full process.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    If approved, you get a secure set-password link and a{" "}
                    <strong className="text-foreground">
                      {type === "company" ? "72-hour company" : "24-hour individual"}
                    </strong>{" "}
                    evaluation window.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Tools stay PHI-free — planning and messaging only, never clinical records.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
              <Button asChild className="font-bold">
                <Link href="/contact">
                  Book a strategy call
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="font-bold">
                <Link href="/faq">Read FAQ</Link>
              </Button>
            </div>
          </Card>
        </div>
      </PersuasionShell>
    );
  }

  return (
    <PersuasionShell>
      <SEO />

      <div className="text-center mb-10 sm:mb-12 space-y-3 max-w-2xl mx-auto" data-testid="page-request-access">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">Hospice Sales Pro</p>
        <h1 className="text-h1 font-display font-black text-foreground">Request team or evaluation access</h1>
        <p className="text-muted-foreground leading-relaxed">
          For provider seats, arranged evaluation windows, and team onboarding. Individuals who want self-serve should{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            create an account
          </Link>{" "}
          and subscribe for {PRICING_FACTS.individualWeeklyLabel} (cancel anytime) — preview tools free first.
        </p>
      </div>

      {/* Process steps */}
      <div
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10"
        data-testid="section-request-steps"
      >
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-xl border-2 border-border bg-card shadow-sm p-4 flex gap-3"
          >
            <span className="w-8 h-8 rounded-full bg-primary/15 text-primary font-black text-sm flex items-center justify-center shrink-0">
              {s.n}
            </span>
            <div>
              <p className="text-sm font-bold text-foreground mb-0.5">{s.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* Form */}
        <Card className="lg:col-span-3 border-2 bg-card shadow-sm p-6 sm:p-8">
          <form id="request-access-form" onSubmit={onSubmit} className="space-y-6">
            <div className="flex gap-2 p-1 rounded-lg bg-muted/40">
              {(["individual", "company"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    type === t
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`button-type-${t}`}
                >
                  {t === "individual" ? (
                    <>
                      <User className="w-4 h-4" /> Individual
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" /> Hospice company
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Trial expectation callout */}
            <div
              className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm"
              data-testid="text-trial-expectation"
            >
              <p className="font-bold text-foreground mb-1">
                {type === "individual" ? "Individual evaluation" : "Company evaluation"}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {type === "individual" ? (
                  <>
                    Typical window: <strong className="text-foreground">{trialHours} hours</strong> after
                    approval — enough to run real objections, a weekly plan, and role-play on your toughest
                    conversation.
                  </>
                ) : (
                  <>
                    Typical window: <strong className="text-foreground">{trialHours} hours</strong> so
                    leaders can loop in the team. Multi-seat org; BAA path available for corporate accounts.
                  </>
                )}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Full name *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Work email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Organization {type === "company" ? "*" : "(optional)"}</Label>
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
                <Input
                  id="title"
                  value={form.jobTitle}
                  onChange={(e) => set("jobTitle", e.target.value)}
                  data-testid="input-title"
                />
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
                <Input
                  id="market"
                  value={form.market}
                  onChange={(e) => set("market", e.target.value)}
                  placeholder="e.g. North Texas"
                  data-testid="input-market"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="message">Anything else we should know?</Label>
                <Textarea
                  id="message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Territory challenges, team size, timeline…"
                  data-testid="input-message"
                />
              </div>
            </div>

            {type === "company" && (
              <p className="text-xs text-muted-foreground leading-relaxed border border-border rounded-md p-3 bg-muted/30">
                Company evaluations give leaders room to loop in the team.{" "}
                <Link href="/compliance" className="text-primary hover:underline">
                  BAA and compliance details
                </Link>{" "}
                are available for corporate accounts. After evaluation, seat counts and weekly per-user rates
                are set under your provider contract (Stripe invoice or offline terms as agreed).
              </p>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <Checkbox
                  checked={acceptTerms}
                  onCheckedChange={(v) => setAcceptTerms(v === true)}
                  data-testid="check-terms"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <Checkbox
                  checked={noPhi}
                  onCheckedChange={(v) => setNoPhi(v === true)}
                  data-testid="check-nophi"
                />
                <span>
                  I will not enter protected health information (PHI) into Hospice Sales Pro tools.{" "}
                  <Link href="/compliance" className="text-primary hover:underline">
                    Compliance details
                  </Link>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full font-bold"
              size="lg"
              disabled={pending}
              data-testid="button-submit-request"
            >
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

        {/* Side rail */}
        <aside className="lg:col-span-2 space-y-5" data-testid="section-request-aside">
          <Card className="border-2 bg-card shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Quick answers</p>
            </div>
            <ul className="space-y-2">
              {FAQ_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    {item.label}
                    <ArrowRight className="w-3 h-3 opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-2 bg-card shadow-sm p-5 space-y-2">
            <p className="text-sm font-bold text-foreground">Prefer a conversation first?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Coaching, team systems, or enterprise scope often start with a strategy call — tools can
              follow.
            </p>
            <Button asChild variant="outline" className="w-full font-bold mt-2" size="sm">
              <Link href="/contact">Book a strategy call</Link>
            </Button>
          </Card>

          <TrustStrip compact showLinks={false} className="!p-4" />
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/compliance" className="hover:text-primary">
              Compliance
            </Link>
            {" · "}
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            {" · "}
            <Link href="/hospice-sales-pro" className="hover:text-primary">
              Hospice Sales Pro
            </Link>
          </p>
        </aside>
      </div>
      <PublicConversionPanel
        source="request_access"
        audience="Hospice companies seeking contracted seats or visitors applying for an arranged evaluation."
        promise="A personally reviewed access path with clear evaluation timing and an explicit next step."
        evidence={`${PRICING_FACTS.evaluationNote} ${PRICING_FACTS.teamNote}`}
        primary={{ label: "Submit an access request above", href: "#request-access-form", token: "complete_request" }}
        secondary={{ label: "Choose individual Hospice Sales Pro", href: "/hospice-sales-pro", token: "individual_path" }}
      />
    </PersuasionShell>
  );
}
