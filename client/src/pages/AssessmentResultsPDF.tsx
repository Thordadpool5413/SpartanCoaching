import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const ADMIN_CODE = import.meta.env.VITE_ADMIN_PASSWORD || "5413";

const adminFetch = (url: string) =>
  fetch(url, { headers: { "X-Admin-Auth": ADMIN_CODE } }).then(r => r.json());

interface AiData {
  overallScore: number;
  fieldReadinessScore: number;
  categoryScores: {
    hospiceKnowledge: number;
    relationshipSelling: number;
    empathyCommunication: number;
    strategicExecution: number;
    spartanSalesModel?: number;
    objectionHandling?: number;
    familyMeetingCompetence?: number;
    crmDiscipline?: number;
  };
  tier: string;
  executiveSummary?: string;
  quizAnalysis: string;
  strengths: string[];
  developmentAreas: string[];
  redFlags: string[];
  coachabilitySignals: string[];
  scenarioFeedback: Array<{
    scenarioNumber: number;
    title: string;
    feedback: string;
    strongerAnswer: string;
  }>;
  candidatePotential: string;
  interviewGuide: Array<{ question: string; intent: string }>;
  developmentPlan: Array<{ focus: string; action: string }>;
  hiringRecommendation: string;
}

interface SubmissionData {
  submission: {
    id: number;
    candidateName: string;
    candidateEmail: string;
    overallScore: number | null;
    quizScore: number | null;
    aiScore: number | null;
    aiFeedback: string | null;
    completedAt: string | null;
    answers: Record<string, string> | null;
  };
  assessment: { id: number; name: string; description: string };
  questions: Array<{
    id: number;
    type: string;
    text: string;
    options: string[] | null;
    correctAnswer: string | null;
    displayOrder: number;
  }>;
}

function ScoreBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{value}/{max}</span>
      </div>
      <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px" }} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: "10px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function AssessmentResultsPDF() {
  const { submissionId } = useParams<{ submissionId: string }>();

  const { data, isLoading, error } = useQuery<SubmissionData>({
    queryKey: ["/api/submissions", submissionId],
    queryFn: () => adminFetch(`/api/submissions/${submissionId}`),
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p>Loading report...</p>
      </div>
    );
  }

  if (error || !data?.submission) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p>Report not found or access denied.</p>
      </div>
    );
  }

  const { submission, assessment, questions } = data;

  let aiData: AiData | null = null;
  try { aiData = submission.aiFeedback ? JSON.parse(submission.aiFeedback) : null; } catch { aiData = null; }

  const isStructured = aiData && typeof aiData.overallScore === "number";
  const tierColor = !isStructured ? "#6b7280"
    : aiData!.tier === "Strong Hire" ? "#16a34a"
    : aiData!.tier === "Solid Candidate" ? "#2563eb"
    : aiData!.tier === "Development Needed" ? "#d97706"
    : "#dc2626";

  const quizQuestions = questions.filter(q => q.type === "quiz").sort((a, b) => a.displayOrder - b.displayOrder);
  const scenarioQuestions = questions.filter(q => q.type === "scenario").sort((a, b) => a.displayOrder - b.displayOrder);

  const answersObj: Record<string, string> = (submission.answers && typeof submission.answers === "object")
    ? submission.answers as Record<string, string>
    : {};

  const correctCount = quizQuestions.filter(q => {
    const ans = answersObj[String(q.id)];
    return ans && q.correctAnswer && ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
  }).length;

  return (
    <>
      <style>{`
        @media print {
          header, footer, nav, .no-print { display: none !important; }
          body { margin: 0; font-size: 10pt; }
          .pdf-root { padding: 0.4in 0.5in; }
          .page-break { page-break-before: always; }
        }
        @media screen {
          .pdf-root { max-width: 820px; margin: 0 auto; padding: 2rem; font-family: system-ui, sans-serif; color: #111; }
        }
        * { box-sizing: border-box; }
      `}</style>

      <div className="no-print" style={{ position: "sticky", top: 0, background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 50 }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: "14px" }}>Candidate Report</span>
          <span style={{ marginLeft: "12px", color: "#6b7280", fontSize: "13px" }}>{submission.candidateName}</span>
        </div>
        <Button onClick={() => window.print()} data-testid="button-print-results">
          <Printer className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <div className="pdf-root">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b7280", marginBottom: "4px" }}>
              Spartan Hospice Coaching — Candidate Evaluation Report
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 4px 0" }}>{submission.candidateName}</h1>
            <p style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}>{submission.candidateEmail}</p>
            <p style={{ color: "#6b7280", fontSize: "11px", margin: "4px 0 0 0" }}>
              {assessment.name} &bull; Completed {submission.completedAt ? new Date(submission.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            {isStructured && (
              <div style={{ display: "inline-block", background: tierColor, color: "#fff", borderRadius: "6px", padding: "6px 14px", fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>
                {aiData!.tier}
              </div>
            )}
            <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end", marginTop: "6px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 800 }}>{submission.overallScore ?? "—"}</div>
                <div style={{ fontSize: "10px", color: "#6b7280" }}>Overall Score</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 800 }}>{submission.quizScore ?? "—"}</div>
                <div style={{ fontSize: "10px", color: "#6b7280" }}>Quiz Score</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 800 }}>{submission.aiScore ?? "—"}</div>
                <div style={{ fontSize: "10px", color: "#6b7280" }}>Scenario Score</div>
              </div>
              {isStructured && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800 }}>{aiData!.fieldReadinessScore}</div>
                  <div style={{ fontSize: "10px", color: "#6b7280" }}>Field Readiness</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isStructured && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
              <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "16px" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", marginBottom: "12px" }}>Category Scores</div>
                {(() => {
                  const cs = aiData!.categoryScores;
                  const hasNewCategories = cs.spartanSalesModel !== undefined;
                  const max = hasNewCategories ? 12.5 : 25;
                  const categories = [
                    { key: "hospiceKnowledge", label: "Hospice Industry Knowledge" },
                    { key: "relationshipSelling", label: "Relationship-First Selling" },
                    { key: "empathyCommunication", label: "Empathy & Communication" },
                    { key: "strategicExecution", label: "Strategic Execution" },
                    ...(hasNewCategories ? [
                      { key: "spartanSalesModel", label: "Spartan Sales Model" },
                      { key: "objectionHandling", label: "Objection Handling" },
                      { key: "familyMeetingCompetence", label: "Family Meeting Competence" },
                      { key: "crmDiscipline", label: "CRM Discipline" },
                    ] : []),
                  ];
                  return categories.map(({ key, label }) => (
                    <ScoreBar key={key} value={(cs as Record<string, number>)[key] ?? 0} max={max} label={label} />
                  ));
                })()}
              </div>
              <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "16px" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", marginBottom: "10px" }}>Hiring Recommendation</div>
                <p style={{ fontSize: "13px", lineHeight: 1.6, margin: "0 0 12px 0" }}>{aiData!.hiringRecommendation}</p>
                {aiData!.quizAnalysis && (
                  <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "10px" }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", marginBottom: "6px" }}>Quiz Context</div>
                    <p style={{ fontSize: "11px", color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{aiData!.quizAnalysis}</p>
                  </div>
                )}
              </div>
            </div>

            {aiData!.executiveSummary && (
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "14px 16px", marginBottom: "20px" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0369a1", marginBottom: "8px" }}>Executive Summary</div>
                <p style={{ fontSize: "12px", margin: 0, lineHeight: 1.7 }}>{aiData!.executiveSummary}</p>
              </div>
            )}

            {aiData!.redFlags?.length > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "14px 16px", marginBottom: "20px" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#dc2626", marginBottom: "8px" }}>Red Flags Observed</div>
                {aiData!.redFlags.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: i > 0 ? "6px" : 0 }}>
                    <span style={{ color: "#dc2626", fontWeight: 700, flexShrink: 0 }}>!</span>
                    <p style={{ fontSize: "12px", margin: 0, lineHeight: 1.5 }}>{f}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
              {aiData!.strengths?.length > 0 && (
                <Section title="Strengths">
                  {aiData!.strengths.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ color: "#16a34a", fontWeight: 700, flexShrink: 0, fontSize: "13px" }}>+</span>
                      <p style={{ fontSize: "12px", margin: 0, lineHeight: 1.5 }}>{s}</p>
                    </div>
                  ))}
                </Section>
              )}
              {aiData!.developmentAreas?.length > 0 && (
                <Section title="Development Areas">
                  {aiData!.developmentAreas.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ color: "#d97706", fontWeight: 700, flexShrink: 0, fontSize: "13px" }}>-</span>
                      <p style={{ fontSize: "12px", margin: 0, lineHeight: 1.5 }}>{d}</p>
                    </div>
                  ))}
                </Section>
              )}
            </div>

            {aiData!.coachabilitySignals?.length > 0 && (
              <Section title="Coachability Signals">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {aiData!.coachabilitySignals.map((s, i) => (
                    <span key={i} style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "4px", padding: "3px 10px", fontSize: "11px" }}>{s}</span>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Candidate Potential">
              <p style={{ fontSize: "12px", lineHeight: 1.7, margin: 0 }}>{aiData!.candidatePotential}</p>
            </Section>

            <div className="page-break" />

            {aiData!.scenarioFeedback?.length > 0 && (
              <Section title="Scenario-by-Scenario Evaluation">
                <div style={{ display: "grid", gap: "14px" }}>
                  {aiData!.scenarioFeedback.map((sf, i) => {
                    const scenQ = scenarioQuestions.find(q => q.displayOrder === (sf.scenarioNumber + quizQuestions.length) || q.displayOrder === sf.scenarioNumber + quizQuestions.length);
                    const candidateAnswer = scenarioQuestions[i] ? answersObj[String(scenarioQuestions[i].id)] : null;
                    return (
                      <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontWeight: 700, fontSize: "12px" }}>Scenario {sf.scenarioNumber}: {sf.title}</span>
                        </div>
                        {candidateAnswer && (
                          <div style={{ background: "#f9fafb", borderRadius: "6px", padding: "10px", marginBottom: "10px" }}>
                            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "6px" }}>Candidate's Response</div>
                            <p style={{ fontSize: "11px", margin: 0, lineHeight: 1.6, color: "#374151", whiteSpace: "pre-wrap" }}>{candidateAnswer}</p>
                          </div>
                        )}
                        <div style={{ marginBottom: "8px" }}>
                          <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "4px" }}>Evaluation</div>
                          <p style={{ fontSize: "12px", margin: 0, lineHeight: 1.6 }}>{sf.feedback}</p>
                        </div>
                        {sf.strongerAnswer && (
                          <div style={{ background: "#f0fdf4", borderRadius: "6px", padding: "8px 12px" }}>
                            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#15803d", marginBottom: "4px" }}>What a Strong Candidate Would Say</div>
                            <p style={{ fontSize: "11px", margin: 0, lineHeight: 1.5, color: "#166534" }}>{sf.strongerAnswer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {aiData!.interviewGuide?.length > 0 && (
              <Section title="Interview Guide — Questions to Ask in a Live Conversation">
                <div style={{ display: "grid", gap: "10px" }}>
                  {aiData!.interviewGuide.map((item, i) => (
                    <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <span style={{ background: "#1e40af", color: "#fff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>{i + 1}</span>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "12px", margin: "0 0 4px 0" }}>{item.question}</p>
                          <p style={{ fontSize: "11px", color: "#6b7280", margin: 0, lineHeight: 1.4 }}>Intent: {item.intent}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {aiData!.developmentPlan?.length > 0 && (
              <Section title="Coaching and Development Plan">
                <div style={{ display: "grid", gap: "10px" }}>
                  {aiData!.developmentPlan.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px" }}>
                      <span style={{ background: "#7c3aed", color: "#fff", borderRadius: "4px", padding: "2px 8px", fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>FOCUS</span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "12px", margin: "0 0 4px 0" }}>{item.focus}</p>
                        <p style={{ fontSize: "11px", color: "#6b7280", margin: 0, lineHeight: 1.4 }}>{item.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        {!isStructured && submission.aiFeedback && (
          <Section title="AI Evaluation">
            <p style={{ fontSize: "12px", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{submission.aiFeedback}</p>
          </Section>
        )}

        <div className="page-break" />

        <Section title={`Quiz Results — ${correctCount} of ${quizQuestions.length} Correct`}>
          <div style={{ display: "grid", gap: "12px" }}>
            {quizQuestions.map((q, idx) => {
              const candidateAns = answersObj[String(q.id)];
              const isCorrect = candidateAns && q.correctAnswer && candidateAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              return (
                <div key={q.id} style={{ border: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}`, borderRadius: "6px", padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ fontWeight: 700, color: isCorrect ? "#16a34a" : "#dc2626", flexShrink: 0, fontSize: "12px" }}>{isCorrect ? "+" : "-"}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: "11px", margin: "0 0 4px 0" }}>{idx + 1}. {q.text}</p>
                      <p style={{ fontSize: "11px", margin: "0 0 2px 0", color: isCorrect ? "#16a34a" : "#dc2626" }}>
                        Selected: {candidateAns || "No answer"}
                      </p>
                      {!isCorrect && q.correctAnswer && (
                        <p style={{ fontSize: "11px", margin: 0, color: "#6b7280" }}>Correct: {q.correctAnswer}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {scenarioQuestions.length > 0 && (
          <Section title="Full Scenario Responses">
            <div style={{ display: "grid", gap: "14px" }}>
              {scenarioQuestions.map((q, idx) => {
                const candidateAns = answersObj[String(q.id)];
                return (
                  <div key={q.id} style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px" }}>
                    <p style={{ fontWeight: 600, fontSize: "11px", margin: "0 0 8px 0" }}>Scenario {idx + 1}. {q.text}</p>
                    <div style={{ background: "#f9fafb", borderRadius: "4px", padding: "10px" }}>
                      <p style={{ fontSize: "11px", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap", color: candidateAns ? "#111" : "#9ca3af" }}>
                        {candidateAns || "(No response provided)"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#9ca3af" }}>
          <span>Spartan Hospice Coaching &bull; nick@spartanhospicecoaching.com</span>
          <span>Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </div>
    </>
  );
}
