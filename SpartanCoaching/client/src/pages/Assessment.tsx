import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, ArrowRight, ArrowLeft, ClipboardList, Send, Award } from "lucide-react";
import type { SelectAssessmentQuestion } from "@shared/schema";

type Screen = "intake" | "questions" | "submitting" | "results";

interface PublicQuestion {
  id: number;
  type: string;
  text: string;
  options: string[] | null;
  displayOrder: number;
}

interface SubmissionResult {
  overallScore: number;
  quizScore: number | null;
  aiScore: number | null;
  feedback: string;
}

interface ClientBranding {
  companyName: string;
  logoUrl: string | null;
  accentColor: string | null;
  slug: string;
}

interface AssessmentProps {
  overrideAssessmentId?: number;
  clientBranding?: ClientBranding;
}

export default function Assessment({ overrideAssessmentId, clientBranding }: AssessmentProps = {}) {
  const { id } = useParams<{ id: string }>();
  const assessmentId = overrideAssessmentId || parseInt(id || "0");
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const inviteToken = urlParams.get("token") || "";

  const [screen, setScreen] = useState<Screen>("intake");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isInvite, setIsInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteUsedName, setInviteUsedName] = useState<string | null>(null);

  const { data: inviteData, isLoading: inviteLoading } = useQuery<{
    candidateName: string;
    candidateEmail: string;
    assessmentId: number;
    used: boolean;
  }>({
    queryKey: ["/api/assessment-invites", inviteToken],
    queryFn: async () => {
      const res = await fetch(`/api/assessment-invites/${inviteToken}`);
      if (res.status === 410) {
        const body = await res.json();
        setInviteUsedName(body.candidateName || "");
        throw new Error("USED");
      }
      if (!res.ok) throw new Error("INVALID");
      return res.json();
    },
    enabled: !!inviteToken,
    retry: false,
  });

  useEffect(() => {
    if (inviteData) {
      setCandidateName(inviteData.candidateName);
      setCandidateEmail(inviteData.candidateEmail);
      setIsInvite(true);
    }
  }, [inviteData]);

  const { data, isLoading, error } = useQuery<{
    assessment: { id: number; name: string; description: string | null };
    questions: PublicQuestion[];
  }>({
    queryKey: ["/api/assessments", assessmentId, "public"],
    queryFn: async () => {
      const res = await fetch(`/api/assessments/${assessmentId}/public`);
      if (!res.ok) throw new Error("Assessment not found");
      return res.json();
    },
    enabled: assessmentId > 0,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload: {
        candidateName: string;
        candidateEmail: string;
        answers: Record<string, string>;
        inviteToken?: string;
        clientSlug?: string;
      } = { candidateName, candidateEmail, answers };
      if (inviteToken) payload.inviteToken = inviteToken;
      if (clientBranding?.slug) payload.clientSlug = clientBranding.slug;
      const res = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResult({
        overallScore: data.overallScore,
        quizScore: data.quizScore,
        aiScore: data.aiScore,
        feedback: data.feedback,
      });
      setScreen("results");
    },
  });

  if (isLoading || (inviteToken && inviteLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="display-loading">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (inviteToken && !inviteData) {
    const isUsed = inviteUsedName !== null;
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center" data-testid="display-invite-error">
        <SEO title="Invite Link Invalid" />
        <h1 className="text-h1 font-bold text-foreground mb-4">
          {isUsed ? "Invite Already Used" : "Invalid Invite Link"}
        </h1>
        <p className="text-muted-foreground">
          {isUsed
            ? `This assessment invite for ${inviteUsedName} has already been completed. Each invite link can only be used once.`
            : "This invite link is invalid or has expired. Please contact the person who sent you this link for a new one."}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center" data-testid="display-error">
        <SEO title="Assessment Not Found" />
        <h1 className="text-h1 font-bold text-foreground mb-4">Assessment Not Found</h1>
        <p className="text-muted-foreground">This assessment link may be invalid or expired.</p>
      </div>
    );
  }

  const { assessment, questions } = data;

  if (questions.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center" data-testid="display-empty">
        <SEO title={assessment.name} />
        <h1 className="text-h1 font-bold text-foreground mb-4">{assessment.name}</h1>
        <p className="text-muted-foreground">This assessment has no questions yet. Please check back later.</p>
      </div>
    );
  }

  const question = questions[currentQ];
  const totalQuestions = questions.length;
  const progress = screen === "questions" ? Math.round(((currentQ + 1) / totalQuestions) * 100) : 0;

  const handleStartAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim()) return;
    setScreen("questions");
  };

  const handleSelectOption = (option: string) => {
    if (!question) return;
    setAnswers(prev => ({ ...prev, [String(question.id)]: option }));
  };

  const handleScenarioChange = (value: string) => {
    if (!question) return;
    setAnswers(prev => ({ ...prev, [String(question.id)]: value }));
  };

  const handleNext = () => {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handleSubmit = () => {
    setScreen("submitting");
    submitMutation.mutate();
  };

  const isLastQuestion = currentQ === totalQuestions - 1;
  const currentAnswer = question ? answers[String(question.id)] || "" : "";
  const hasAnswer = currentAnswer.trim().length > 0;

  const scoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Proficient";
    if (score >= 40) return "Developing";
    return "Needs Improvement";
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const brandingStyle = clientBranding?.accentColor ? {
    '--brand-accent': clientBranding.accentColor,
    '--brand-accent-fg': '#ffffff',
  } as React.CSSProperties : {};

  const accentBtnClass = clientBranding?.accentColor
    ? "text-white border-transparent"
    : "";
  const accentBtnStyle = clientBranding?.accentColor
    ? { backgroundColor: clientBranding.accentColor }
    : {};
  const accentBarStyle = clientBranding?.accentColor
    ? { backgroundColor: clientBranding.accentColor }
    : {};

  const BrandedHeader = () => {
    if (!clientBranding) return null;
    return (
      <div className="text-center mb-6" data-testid="display-branded-header">
        {clientBranding.logoUrl && (
          <img
            src={clientBranding.logoUrl}
            alt={clientBranding.companyName}
            className="h-12 mx-auto mb-3 object-contain"
            data-testid="img-client-logo"
          />
        )}
        <p className="text-sm font-medium text-muted-foreground" data-testid="text-client-name">
          {clientBranding.companyName} Assessment
        </p>
      </div>
    );
  };

  const PoweredByFooter = () => {
    if (!clientBranding) return null;
    return (
      <div className="text-center mt-8 pt-4 border-t" data-testid="display-powered-by">
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <a href="/" className="font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
            Spartan Coaching
          </a>
        </p>
      </div>
    );
  };

  if (screen === "intake") {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-12 sm:py-20" style={brandingStyle}>
        <SEO title={clientBranding ? `${clientBranding.companyName} Assessment` : assessment.name} />
        <BrandedHeader />
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-h1 font-bold text-foreground mb-3" data-testid="text-assessment-title">
            {assessment.name}
          </h1>
          {assessment.description && (
            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto" data-testid="text-assessment-description">
              {assessment.description}
            </p>
          )}
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <Badge variant="secondary" data-testid="badge-question-count">{totalQuestions} questions</Badge>
            <Badge variant="secondary">
              {questions.filter(q => q.type === "quiz").length} quiz, {questions.filter(q => q.type === "scenario").length} scenario
            </Badge>
          </div>
        </div>

        <Card data-testid="card-intake-form">
          <CardHeader>
            <CardTitle className="text-lg">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartAssessment} className="space-y-4">
              <div>
                <Label htmlFor="candidateName">Full Name</Label>
                <Input
                  id="candidateName"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  readOnly={isInvite}
                  className={isInvite ? "bg-muted cursor-not-allowed" : ""}
                  data-testid="input-candidate-name"
                />
              </div>
              <div>
                <Label htmlFor="candidateEmail">Email Address</Label>
                <Input
                  id="candidateEmail"
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  readOnly={isInvite}
                  className={isInvite ? "bg-muted cursor-not-allowed" : ""}
                  data-testid="input-candidate-email"
                />
              </div>
              <Button type="submit" className={cn("w-full font-bold", accentBtnClass)} style={accentBtnStyle} data-testid="button-start-assessment">
                Begin Assessment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
        <PoweredByFooter />
      </div>
    );
  }

  if (screen === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4" data-testid="display-submitting">
        <SEO title={`Submitting - ${assessment.name}`} />
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-semibold text-foreground mb-2">Scoring Your Assessment</p>
        <p className="text-muted-foreground text-center max-w-sm">
          We are evaluating your responses using AI. This may take a moment.
        </p>
        {submitMutation.isError && (
          <div className="mt-6 text-center">
            <p className="text-destructive mb-3">{submitMutation.error?.message || "Something went wrong"}</p>
            <Button onClick={() => { setScreen("questions"); setCurrentQ(totalQuestions - 1); }} variant="outline" data-testid="button-retry">
              Go Back
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (screen === "results" && result) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-12 sm:py-20" style={brandingStyle}>
        <SEO title={clientBranding ? `Results - ${clientBranding.companyName}` : `Results - ${assessment.name}`} />
        <BrandedHeader />
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-h1 font-bold text-foreground mb-2" data-testid="text-results-title">
            Assessment Complete
          </h1>
          <p className="text-muted-foreground">
            Thank you, {candidateName}. Here are your results.
          </p>
        </div>

        <Card className="mb-6" data-testid="card-score-summary">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className={cn("text-6xl font-black mb-1", scoreColor(result.overallScore))} data-testid="text-overall-score">
                {result.overallScore}%
              </div>
              <p className={cn("text-lg font-semibold", scoreColor(result.overallScore))} data-testid="text-score-label">
                {scoreLabel(result.overallScore)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {result.quizScore !== null && (
                <div className="text-center p-4 rounded-md bg-muted/50" data-testid="display-quiz-score">
                  <p className="text-2xl font-bold text-foreground">{result.quizScore}%</p>
                  <p className="text-sm text-muted-foreground">Quiz Accuracy</p>
                </div>
              )}
              {result.aiScore !== null && (
                <div className="text-center p-4 rounded-md bg-muted/50" data-testid="display-ai-score">
                  <p className="text-2xl font-bold text-foreground">{result.aiScore}%</p>
                  <p className="text-sm text-muted-foreground">Scenario Score</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-next-steps">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Results Submitted</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your results have been recorded and shared with the hiring team. A confirmation email has been sent to {candidateEmail}. The hiring team will review your results and be in touch regarding next steps.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <PoweredByFooter />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-16" style={brandingStyle}>
      <SEO title={`${assessment.name} - Question ${currentQ + 1}`} />
      <BrandedHeader />

      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <p className="text-sm text-muted-foreground" data-testid="text-progress-label">
            Question {currentQ + 1} of {totalQuestions}
          </p>
          <Badge variant="secondary" data-testid="badge-question-type">
            {question.type === "quiz" ? "Multiple Choice" : "Written Response"}
          </Badge>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden" data-testid="display-progress-bar">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, ...accentBarStyle }}
          />
        </div>
      </div>

      <Card className="mb-6" data-testid={`card-question-${currentQ}`}>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 leading-relaxed" data-testid="text-question">
            {question.text}
          </h2>

          {question.type === "quiz" && question.options && (
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option)}
                  className={cn(
                    "w-full text-left p-4 rounded-md border transition-colors",
                    currentAnswer === option
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover-elevate"
                  )}
                  style={currentAnswer === option && clientBranding?.accentColor ? { borderColor: clientBranding.accentColor, ringColor: clientBranding.accentColor, boxShadow: `0 0 0 1px ${clientBranding.accentColor}` } : {}}
                  data-testid={`option-${idx}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center",
                        currentAnswer === option ? "border-primary" : "border-muted-foreground/30"
                      )}
                      style={currentAnswer === option && clientBranding?.accentColor ? { borderColor: clientBranding.accentColor } : {}}
                    >
                      {currentAnswer === option && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" style={accentBarStyle} />
                      )}
                    </div>
                    <span className="text-sm text-foreground leading-relaxed">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {question.type === "scenario" && (
            <Textarea
              value={currentAnswer}
              onChange={(e) => handleScenarioChange(e.target.value)}
              placeholder="Write your response here..."
              className="min-h-[150px] text-sm"
              data-testid="textarea-scenario"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentQ === 0}
          data-testid="button-prev"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={handleSubmit}
            disabled={!hasAnswer}
            className={cn("font-bold", accentBtnClass)}
            style={accentBtnStyle}
            data-testid="button-submit"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Assessment
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!hasAnswer}
            className={accentBtnClass}
            style={accentBtnStyle}
            data-testid="button-next"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
      <PoweredByFooter />
    </div>
  );
}
