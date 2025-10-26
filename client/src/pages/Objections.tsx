import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LightbulbIcon, SpeakerIcon, SpinnerIcon } from "@/components/icons";

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

  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [playing, setPlaying] = useState<string | null>(null);

  const generateResponse = async (objection: string) => {
    setLoading((prev) => ({ ...prev, [objection]: true }));
    
    // Placeholder for MVP - will connect to backend in integration phase
    setTimeout(() => {
      const mockResponse = "I understand your concern. Every family's journey is unique, and we're here to support you at whatever pace feels right. Would it be helpful if I shared some information about how our services work, without any obligation?";
      setAiResponses((prev) => ({ ...prev, [objection]: mockResponse }));
      setLoading((prev) => ({ ...prev, [objection]: false }));
    }, 1000);
  };

  const readAloud = async (text: string, key: string) => {
    if (playing === key) return;
    setPlaying(key);
    
    // Placeholder for MVP - will connect to TTS in integration phase
    setTimeout(() => {
      setPlaying(null);
    }, 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-black text-foreground mb-2" data-testid="text-objections-title">
        Objection Handling with AI
      </h1>
      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
        Objections aren't roadblocks; they are opportunities to educate and build trust. Here are expert-crafted responses. Use the AI to generate alternative approaches for any situation.
      </p>

      <div className="grid gap-6">
        {objections.map((obj, idx) => (
          <Card key={idx} className="flex flex-col md:flex-row gap-6" data-testid={`card-objection-${idx}`}>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground mb-3">{obj.q}</h3>
              <p className="text-muted-foreground italic border-l-4 border-primary pl-4">"{obj.a}"</p>
            </div>
            <div className="w-full md:w-1/2 space-y-3">
              <Button
                onClick={() => generateResponse(obj.q)}
                disabled={loading[obj.q]}
                className="w-full font-bold"
                data-testid={`button-generate-${idx}`}
              >
                {loading[obj.q] ? (
                  <>
                    <SpinnerIcon className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <LightbulbIcon className="w-5 h-5" />
                    Generate AI Alternative
                  </>
                )}
              </Button>
              {aiResponses[obj.q] && (
                <div className="p-4 bg-accent rounded-lg">
                  <p className="font-semibold text-sm mb-2 text-primary">AI Generated Response:</p>
                  <p className="text-foreground mb-3" data-testid={`text-ai-response-${idx}`}>{aiResponses[obj.q]}</p>
                  <button
                    onClick={() => readAloud(aiResponses[obj.q], obj.q)}
                    disabled={playing === obj.q}
                    className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
                    data-testid={`button-read-aloud-${idx}`}
                  >
                    <SpeakerIcon className="w-4 h-4" />
                    {playing === obj.q ? "Playing..." : "Read Aloud"}
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
