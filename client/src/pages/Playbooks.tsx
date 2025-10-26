import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SpinnerIcon, DownloadIcon } from "@/components/icons";

export default function Playbooks() {
  const [scenario, setScenario] = useState("");
  const [desiredOutcomes, setDesiredOutcomes] = useState("");
  const [generatedPlaybook, setGeneratedPlaybook] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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
    if (!finalPrompt) return;

    setIsLoading(true);
    setError(null);
    setGeneratedPlaybook("");
    setShowModal(true);

    // Placeholder for MVP - will connect to backend in integration phase
    setTimeout(() => {
      const mockPlaybook = `# Strategic Playbook\n\n## Scenario Overview\n${finalPrompt}\n\n${desiredOutcomes ? `## Success Metrics\n${desiredOutcomes}\n\n` : ""}## Actionable Steps\n\n### Step 1: Research & Preparation\nGather intelligence about the referral source before your visit.\n\n> **Talking Point:** "I've been following your facility's approach to patient care, and I'm impressed by your commitment to quality."\n\n### Step 2: Discovery & Listening\nAsk open-ended questions to understand their current challenges.\n\n> **Talking Point:** "What challenges are you seeing with your current end-of-life care options?"\n\n### Step 3: Value Proposition\nPosition hospice as a solution to their specific pain points.\n\n> **Talking Point:** "Hospice can help reduce hospital readmissions and provide 24/7 support for your residents and families."\n\n## Key Takeaways\n- Focus on building trust before asking for referrals\n- Listen more than you talk\n- Always follow up within 24 hours\n- Provide value at every touchpoint`;
      
      setGeneratedPlaybook(mockPlaybook);
      setIsLoading(false);
    }, 1500);
  };

  const handleExportTxt = () => {
    if (!generatedPlaybook) return;
    const blob = new Blob([generatedPlaybook], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spartan-playbook.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-black text-foreground mb-2" data-testid="text-playbooks-title">
        AI Custom Playbook Generator
      </h1>
      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
        A playbook is not just a script; it's a strategic battle plan. Describe any sales scenario, and the Spartan AI will generate a complete, strategic playbook to guide you to success.
      </p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-xl font-bold mb-4">1. Describe a Scenario</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Be specific about the referral source, challenges, and goals.
            </p>
            <Textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="e.g., 'Building a new relationship with a busy cardiology clinic that has never used hospice before.'"
              className="min-h-32"
              data-testid="textarea-scenario"
            />

            <h2 className="text-xl font-bold mt-6 mb-4">2. Desired Outcomes (Optional)</h2>
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
              className="mt-6 w-full font-bold"
              disabled={isLoading || !scenario}
              data-testid="button-generate"
            >
              {isLoading && <SpinnerIcon className="w-5 h-5 animate-spin" />}
              {isLoading ? "Thinking..." : "Generate Custom Playbook"}
            </Button>
          </Card>

          <Card>
            <h2 className="text-xl font-bold mb-4">Classic Spartan Playbooks</h2>
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
                  className="text-left w-full text-sm font-semibold p-3 rounded-md bg-accent hover-elevate transition-colors"
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
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">No playbook generated yet</p>
                <p className="text-sm">Describe a scenario and click "Generate" to create your custom playbook</p>
              </div>
            </Card>
          )}

          {generatedPlaybook && !showModal && (
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Custom Playbook</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print">
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportTxt} data-testid="button-export">
                    <DownloadIcon className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap" data-testid="text-playbook-content">
                {generatedPlaybook}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap mb-6">
                {generatedPlaybook}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrint} className="flex-1" data-testid="button-modal-print">
                  Print
                </Button>
                <Button variant="outline" onClick={handleExportTxt} className="flex-1" data-testid="button-modal-export">
                  <DownloadIcon className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
