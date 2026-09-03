import { AccentText } from "@/components/AccentText";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface AssessmentQuestion {
  id: number;
  type: "quiz" | "scenario";
  text: string;
  options: string[] | null;
  correctAnswer: string | null;
  displayOrder: number;
}

interface AssessmentData {
  assessment: { id: number; name: string; description: string };
  questions: AssessmentQuestion[];
}

export default function AssessmentPrint() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<AssessmentData>({
    queryKey: ["/api/assessments", id, "public"],
    queryFn: () => fetch(`/api/assessments/${id}/public`).then(r => r.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading assessment...</p>
      </div>
    );
  }

  if (error || !data?.assessment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Assessment not found.</p>
      </div>
    );
  }

  const { assessment, questions } = data;
  const quizQuestions = questions.filter(q => q.type === "quiz").sort((a, b) => a.displayOrder - b.displayOrder);
  const scenarioQuestions = questions.filter(q => q.type === "scenario").sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      <style>{`
        @media print {
          header, footer, nav, .no-print { display: none !important; }
          body { font-size: 11pt; color: #111; line-height: 1.45; }
          .print-page { padding: 0.5in; color: #111; }
          .print-page p, .print-page li, .print-page span, .print-page div {
            overflow-wrap: anywhere;
            word-break: break-word;
          }
          .text-muted-foreground { color: #374151 !important; }
          .text-xs { font-size: 9.5pt !important; }
          .page-break { page-break-before: always; }
          .scenario-lines { border-bottom: 1px solid #ccc; height: 22px; margin-top: 8px; }
          a { text-decoration: none; color: inherit; }
        }
        @media screen {
          .print-page { max-width: 860px; margin: 0 auto; padding: 2rem; }
        }
      `}</style>

      <div className="print-page">
        <div className="no-print flex items-center justify-between gap-4 mb-8 pb-4 border-b">
          <div>
            <h1 className="text-lg font-bold"><AccentText>Assessment Print View</AccentText></h1>
            <p className="text-sm text-muted-foreground">Click Print to save or print this assessment. Correct answers are shown for your reference.</p>
          </div>
          <Button onClick={() => window.print()} data-testid="button-print-assessment">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Spartan Hospice Coaching</span>
          </div>
          <h1 className="text-2xl font-bold mb-2"><AccentText>{assessment.name}</AccentText></h1>
          <p className="text-sm text-muted-foreground">{assessment.description}</p>
        </div>

        <div className="mb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Part 1 — Knowledge Quiz ({quizQuestions.length} Questions)</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="text-xs text-muted-foreground mb-6 text-center">Select the best answer for each question. Correct answers are marked with a checkmark.</p>
        </div>

        <div className="space-y-7 mb-10">
          {quizQuestions.map((q, idx) => (
            <div key={q.id} data-testid={`print-quiz-${q.id}`}>
              <p className="font-semibold text-sm mb-3">
                <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                {q.text}
              </p>
              {q.options && (
                <div className="space-y-1.5 ml-4">
                  {q.options.map((opt, oi) => {
                    const isCorrect = opt.trim().toLowerCase() === (q.correctAnswer ?? "").trim().toLowerCase();
                    const letter = ["A", "B", "C", "D"][oi];
                    return (
                      <div key={oi} className={`flex items-start gap-2 text-sm ${isCorrect ? "font-semibold" : ""}`}>
                        <span className={`shrink-0 w-5 h-5 flex items-center justify-center rounded text-xs border ${isCorrect ? "bg-green-600 border-green-600 text-white print:bg-black print:border-black print:text-white" : "border-muted-foreground/40 text-muted-foreground"}`}>
                          {isCorrect ? "✓" : letter}
                        </span>
                        <span className={isCorrect ? "text-foreground" : "text-muted-foreground"}>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="page-break" />

        <div className="mb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Part 2 — Scenario Responses ({scenarioQuestions.length} Scenarios)</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="text-xs text-muted-foreground mb-6 text-center">Write your response to each scenario. Be specific. Vague answers will score lower.</p>
        </div>

        <div className="space-y-10">
          {scenarioQuestions.map((q, idx) => (
            <div key={q.id} data-testid={`print-scenario-${q.id}`}>
              <p className="font-semibold text-sm mb-4">
                <span className="text-muted-foreground mr-2">Scenario {idx + 1}.</span>
                {q.text}
              </p>
              <div className="ml-4">
                {[...Array(12)].map((_, li) => (
                  <div key={li} className="border-b border-muted-foreground/20 h-8 mb-1 print:border-b print:border-gray-300" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">Spartan Hospice Coaching &bull; nick@spartanhospicecoaching.com &bull; spartanhospicecoaching.com</p>
        </div>
      </div>
    </>
  );
}
