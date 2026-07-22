import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoachingCTA } from "@/components/CoachingCTA";
import { LightbulbIcon, SpeakerIcon, SpinnerIcon } from "@/components/icons";
import { Copy } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";
import { MarkdownContent } from "@/components/MarkdownContent";
import { useToast } from "@/hooks/use-toast";
import { ReminderPicker } from "@/components/ReminderPicker";
import { ToolHowTo } from "@/components/ToolHowTo";
import { FieldKitChrome } from "@/components/FieldKitChrome";
import { markFieldKitChecklistDone } from "@/lib/fieldKitProgress";

export default function Objections() {
  const objections = [
    {
      q: "We are not ready for hospice.",
      a: "I completely understand. This is a significant decision, and the timing has to feel right for your family. Could we perhaps talk about what 'ready' might look like for you, so we can provide the right information when you need it, without any pressure?",
    },
    {
      q: "Our doctor will tell us when it's time.",
      a: "That's wonderful that you have such a strong trust in your doctor; that relationship is so important. To support that, we can act as an extra set of eyes and ears at home and share our observations with your doctor. This can help them have the full picture during your next conversation.",
    },
    {
      q: "We feel that hospice means giving up hope.",
      a: "Thank you for sharing that; it's one of the most common and understandable concerns we hear. Hospice is not about giving up hope, but about redefining it. We focus hope on new goals: hope for comfort, hope for meaningful moments with family, and hope for living each day to its fullest, right at home.",
    },
    {
      q: "The patient is still seeking curative treatment.",
      a: "It's so important to honor that desire for continued treatment, and we fully support it. Hospice can actually work alongside certain palliative treatments. Our goal isn't to replace care, but to add a layer of expert symptom management that can make those treatments more tolerable and improve quality of life.",
    },
    {
      q: "We have a preferred hospice we already work with.",
      a: "That's great that you have a trusted partner. Patient choice is the most important thing. Our goal is simply to be a resource for you. If you ever have a patient or family who might benefit from a different approach, or if your preferred partner has a full caseload, we'd be honored to be your second call.",
    },
    {
      q: "Hospice is too expensive.",
      a: "That is a very practical and important concern. Many people are surprised to learn that hospice is a fully covered benefit under Medicare, Medicaid, and most private insurances. This means there are typically no out-of-pocket costs for the patient or family for any care related to the hospice diagnosis.",
    },
    {
      q: "We can manage the patient's symptoms ourselves.",
      a: "The dedication of your team is incredible, and you do amazing work. Think of us as specialists you can call on, just like a cardiologist or a pulmonologist. Our team is specifically trained in complex end-of-life symptom management, and we're available 24/7. We're here to support you, not replace you.",
    },
    {
      q: "We want to do everything we can.",
      a: "I hear you, and that desire to provide the best possible care is so important. Hospice is not about doing less; it's about doing everything we can to ensure comfort and quality of life. We're adding a specialized layer of support focused entirely on managing symptoms and providing peace, right where the patient is most comfortable.",
    },
  ];

  const { toast } = useToast();
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [playing, setPlaying] = useState<string | null>(null);

  const generateResponse = async (objection: string) => {
    trackEvent("ai_tool_usage", "objections");
    setLoading((prev) => ({ ...prev, [objection]: true }));
    
    try {
      const response = await fetch("/api/objections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objection }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate response");
      }

      const data = await response.json();
      setAiResponses((prev) => ({ ...prev, [objection]: data.response }));
      void markFieldKitChecklistDone("objection");
    } catch (error) {
      console.error("Objection response error:", error);
      setAiResponses((prev) => ({ ...prev, [objection]: "Sorry, I couldn't generate a response. Please try again." }));
    } finally {
      setLoading((prev) => ({ ...prev, [objection]: false }));
    }
  };

  const readAloud = async (text: string, key: string) => {
    if (playing === key) return;
    setPlaying(key);
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        setPlaying(null);
      };
      
      utterance.onerror = () => {
        setPlaying(null);
      };
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Text-to-speech error:", error);
      setPlaying(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <SEO />
      <FieldKitChrome />
      <Breadcrumbs items={[{ label: "Field Kit", href: "/portal" }, { label: "Tools", href: "/tools" }, { label: "Objection Handler" }]} />
      <ToolHowTo path="/tools/objections" />
      <h1 className="text-h1 font-black text-foreground mb-6" data-testid="text-objections-title">
        Objection Handler
      </h1>
      <p className="text-body-lg text-muted-foreground mb-8 leading-relaxed">
        Objections aren't roadblocks; they are opportunities to educate and build trust. Paste a real objection (no PHI), generate a field-ready response, then use it on the next visit.
      </p>

      <div className="grid gap-6">
        {objections.map((obj, idx) => (
          <Card key={idx} className="flex flex-col md:flex-row gap-6 border-2 shadow-lg spacing-card" data-testid={`card-objection-${idx}`}>
            <div className="flex-1">
              <h3 className="text-h3 font-bold text-foreground mb-4">{obj.q}</h3>
              <p className="text-muted-foreground italic border-l-4 border-primary pl-4">"{obj.a}"</p>
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <Button
                onClick={() => generateResponse(obj.q)}
                disabled={loading[obj.q]}
                size="lg"
                className="w-full font-bold touch-manipulation"
                data-testid={`button-generate-${idx}`}
              >
                {loading[obj.q] ? (
                  <>
                    <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <LightbulbIcon className="w-5 h-5 mr-2" />
                    <span>Generate AI Alternative</span>
                  </>
                )}
              </Button>
              {aiResponses[obj.q] && (
                <div className="p-4 bg-accent rounded-lg space-y-3">
                  <p className="font-semibold text-sm mb-2 text-primary">AI Generated Response:</p>
                  <div className="text-foreground" data-testid={`text-ai-response-${idx}`}>
                    <MarkdownContent content={aiResponses[obj.q]} />
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => readAloud(aiResponses[obj.q], obj.q)}
                      disabled={playing === obj.q}
                      className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
                      data-testid={`button-read-aloud-${idx}`}
                    >
                      <SpeakerIcon className="w-4 h-4" />
                      {playing === obj.q ? "Playing..." : "Read Aloud"}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiResponses[obj.q]).then(() => {
                          toast({ title: "Copied to clipboard", description: "AI response is ready to paste." });
                        });
                      }}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                      data-testid={`button-copy-response-${idx}`}
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                  <ReminderPicker title={`Follow up: ${obj.q}`} />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {Object.keys(aiResponses).length > 0 && (
        <CoachingCTA className="mt-6" />
      )}
    </div>
  );
}
