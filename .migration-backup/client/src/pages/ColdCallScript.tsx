import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CoachingCTA } from "@/components/CoachingCTA";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { MarkdownContent } from "@/components/MarkdownContent";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { downloadPdf, markdownToSections, type EmailPdfPayload } from "@/lib/downloadPdf";
import { useLeadGate } from "@/hooks/use-lead-gate";
import { LeadGateDialog } from "@/components/LeadGateDialog";
import { Copy, Download, Loader2, Phone } from "lucide-react";

const PROSPECT_TYPES = [
  "SNF Director of Nursing",
  "Primary Care Physician",
  "Hospital Discharge Planner",
  "Assisted Living Administrator",
  "Cardiology Practice Manager",
  "Home Health Agency Director",
  "Oncology Practice Navigator",
  "Geriatric Care Manager",
  "Palliative Care Coordinator",
];

export default function ColdCallScript() {
  const { capture, gateState } = useLeadGate("Cold Call Script");
  const { toast } = useToast();
  const [prospectType, setProspectType] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [situation, setSituation] = useState("");
  const [repName, setRepName] = useState("");
  const [script, setScript] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = () => {
    if (!prospectType) {
      toast({ title: "Select prospect type", description: "Choose who you are calling.", variant: "destructive" });
      return;
    }
    if (situation.length < 10) {
      toast({ title: "Describe your situation", description: "Add at least a sentence about the context.", variant: "destructive" });
      return;
    }

    const getEmailPdf = (): EmailPdfPayload | null => {
      if (!script) return null;
      return {
        title: `Cold Call Script — ${prospectType}`,
        sections: markdownToSections(script),
        filename: `cold-call-script-${prospectType.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      };
    };

    capture(async () => {
      setIsLoading(true);
      setScript("");
      trackEvent("ai_tool_usage", "cold_call_script");
      try {
        const res = await fetch("/api/cold-call-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prospectType, prospectName: prospectName || undefined, situation, repName: repName || undefined }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Failed to generate script" }));
          throw new Error(err.error || "Failed to generate script");
        }
        const data = await res.json();
        setScript(data.script || "");
      } catch (err: any) {
        toast({ title: "Generation failed", description: err.message || "Please try again.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }, getEmailPdf);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    toast({ title: "Copied!", description: "Script copied to clipboard." });
  };

  const handleDownload = async () => {
    try {
      await downloadPdf(
        "spartan-cold-call-script",
        `Cold Call Script — ${prospectType}`,
        markdownToSections(script),
        `Your Cold Call Script: ${prospectType}`
      );
      toast({ title: "Downloaded", description: "Your cold call script PDF is ready." });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message || "Could not generate PDF.", variant: "destructive" });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <SEO />
      <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Cold Call Script Generator" }]} />

      <h1 className="text-h1 font-black text-foreground mb-3" data-testid="text-script-title">
        Cold Call Script Generator
      </h1>
      <p className="text-body-lg text-muted-foreground mb-8 max-w-2xl" data-testid="text-script-subtitle">
        Enter the prospect type and your situation. Get a personalized opening script with three objection handlers built in — ready to use on your next call.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="spacing-card">
          <h2 className="text-h2 font-bold text-foreground mb-6">Your Call Details</h2>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="prospect-type">Prospect Type <span className="text-destructive">*</span></Label>
              <Select value={prospectType} onValueChange={setProspectType}>
                <SelectTrigger id="prospect-type" data-testid="select-prospect-type">
                  <SelectValue placeholder="Who are you calling?" />
                </SelectTrigger>
                <SelectContent>
                  {PROSPECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prospect-name">Prospect's Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="prospect-name"
                placeholder="e.g. Dr. Martinez, Sarah Johnson"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                data-testid="input-prospect-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="situation">Your Situation <span className="text-destructive">*</span></Label>
              <Textarea
                id="situation"
                placeholder="Describe the context. Is this your first call to them? Are they a competitor account? Have they never referred before? What do you know about them?"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                className="min-h-[120px] resize-none"
                data-testid="textarea-situation"
              />
              <p className="text-xs text-muted-foreground">More detail = more targeted script.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rep-name">Your Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="rep-name"
                placeholder="e.g. Alex — personalizes the script"
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                data-testid="input-rep-name"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !prospectType || situation.length < 10}
              className="w-full font-bold touch-manipulation"
              data-testid="button-generate-script"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Writing your script...</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  <span>Generate Script</span>
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Output */}
        <div className="space-y-4">
          {isLoading && (
            <Card className="spacing-card flex items-center justify-center min-h-48" data-testid="card-script-loading">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-muted-foreground">Crafting your script...</p>
              </div>
            </Card>
          )}

          {script && !isLoading && (
            <Card className="spacing-card" data-testid="card-script-output">
              <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <h2 className="text-h2 font-bold text-foreground">Your Script</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} data-testid="button-copy-script">
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} data-testid="button-download-script">
                    <Download className="w-4 h-4 mr-1.5" />
                    PDF
                  </Button>
                </div>
              </div>
              <div data-testid="text-script-content">
                <MarkdownContent content={script} />
              </div>
            </Card>
          )}

          {!script && !isLoading && (
            <Card className="bg-accent/30 spacing-card" data-testid="card-script-instructions">
              <h3 className="text-h3 font-bold text-foreground mb-4">What you get</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">1.</span>
                  <span>A 25-30 second opening hook tailored to the specific prospect type and your situation</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">2.</span>
                  <span>Three objection handlers for the most common pushbacks from that prospect type</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">3.</span>
                  <span>A specific next step ask — not vague, not "let me know," a real close</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">4.</span>
                  <span>Download as PDF or copy to practice before your next call</span>
                </li>
              </ul>
            </Card>
          )}
        </div>
      </div>

      {script && !isLoading && (
        <CoachingCTA className="mt-6" />
      )}

      <LeadGateDialog gateState={gateState} />
    </div>
  );
}
