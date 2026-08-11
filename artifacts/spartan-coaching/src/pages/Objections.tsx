import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoachingCTA } from "@/components/CoachingCTA";
import { LightbulbIcon, SpinnerIcon } from "@/components/icons";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { FieldTalkTrack } from "@/components/FieldTalkTrack";
import { markFieldKitChecklistDone } from "@/lib/fieldKitProgress";
import {
  ToolAnatomyEvidence,
  ToolAnatomyGuidance,
  ToolAnatomyNextMove,
  ToolAnatomyRelated,
  ToolAnatomyWhy,
} from "@/components/ToolAnatomy";

const CURATED_OBJECTIONS = [
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
] as const;

const RELATED_TOOLS = [
  { href: "/tools/role-play", label: "Role-play", kind: "Practice" },
  { href: "/tools/playbooks", label: "Playbooks", kind: "Prepare" },
  { href: "/resources/objection-cards", label: "Objection cards", kind: "Resource" },
];

export default function Objections() {
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [citations, setCitations] = useState<
    Record<string, Array<{ id: string; title: string; category: string }>>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [playing, setPlaying] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const generateResponse = async (objection: string) => {
    trackEvent("ai_tool_usage", "objections");
    setLoading((prev) => ({ ...prev, [objection]: true }));
    setLastError(null);

    try {
      const response = await fetch("/api/objections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objection }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate response");
      }

      const data = await response.json();
      setAiResponses((prev) => ({ ...prev, [objection]: data.response }));
      setCitations((prev) => ({ ...prev, [objection]: data.citations || [] }));
      void markFieldKitChecklistDone("objection");
    } catch (error) {
      console.error("Objection response error:", error);
      setLastError("Could not generate a response. Check connection and try again.");
      setAiResponses((prev) => ({
        ...prev,
        [objection]: "Sorry, I couldn't generate a response. Please try again.",
      }));
      setCitations((prev) => ({ ...prev, [objection]: [] }));
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

  const hasAnyResult = Object.keys(aiResponses).length > 0;

  return (
    <FieldKitToolLayout toolPath="/tools/objections">
      <SEO />
      {/* context — layout shell + page title */}
      <h1 className="text-h1 font-black text-foreground mb-6" data-testid="text-objections-title">
        Objection Handler
      </h1>

      <ToolAnatomyGuidance whenToUse="Before or after a visit when you hear 'not ready,' preferred hospice, or timing pushback. Pick a common line below or treat it as a starter — generate a Spartan Method alternative you can use in the room." />

      <ToolAnatomyWhy>
        Objections are not roadblocks; they are openings to educate and build trust. Each card
        keeps a proven baseline response and offers an AI alternative so you can match the tone of
        the account without inventing clinical claims.
      </ToolAnatomyWhy>

      {/* input + result — unique multi-card interaction preserved */}
      <div className="grid gap-6 mt-6" data-testid="tool-anatomy-input">
        {CURATED_OBJECTIONS.map((obj, idx) => (
          <Card
            key={obj.q}
            className="flex flex-col md:flex-row gap-6 border-2 shadow-lg spacing-card"
            data-testid={`card-objection-${idx}`}
          >
            <div className="flex-1">
              <h3 className="text-h3 font-bold text-foreground mb-4">{obj.q}</h3>
              <p className="text-muted-foreground italic border-l-4 border-primary pl-4">
                &ldquo;{obj.a}&rdquo;
              </p>
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
              {(aiResponses[obj.q] || loading[obj.q]) && (
                <div data-testid={`text-ai-response-${idx}`} data-tool-anatomy="result">
                  <FieldTalkTrack
                    title="Talk track for the room"
                    content={aiResponses[obj.q]}
                    loading={loading[obj.q]}
                    citations={citations[obj.q]}
                    reminderTitle={`Follow up: ${obj.q}`}
                    reading={playing === obj.q}
                    onReadAloud={() => readAloud(aiResponses[obj.q], obj.q)}
                    copyTestId={`button-copy-response-${idx}`}
                    readAloudTestId={`button-read-aloud-${idx}`}
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {lastError ? (
        <p className="mt-4 text-sm text-destructive" role="alert" data-testid="tool-anatomy-feedback">
          {lastError}
        </p>
      ) : null}

      {hasAnyResult ? (
        <div className="mt-8 space-y-6">
          <ToolAnatomyNextMove>
            After you use a talk track, set a follow-up on the account and practice the same line in
            Role-play if the referral source is high-value.
          </ToolAnatomyNextMove>
          <ToolAnatomyEvidence>
            AI alternatives cite Spartan Method sources when the API returns them. Do not invent
            clinical authority or quote CMS measures unless they appear in the evidence list.
          </ToolAnatomyEvidence>
          <ToolAnatomyRelated items={RELATED_TOOLS} />
          <CoachingCTA />
        </div>
      ) : (
        <div className="mt-8">
          <ToolAnatomyRelated items={RELATED_TOOLS} />
        </div>
      )}
    </FieldKitToolLayout>
  );
}
