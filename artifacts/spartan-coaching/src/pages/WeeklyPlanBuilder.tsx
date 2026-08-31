import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CoachingCTA } from "@/components/CoachingCTA";
import { SEO } from "@/components/SEO";
import { MarkdownContent } from "@/components/MarkdownContent";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { downloadPdf, markdownToSections, type EmailPdfPayload } from "@/lib/downloadPdf";
import { useLeadGate } from "@/hooks/use-lead-gate";
import { LeadGateDialog } from "@/components/LeadGateDialog";
import { Copy, Download, Loader2, CalendarDays } from "lucide-react";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { markFieldKitChecklistDone } from "@/lib/fieldKitProgress";
import { ToolAnatomyRelated } from "@/components/ToolAnatomy";
import { ToolResultActions } from "@/components/ToolResultActions";
import {
  getToolById,
  recommendRelated,
  relatedToAnatomyItems,
} from "@/lib/fieldKitCatalog";

const WEEKLY_GOALS = [
  "Secure a new referral from a cold account",
  "Re-engage a dormant referral source (90+ days)",
  "Increase referral volume from an existing source",
  "Introduce myself to a new facility type",
  "Build pipeline in a new geographic area",
  "Recover census after a drop",
  "Onboard a new referral source from scratch",
  "Custom goal",
];

export default function WeeklyPlanBuilder() {
  const { capture, gateState } = useLeadGate("Weekly Plan Builder");
  const { toast } = useToast();
  const [accounts, setAccounts] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [territoryFocus, setTerritoryFocus] = useState("");
  const [challenges, setChallenges] = useState("");
  const [plan, setPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const relatedItems = useMemo(
    () =>
      relatedToAnatomyItems(
        recommendRelated(
          "weekly-plan",
          {
            platform: "web",
            contextTags: ["territory", "week", "plan"],
            limit: 4,
            canUseFieldKit: true,
          },
          getToolById,
        ),
      ),
    [],
  );

  const effectiveGoal = weeklyGoal === "Custom goal" ? customGoal : weeklyGoal;

  const handleGenerate = () => {
    if (accounts.length < 10) {
      toast({ title: "Add your accounts", description: "List at least a few accounts you plan to visit.", variant: "destructive" });
      return;
    }
    if (!effectiveGoal) {
      toast({ title: "Set a weekly goal", description: "Choose what you are trying to accomplish this week.", variant: "destructive" });
      return;
    }

    const getEmailPdf = (): EmailPdfPayload | null => {
      if (!plan) return null;
      return {
        title: "Weekly Territory Plan",
        sections: markdownToSections(plan),
        filename: "weekly-territory-plan.pdf",
      };
    };

    capture(async () => {
      setIsLoading(true);
      setPlan("");
      trackEvent("ai_tool_usage", "weekly_plan_builder");
      try {
        const res = await fetch("/api/weekly-plan-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accounts,
            weeklyGoal: effectiveGoal,
            territoryFocus: territoryFocus || undefined,
            challenges: challenges || undefined,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Failed to generate plan" }));
          throw new Error(err.error || "Failed to generate plan");
        }
        const data = await res.json();
        setPlan(data.plan || "");
        void markFieldKitChecklistDone("weekly_plan");
      } catch (err: any) {
        toast({ title: "Generation failed", description: err.message || "Please try again.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }, getEmailPdf);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(plan);
    toast({ title: "Copied!", description: "Weekly plan copied to clipboard." });
  };

  const handleDownload = async () => {
    try {
      await downloadPdf(
        "spartan-weekly-plan",
        "Weekly Territory Plan",
        markdownToSections(plan),
        "Your Weekly Territory Plan — Spartan Coaching"
      );
      toast({ title: "Downloaded", description: "Your weekly plan PDF is ready." });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message || "Could not generate PDF.", variant: "destructive" });
    }
  };

  return (
    <FieldKitToolLayout toolPath="/tools/weekly-plan-builder">
      <SEO />

      <h1 className="text-h1 font-black text-foreground mb-3" data-testid="text-plan-title">
        Weekly Plan Builder
      </h1>
      <p className="text-body-lg text-muted-foreground mb-8 max-w-2xl" data-testid="text-plan-subtitle">
        Enter your accounts and goals for the week. Get a specific Monday–Friday territory plan with visit objectives, talk track focus, and a Friday review checklist.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="spacing-card">
          <h2 className="text-h2 font-bold text-foreground mb-6">This Week's Setup</h2>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="accounts">Accounts to Visit <span className="text-destructive">*</span></Label>
              <Textarea
                id="accounts"
                placeholder={"List your top accounts, one per line. Include what you know:\nSunrise SNF — DON is Sarah, haven't referred in 60 days\nDr. Patel PCP — seen twice, interested but hasn't referred\nRiver Oaks AL — new contact, first time visiting"}
                value={accounts}
                onChange={(e) => setAccounts(e.target.value)}
                className="min-h-[140px] resize-none font-mono text-sm"
                data-testid="textarea-accounts"
              />
              <p className="text-xs text-muted-foreground">More context = more targeted plan. Include the contact name and last interaction if you know it.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekly-goal">Weekly Goal <span className="text-destructive">*</span></Label>
              <Select value={weeklyGoal} onValueChange={setWeeklyGoal}>
                <SelectTrigger id="weekly-goal" data-testid="select-weekly-goal">
                  <SelectValue placeholder="What are you trying to accomplish?" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKLY_GOALS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {weeklyGoal === "Custom goal" && (
                <Input
                  placeholder="Describe your specific goal for this week"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  className="mt-2"
                  data-testid="input-custom-goal"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="territory-focus">Territory Focus <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="territory-focus"
                placeholder="e.g. North side SNFs, cardiology practices, downtown hospitals"
                value={territoryFocus}
                onChange={(e) => setTerritoryFocus(e.target.value)}
                data-testid="input-territory-focus"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="challenges">Biggest Challenge This Week <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="challenges"
                placeholder="What obstacle are you trying to get past? e.g. A gatekeeper blocking access, a competitive account you're trying to break into, a DON who keeps canceling..."
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                className="min-h-[80px] resize-none"
                data-testid="textarea-challenges"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || accounts.length < 10 || !effectiveGoal}
              className="w-full font-bold touch-manipulation"
              data-testid="button-generate-plan"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Building your plan...</span>
                </>
              ) : (
                <>
                  <CalendarDays className="w-4 h-4 mr-2" />
                  <span>Build My Week</span>
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Output */}
        <div className="space-y-4">
          {isLoading && (
            <Card className="spacing-card flex items-center justify-center min-h-48" data-testid="card-plan-loading">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-muted-foreground">Mapping your week...</p>
              </div>
            </Card>
          )}

          {plan && !isLoading && (
            <Card className="spacing-card" data-testid="card-plan-output">
              <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <h2 className="text-h2 font-bold text-foreground">Your Week</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} data-testid="button-copy-plan">
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} data-testid="button-download-plan">
                    <Download className="w-4 h-4 mr-1.5" />
                    PDF
                  </Button>
                </div>
              </div>
              <div data-testid="text-plan-content">
                <MarkdownContent content={plan} />
              </div>
              <ToolResultActions
                toolId="weekly-plan"
                saveResult={{ toolId: "weekly-plan", title: "Weekly execution plan", value: plan, input: { accounts, weeklyGoal, customGoal, territoryFocus, challenges }, nextAction: { title: "Run the first account action", href: "/tools/sales-workflow" } }}
                description="Open your first account, run the Monday visit, and use the Command Center to keep the week moving."
                actions={[
                  {
                    id: "open-command-center",
                    label: "Open Sales Command Center",
                    href: "/tools/sales-workflow",
                  },
                ]}
                persistenceNote="Save the plan with its accounts and goal so the Command Center can continue the work."
              />
            </Card>
          )}

          {!plan && !isLoading && (
            <Card className="bg-accent/30 spacing-card" data-testid="card-plan-instructions">
              <h3 className="text-h3 font-bold text-foreground mb-4">What you get</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">1.</span>
                  <span>A Monday–Friday plan with specific accounts sequenced for maximum impact</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">2.</span>
                  <span>A specific visit goal and talk track focus for each account</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">3.</span>
                  <span>A daily win condition so you know exactly what success looks like each day</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">4.</span>
                  <span>A Friday review checklist to close the week and set up next week</span>
                </li>
              </ul>
            </Card>
          )}
        </div>
      </div>

      {plan && !isLoading && (
        <CoachingCTA className="mt-6" />
      )}

      <div className="mt-8">
        <ToolAnatomyRelated items={relatedItems} />
      </div>

      <LeadGateDialog gateState={gateState} />
    </FieldKitToolLayout>
  );
}
