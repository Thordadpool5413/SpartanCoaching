import { useState, useRef, useEffect } from "react";
import { ReminderPicker } from "@/components/ReminderPicker";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CoachingCTA } from "@/components/CoachingCTA";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/SEO";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { markFieldKitChecklistDone } from "@/lib/fieldKitProgress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/MarkdownContent";
import { downloadPdf, markdownToSections, cleanMarkdown, type EmailPdfPayload, type PdfSection } from "@/lib/downloadPdf";
import { useLeadGate } from "@/hooks/use-lead-gate";
import { LeadGateDialog } from "@/components/LeadGateDialog";
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
  ProgressRing,
  AnimatedCounter,
  PulsingDot,
} from "@/components/animations";
import {
  Stethoscope,
  Users,
  Clock,
  FileText,
  Home,
  UserCheck,
  Activity,
  Shield,
  Pill,
  Building2,
  Pencil,
  Target,
  Send,
  Loader2,
  ArrowLeft,
  Star,
  MessageCircle,
  CheckCircle,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { ToolResultActions } from "@/components/ToolResultActions";

const SCENARIOS = [
  { id: "skeptical_oncologist", title: "Skeptical Oncologist", description: "Push through hesitation about hospice timing with a doubting specialist.", icon: Stethoscope, difficulty: "Advanced" as const },
  { id: "family_not_ready", title: "Family Not Ready", description: "Navigate grief and resistance when a patient's family resists the conversation.", icon: Users, difficulty: "Intermediate" as const },
  { id: "busy_hospitalist", title: "Busy Hospitalist", description: "Capture attention and earn referrals from a time-pressed hospital doctor.", icon: Clock, difficulty: "Intermediate" as const },
  { id: "insurance_concerns", title: "Insurance Concerns", description: "Address fears about coverage, costs, and what hospice actually covers.", icon: FileText, difficulty: "Beginner" as const },
  { id: "ltc_facility_director", title: "LTC Facility Director", description: "Break through gatekeeping at a long-term care facility and earn a trial referral.", icon: Home, difficulty: "Advanced" as const },
  { id: "hospital_social_worker", title: "Hospital Social Worker", description: "Connect with an overwhelmed social worker juggling discharge deadlines and referral choices.", icon: UserCheck, difficulty: "Intermediate" as const },
  { id: "reluctant_pcp", title: "Reluctant Primary Care Physician", description: "Persuade a PCP who resists hospice referrals for fear of upsetting long-standing patients.", icon: Activity, difficulty: "Advanced" as const },
  { id: "veteran_family", title: "Veteran's Family", description: "Navigate VA benefit confusion and emotional resistance with a proud veteran's family.", icon: Shield, difficulty: "Intermediate" as const },
  { id: "palliative_care_coordinator", title: "Palliative Care Coordinator", description: "Collaborate — not compete — with a palliative coordinator who guards her patient relationships.", icon: Pill, difficulty: "Advanced" as const },
  { id: "home_health_rn", title: "Home Health RN", description: "Build a cross-referral partnership with a home health nurse who has overlapping patients.", icon: Building2, difficulty: "Beginner" as const },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1" data-testid="display-typing-indicator">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function getDifficultyVariant(difficulty: string) {
  switch (difficulty) {
    case "Beginner":
      return "secondary";
    case "Intermediate":
      return "default";
    case "Advanced":
      return "destructive";
    default:
      return "secondary";
  }
}

function getScoreColor(rating: number) {
  if (rating < 5) return "hsl(0, 72%, 51%)";
  if (rating <= 7) return "hsl(45, 93%, 47%)";
  return "hsl(142, 71%, 45%)";
}

export default function RolePlay() {
  const { capture, gateState } = useLeadGate("Role-Play Session");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; rating: number } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"selecting" | "active" | "feedback" | "loading_feedback">("selecting");
  const [input, setInput] = useState("");
  const [activeScenarioTitle, setActiveScenarioTitle] = useState("");
  const [activeScenarioId, setActiveScenarioId] = useState("");
  const [customExpanded, setCustomExpanded] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartSession = async (scenarioId: string, scenarioTitle: string, scenarioDescription?: string) => {
    setIsLoading(true);
    setActiveScenarioTitle(scenarioTitle);
    setActiveScenarioId(scenarioId);
    try {
      const response = await fetch("/api/roleplay/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, scenarioTitle, ...(scenarioDescription ? { scenarioDescription } : {}) }),
      });
      if (!response.ok) throw new Error("Failed to start session");
      const data = await response.json();
      setActiveSessionId(data.session.id);
      setMessages([{ role: "character", content: data.initialMessage }]);
      setSessionStatus("active");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start role-play session", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !activeSessionId) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/roleplay/sessions/${activeSessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "character", content: data.response }]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to get response", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSessionId) return;
    setSessionStatus("loading_feedback");
    try {
      const response = await fetch(`/api/roleplay/sessions/${activeSessionId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to get feedback");
      const data = await response.json();
      setFeedback({ text: data.feedback, rating: data.rating });
      setSessionStatus("feedback");
      void markFieldKitChecklistDone("roleplay");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to get feedback", variant: "destructive" });
      setSessionStatus("active");
    }
  };

  const handlePracticeAgain = () => {
    setActiveSessionId(null);
    setMessages([]);
    setFeedback(null);
    setInput("");
    setActiveScenarioTitle("");
    setActiveScenarioId("");
    setCustomExpanded(false);
    setCustomTitle("");
    setCustomDescription("");
    setSessionStatus("selecting");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canEndSession = messages.filter(m => m.role === "user").length >= 2;

  const getScoreLabel = (rating: number) =>
    rating >= 8 ? "Excellent Performance" : rating >= 5 ? "Good Progress" : "Keep Practicing";

  const buildRoleplayPdfPayload = (): { sections: PdfSection[]; subtitle: string } => {
    const rating = feedback?.rating ?? 0;
    const scoreLabel = getScoreLabel(rating);
    const rawFeedback = feedback?.text ?? "";

    const feedbackSections: PdfSection[] = markdownToSections(rawFeedback).map((s) => ({
      heading: s.heading,
      body: cleanMarkdown(s.body),
    }));

    const conversationBody = messages
      .map((m) => `${m.role === "user" ? "You" : activeScenarioTitle}: ${m.content}`)
      .join("\n\n");

    const sections: PdfSection[] = [
      {
        heading: "Performance Score",
        body: `${rating}/10 — ${scoreLabel}`,
      },
      ...feedbackSections,
      {
        heading: "Conversation Transcript",
        body: conversationBody,
      },
    ];

    return {
      sections,
      subtitle: `${activeScenarioTitle} · Score: ${rating}/10 (${scoreLabel})`,
    };
  };

  const handleDownloadFeedback = async () => {
    try {
      const { sections, subtitle } = buildRoleplayPdfPayload();
      await downloadPdf(
        `spartan-roleplay-${activeScenarioId}-${Date.now()}`,
        "Role-Play Session Feedback",
        sections,
        subtitle,
      );
      toast({ title: "Downloaded", description: "Your session PDF is ready." });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message || "Could not generate PDF.", variant: "destructive" });
    }
  };

  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId);
  const ActiveIcon = activeScenario?.icon || MessageCircle;

  if (sessionStatus === "selecting") {
    return (
      <FieldKitToolLayout toolPath="/tools/role-play">
        <SEO />
        <SlideUp>
          <h1 className="text-h1 font-black text-foreground mb-4" data-testid="text-roleplay-title">
            Role-Play Practice
          </h1>
        </SlideUp>
        <SlideUp delay={0.1}>
          <p className="text-body-lg text-muted-foreground mb-10 leading-relaxed max-w-2xl" data-testid="text-roleplay-subtitle">
            Sharpen your hospice sales skills by practicing realistic conversations in simulated scenarios. Choose a scenario below and start your practice session.
          </p>
        </SlideUp>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <StaggerItem key={scenario.id}>
                <Card
                  className="group relative hover-elevate spacing-card flex flex-col"
                  data-testid={`card-scenario-${scenario.id}`}
                >
                  <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="relative flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <Badge
                        variant={getDifficultyVariant(scenario.difficulty)}
                        data-testid={`badge-difficulty-${scenario.id}`}
                      >
                        {scenario.difficulty}
                      </Badge>
                    </div>
                    <h3 className="text-h3 font-bold text-foreground mb-2" data-testid={`text-scenario-title-${scenario.id}`}>
                      {scenario.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-5 flex-1 leading-relaxed" data-testid={`text-scenario-desc-${scenario.id}`}>
                      {scenario.description}
                    </p>
                    <Button
                      onClick={() => capture(() => handleStartSession(scenario.id, scenario.title))}
                      disabled={isLoading}
                      className="w-full font-bold touch-manipulation"
                      data-testid={`button-start-${scenario.id}`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <MessageCircle className="w-4 h-4 mr-2" />
                      )}
                      Start Practice
                    </Button>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}

          {/* Custom Scenario card */}
          <StaggerItem>
            <Card
              className="group relative hover-elevate spacing-card flex flex-col"
              data-testid="card-scenario-custom"
            >
              <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative flex flex-col flex-1">
                <button
                  className="flex items-start justify-between gap-3 mb-4 w-full text-left"
                  onClick={() => setCustomExpanded((v) => !v)}
                  data-testid="button-toggle-custom"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-muted-foreground/40 to-muted-foreground/20 flex items-center justify-center shrink-0">
                      <Pencil className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-h3 font-bold text-foreground" data-testid="text-scenario-title-custom">
                        Custom Scenario
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Define your own character and situation
                      </p>
                    </div>
                  </div>
                  {customExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                  )}
                </button>

                {customExpanded && (
                  <div className="flex flex-col gap-3" data-testid="display-custom-form">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                        Scenario Title <span className="text-destructive">*</span>
                      </label>
                      <input
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g. Resistant SNF Charge Nurse"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        data-testid="input-custom-title"
                        maxLength={80}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                        Character Description <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                      </label>
                      <Textarea
                        placeholder="Describe the character's role, personality, and objections…"
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        rows={3}
                        className="text-sm"
                        data-testid="input-custom-description"
                        maxLength={500}
                      />
                    </div>
                    <Button
                      onClick={() => capture(() => handleStartSession("custom", customTitle.trim(), customDescription.trim() || undefined))}
                      disabled={isLoading || customTitle.trim().length < 3}
                      className="w-full font-bold touch-manipulation"
                      data-testid="button-start-custom"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <MessageCircle className="w-4 h-4 mr-2" />
                      )}
                      Start Custom Session
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      <LeadGateDialog gateState={gateState} />
      </FieldKitToolLayout>
    );
  }

  if (sessionStatus === "feedback") {
    const rating = feedback?.rating ?? 0;
    const scoreColor = getScoreColor(rating);
    const feedbackSections = parseFeedbackSections(feedback?.text || "");

    return (
      <FieldKitToolLayout toolPath="/tools/role-play" className="max-w-3xl">
        <SEO />

        <FadeIn>
          <Card className="spacing-card" data-testid="card-feedback">
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="destructive" data-testid="badge-scenario-feedback">
                  {activeScenarioTitle}
                </Badge>
                <span className="text-sm text-muted-foreground">Session Complete</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" data-testid="button-share-feedback" onClick={() => {
                  const scoreLabel = (feedback?.rating ?? 0) >= 8 ? "Excellent Performance" : (feedback?.rating ?? 0) >= 5 ? "Good Progress" : "Keep Practicing";
                  const summary = `Spartan Coaching Role-Play: ${activeScenarioTitle}\nScore: ${feedback?.rating ?? 0}/10 (${scoreLabel})\nPracticed on ${new Date().toLocaleDateString()}`;
                  navigator.clipboard.writeText(summary).then(() => {
                    toast({ title: "Copied to clipboard", description: "Session summary ready to share." });
                  });
                }}>
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Share
                </Button>
                <Button variant="outline" size="sm" data-testid="button-download-feedback" onClick={() => {
                  const getEmailPdf = (): EmailPdfPayload => {
                    const { sections, subtitle } = buildRoleplayPdfPayload();
                    return {
                      sections,
                      title: "Role-Play Session Feedback",
                      filename: `spartan-roleplay-${activeScenarioId}`,
                      subtitle,
                    };
                  };
                  capture(handleDownloadFeedback, getEmailPdf);
                }}>
                  <Download className="w-4 h-4 mr-1.5" />
                  Download
                </Button>
              </div>
            </div>

            <SlideUp>
              <h2 className="text-h2 font-bold text-foreground mb-6" data-testid="text-feedback-heading">
                Performance Feedback
              </h2>
            </SlideUp>

            <SlideUp delay={0.15}>
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="relative flex items-center justify-center" data-testid="display-score-gauge">
                  <ProgressRing
                    progress={(rating / 10) * 100}
                    size={120}
                    strokeWidth={8}
                    color={scoreColor}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatedCounter
                      target={rating}
                      className="text-3xl font-black text-foreground"
                      suffix="/10"
                    />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg font-semibold text-foreground" data-testid="text-score-label">
                    {rating >= 8 ? "Excellent Performance" : rating >= 5 ? "Good Progress" : "Keep Practicing"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on your conversation with {activeScenarioTitle}
                  </p>
                </div>
              </div>
            </SlideUp>

            {feedbackSections.strengths.length > 0 && (
              <SlideUp delay={0.25}>
                <div className="mb-6" data-testid="display-strengths">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-lg font-bold text-foreground">Strengths</h3>
                  </div>
                  <Card className="spacing-card bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/30">
                    <MarkdownContent content={feedbackSections.strengths.join("\n")} />
                  </Card>
                </div>
              </SlideUp>
            )}

            {feedbackSections.improvements.length > 0 && (
              <SlideUp delay={0.35}>
                <div className="mb-6" data-testid="display-improvements">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-lg font-bold text-foreground">Areas to Improve</h3>
                  </div>
                  <Card className="spacing-card bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30">
                    <MarkdownContent content={feedbackSections.improvements.join("\n")} />
                  </Card>
                </div>
              </SlideUp>
            )}

            {feedbackSections.general.length > 0 && (
              <SlideUp delay={0.45}>
                <div className="mb-8" data-testid="display-general-feedback">
                  <div data-testid="text-feedback-content">
                    <MarkdownContent content={feedbackSections.general.join("\n")} />
                  </div>
                </div>
              </SlideUp>
            )}

            <SlideUp delay={0.5}>
              <div className="mb-6">
                <ReminderPicker title={`Follow up after ${activeScenarioTitle} practice`} />
              </div>
            </SlideUp>

            <ToolResultActions
              toolId="role-play"
              description="Carry the coaching into the field: draft the follow-up you will send, or run the scenario again with one improvement."
              actions={[
                {
                  id: "draft-follow-up",
                  label: "Draft Follow-Up Email",
                  href: "/tools/email-templates",
                },
                {
                  id: "practice-again",
                  label: "Practice Again",
                  icon: RotateCcw,
                  onClick: handlePracticeAgain,
                },
              ]}
              persistenceNote="This role-play session and feedback are retained in your member workspace. Do not add patient identifiers or other sensitive details."
              testId="roleplay-next-action"
            />

            <CoachingCTA className="mb-6" />
          </Card>
        </FadeIn>
      <LeadGateDialog gateState={gateState} />
      </FieldKitToolLayout>
    );
  }

  return (
    <FieldKitToolLayout toolPath="/tools/role-play" className="max-w-4xl flex flex-col" >
      <SEO />

      <Card className="mb-4 spacing-card" data-testid="display-conversation-header">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
              <ActiveIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight" data-testid="text-conversation-title">
                {activeScenarioTitle}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <PulsingDot className="text-green-500" />
                  Live Practice
                </span>
                <Badge variant="secondary" data-testid="badge-message-count">
                  {messages.length} messages
                </Badge>
              </div>
            </div>
          </div>
          <div className="relative" title={!canEndSession ? "Send at least 2 messages to unlock feedback" : undefined}>
            <Button
              variant="outline"
              onClick={handleEndSession}
              disabled={sessionStatus === "loading_feedback" || isLoading || !canEndSession}
              className="font-bold touch-manipulation"
              data-testid="button-end-session"
            >
              {sessionStatus === "loading_feedback" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Star className="w-4 h-4 mr-2" />
              )}
              End & Get Feedback
            </Button>
            {!canEndSession && (
              <p className="absolute right-0 top-full mt-1 text-xs text-muted-foreground text-right max-w-[200px] sm:max-w-none" data-testid="text-end-hint">
                Send 2 more messages to unlock
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="flex-1 flex flex-col overflow-hidden" data-testid="card-conversation">
        <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="display-messages">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              data-testid={`chat-message-${index}`}
            >
              {msg.role === "character" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5" data-testid={`avatar-character-${index}`}>
                  <span className="text-xs font-bold text-primary-foreground">
                    {activeScenarioTitle.charAt(0)}
                  </span>
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-md p-3",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground border border-border"
                )}
              >
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <MarkdownContent content={msg.content} variant="compact" />
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5" data-testid={`avatar-user-${index}`}>
                  <span className="text-xs font-bold text-accent-foreground">You</span>
                </div>
              )}
            </motion.div>
          ))}
          {(isLoading || sessionStatus === "loading_feedback") && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
              data-testid="display-loading-indicator"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary-foreground">
                  {activeScenarioTitle.charAt(0)}
                </span>
              </div>
              <div className="bg-muted text-foreground rounded-md p-3 border border-border">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="min-h-[48px] max-h-32 resize-none text-sm rounded-md"
              disabled={sessionStatus === "loading_feedback"}
              data-testid="textarea-roleplay-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || sessionStatus === "loading_feedback"}
              size="icon"
              data-testid="button-send-roleplay"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
      <LeadGateDialog gateState={gateState} />
    </FieldKitToolLayout>
  );
}

function parseFeedbackSections(text: string) {
  const headingRegex = /^##\s+(.+)$/m;
  const hasHeadings = headingRegex.test(text);

  if (!hasHeadings) {
    return { strengths: [], improvements: [], general: [text] };
  }

  const parts = text.split(/^##\s+/m).filter(Boolean);
  const strengths: string[] = [];
  const improvements: string[] = [];
  const general: string[] = [];

  for (const part of parts) {
    const firstNewline = part.indexOf("\n");
    if (firstNewline === -1) continue;
    const heading = part.slice(0, firstNewline).toLowerCase();
    const body = part.slice(firstNewline + 1).trim();
    if (!body) continue;

    if (
      heading.includes("went well") ||
      heading.includes("strength") ||
      heading.includes("positive") ||
      heading.includes("well done") ||
      heading.includes("effective")
    ) {
      strengths.push(body);
    } else if (
      heading.includes("improve") ||
      heading.includes("area") ||
      heading.includes("suggestion") ||
      heading.includes("weakness") ||
      heading.includes("work on") ||
      heading.includes("develop")
    ) {
      improvements.push(body);
    } else {
      general.push(`## ${part.slice(0, firstNewline)}\n${body}`);
    }
  }

  return { strengths, improvements, general };
}
