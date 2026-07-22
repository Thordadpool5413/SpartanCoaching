import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { CoachingCTA } from "@/components/CoachingCTA";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SpinnerIcon, DownloadIcon } from "@/components/icons";
import { Copy } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";
import { MarkdownContent } from "@/components/MarkdownContent";
import { useToast } from "@/hooks/use-toast";
import { downloadPdf, markdownToSections, type EmailPdfPayload } from "@/lib/downloadPdf";
import { useLeadGate } from "@/hooks/use-lead-gate";
import { LeadGateDialog } from "@/components/LeadGateDialog";
import { ReminderPicker } from "@/components/ReminderPicker";

export default function Playbooks() {
  const { toast } = useToast();
  const { capture, gateState } = useLeadGate("Sales Playbook");
  const [scenario, setScenario] = useState("");
  const [desiredOutcomes, setDesiredOutcomes] = useState("");
  const [generatedPlaybook, setGeneratedPlaybook] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const classicPlaybooks = [
    {
      title: "First Meeting with a SNF DON",
      prompt: "Create a playbook for a first-time meeting with a Director of Nursing at a Skilled Nursing Facility that has a preferred hospice provider. The goal is to establish credibility and secure a follow-up meeting, not to ask for referrals directly. The playbook should include discovery questions about their current provider and patient discharge challenges.",
    },
    {
      title: "Handling 'Too Early' from a Physician",
      prompt: "Generate a playbook for a conversation with a primary care physician who consistently says their patients are 'not ready yet' for hospice. The playbook should focus on educating the physician about the benefits of longer lengths of stay and how hospice can be a proactive part of their care continuum for patients with advanced illness.",
    },
    {
      title: "Presenting at a Clinic Lunch & Learn",
      prompt: "Craft a playbook for a 15-minute lunch & learn presentation to the clinical staff of a busy cardiology practice. The topic is 'Identifying Heart Failure Patients for Hospice.' The playbook needs a compelling opening, 3 key clinical triggers to look for, and a strong call to action that makes it easy for them to refer.",
    },
    {
      title: "Re-engaging a Cold Referral Source",
      prompt: "Create a playbook to re-engage with a referral source (e.g., an Assisted Living facility) that hasn't sent a referral in over 90 days. The strategy should focus on providing value and rebuilding the relationship, not on asking why they stopped referring. Include a specific 'value-add' idea.",
    },
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || scenario;
    
    // Validate minimum length for custom scenarios
    if (!customPrompt && finalPrompt.length < 10) {
      setValidationError("Scenario must be at least 10 characters");
      return;
    }
    
    if (!finalPrompt) return;

    trackEvent("ai_tool_usage", "playbooks");
    setIsLoading(true);
    setError(null);
    setValidationError(null);
    setGeneratedPlaybook("");
    setShowModal(true);

    try {
      const response = await fetch("/api/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: finalPrompt,
          desiredOutcomes: desiredOutcomes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate playbook");
      }

      const data = await response.json();
      setGeneratedPlaybook(data.playbook);
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the playbook");
      console.error("Playbook generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (!generatedPlaybook) return;
    const getEmailPdf = (): EmailPdfPayload => ({
      sections: markdownToSections(generatedPlaybook),
      title: "Sales Playbook",
      filename: "spartan-playbook",
    });
    capture(async () => {
      try {
        await downloadPdf("spartan-playbook", "Sales Playbook", markdownToSections(generatedPlaybook));
        toast({ title: "Downloaded", description: "Your playbook PDF is ready." });
      } catch (err: any) {
        toast({ title: "Download failed", description: err.message || "Could not generate PDF.", variant: "destructive" });
      }
    }, getEmailPdf);
  };

  const handleCopyPlaybook = () => {
    navigator.clipboard.writeText(generatedPlaybook).then(() => {
      toast({ title: "Copied to clipboard", description: "Playbook is ready to paste." });
    });
  };

  const handlePrint = handleExportPdf;

  const printStyles = `
    @media print {
      body * { visibility: hidden; }
      #playbook-print-area, #playbook-print-area * { visibility: visible; }
      #playbook-print-area { position: fixed; top: 0; left: 0; width: 100%; }
      @page { size: letter; margin: 0.75in; }
    }
    #playbook-print-area {
      visibility: hidden;
      font-family: Georgia, serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #111;
    }
    #playbook-print-area .print-header { border-bottom: 3px solid #dc2626; margin-bottom: 16pt; padding-bottom: 8pt; }
    #playbook-print-area .print-footer { border-top: 1px solid #ccc; margin-top: 24pt; padding-top: 6pt; font-size: 9pt; color: #666; display: flex; justify-content: space-between; }
    #playbook-print-area h1 { font-size: 18pt; font-weight: 900; margin-top: 14pt; margin-bottom: 4pt; color: #111 !important; }
    #playbook-print-area h2 { font-size: 14pt; font-weight: 700; margin-top: 14pt; margin-bottom: 4pt; color: #111 !important; }
    #playbook-print-area h3 { font-size: 12pt; font-weight: 600; margin-top: 10pt; margin-bottom: 3pt; color: #111 !important; }
    #playbook-print-area p { margin-bottom: 6pt; color: #111 !important; }
    #playbook-print-area ul, #playbook-print-area ol { padding-left: 18pt; margin-bottom: 8pt; }
    #playbook-print-area li { margin-bottom: 3pt; color: #111 !important; }
    #playbook-print-area strong { font-weight: 700; }
    #playbook-print-area em { font-style: italic; }
    #playbook-print-area pre, #playbook-print-area code { font-family: monospace; font-size: 10pt; white-space: pre-wrap; }
    #playbook-print-area blockquote { border-left: 3px solid #dc2626; padding-left: 10pt; margin-left: 0; color: #444 !important; }
    #playbook-print-area .text-foreground, #playbook-print-area .text-muted-foreground { color: #111 !important; }
  `;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      {generatedPlaybook && (
        <div id="playbook-print-area">
          <div className="print-header">
            <h1>SPARTAN COACHING | Sales Playbook</h1>
            <p style={{ fontSize: "10pt", color: "#666" }}>Generated {new Date().toLocaleDateString()} | spartancoaching.com</p>
          </div>
          <MarkdownContent content={generatedPlaybook} />
          <div className="print-footer">
            <span>Spartan Coaching | Hospice Sales Excellence</span>
            <span>Confidential Training Material</span>
          </div>
        </div>
      )}
      <SEO />
      <Breadcrumbs items={[{ label: "Field Kit", href: "/portal" }, { label: "Tools", href: "/tools" }, { label: "Sales Playbooks" }]} />
      <h1 className="text-h1 font-black text-foreground mb-6" data-testid="text-playbooks-title">
        AI Custom Playbook Generator
      </h1>
      <p className="text-body-lg text-muted-foreground mb-8 leading-relaxed">
        A playbook is not just a script; it's a strategic battle plan. Describe any sales scenario, and the Spartan AI will generate a complete, strategic playbook to guide you to success.
      </p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-2 shadow-lg spacing-card">
            <h2 className="text-h2 font-bold mb-4">1. Describe a Scenario</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Be specific about the referral source, challenges, and goals.
            </p>
            <Textarea
              value={scenario}
              onChange={(e) => {
                setScenario(e.target.value);
                if (validationError && e.target.value.length >= 10) {
                  setValidationError(null);
                }
              }}
              placeholder="e.g., 'Building a new relationship with a busy cardiology clinic that has never used hospice before.'"
              className="min-h-32"
              data-testid="textarea-scenario"
            />
            {validationError && (
              <p className="text-sm text-destructive mt-2" data-testid="text-validation-error">
                {validationError}
              </p>
            )}

            <h2 className="text-h2 font-bold mt-6 mb-4">2. Desired Outcomes (Optional)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Specify your goals. The AI will prioritize these to tailor the playbook.
            </p>
            <Textarea
              value={desiredOutcomes}
              onChange={(e) => setDesiredOutcomes(e.target.value)}
              placeholder="e.g., 'Secure a follow-up meeting with the DON', 'Get 3 new patient referrals this month.'"
              className="min-h-24"
              data-testid="textarea-outcomes"
            />

            <Button
              onClick={() => handleGenerate()}
              size="lg"
              className="mt-6 w-full font-bold touch-manipulation"
              disabled={isLoading || !scenario || scenario.length < 10}
              data-testid="button-generate"
            >
              {isLoading && <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />}
              <span>{isLoading ? "Thinking..." : "Generate Custom Playbook"}</span>
            </Button>
          </Card>

          <Card className="border-2 shadow-lg spacing-card">
            <h2 className="text-h2 font-bold mb-4">Classic Spartan Playbooks</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Need inspiration? Click a classic scenario to instantly generate a proven playbook.
            </p>
            <div className="space-y-2">
              {classicPlaybooks.map((playbook, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setScenario(playbook.prompt);
                    setDesiredOutcomes("");
                    handleGenerate(playbook.prompt);
                  }}
                  className="text-left w-full text-sm font-semibold p-3 rounded-md bg-accent hover-elevate active-elevate-2 transition-colors min-h-[48px] touch-manipulation"
                  data-testid={`button-classic-${idx}`}
                >
                  {playbook.title}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {!generatedPlaybook && !isLoading && (
            <Card className="h-full flex items-center justify-center border-2 shadow-lg spacing-card">
              <div className="text-center text-muted-foreground">
                <p className="text-body-lg mb-2">No playbook generated yet</p>
                <p className="text-body">Describe a scenario and click "Generate" to create your custom playbook</p>
              </div>
            </Card>
          )}

          {generatedPlaybook && !showModal && (
            <Card className="border-2 shadow-lg spacing-card">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h2 className="text-h2 font-bold">Your Custom Playbook</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="default" onClick={handleCopyPlaybook} className="font-bold touch-manipulation" data-testid="button-copy">
                    <Copy className="w-4 h-4 mr-2" />
                    <span>Copy</span>
                  </Button>
                  <Button variant="outline" size="default" onClick={handlePrint} className="font-bold touch-manipulation" data-testid="button-print">
                    Print
                  </Button>
                  <Button variant="outline" size="default" onClick={handleExportPdf} className="font-bold touch-manipulation" data-testid="button-export">
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
              <div data-testid="text-playbook-content">
                <MarkdownContent content={generatedPlaybook} />
              </div>
              <div className="mt-6 pt-4 border-t">
                <ReminderPicker title="Follow up on playbook" />
              </div>
            </Card>
          )}

          {generatedPlaybook && !showModal && (
            <CoachingCTA className="mt-4" />
          )}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generated Playbook</DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <SpinnerIcon className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : (
            <>
              <div className="mb-6">
                <MarkdownContent content={generatedPlaybook} />
              </div>
              <ReminderPicker title="Follow up on playbook" />
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={handleCopyPlaybook} className="flex-1" data-testid="button-modal-copy">
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" onClick={handlePrint} className="flex-1" data-testid="button-modal-print">
                  Print
                </Button>
                <Button variant="outline" onClick={handleExportPdf} className="flex-1" data-testid="button-modal-export">
                  <DownloadIcon className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <LeadGateDialog gateState={gateState} />
    </div>
  );
}
