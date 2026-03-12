import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CoachingCTA } from "@/components/CoachingCTA";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/MarkdownContent";
import { downloadPdf, type EmailPdfPayload } from "@/lib/downloadPdf";
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
  Phone,
  Stethoscope,
  Heart,
  Building2,
  Home,
  Target,
  Send,
  Loader2,
  ArrowLeft,
  Star,
  MessageCircle,
  CheckCircle,
  Download,
  Share2,
} from "lucide-react";

const SCENARIOS = [
  { id: "cold_call_snf", title: "Cold Call: SNF Director", description: "Practice cold-calling a busy, skeptical Skilled Nursing Facility Director of Nursing.", icon: Phone, difficulty: "Intermediate" as const },
  { id: "physician_objection", title: "Physician Objection", description: "Handle a physician who is hesitant about hospice referrals and believes in aggressive treatment.", icon: Stethoscope, difficulty: "Advanced" as const },
  { id: "family_consultation", title: "Family Consultation", description: "Guide an emotional family member through understanding what hospice care really means.", icon: Heart, difficulty: "Beginner" as const },
  { id: "hospital_discharge", title: "Hospital Discharge Planner", description: "Impress an overworked discharge planner comparing multiple hospice providers.", icon: Building2, difficulty: "Intermediate" as const },
  { id: "assisted_living_admin", title: "Assisted Living Admin", description: "Address concerns from a facility administrator about hospice presence in their community.", icon: Home, difficulty: "Beginner" as const },
  { id: "competitor_territory", title: "Win from Competitor", description: "Convince a satisfied referral source to consider switching from their current hospice provider.", icon: Target, difficulty: "Advanced" as const },
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartSession = async (scenarioId: string, scenarioTitle: string) => {
    setIsLoading(true);
    setActiveScenarioTitle(scenarioTitle);
    setActiveScenarioId(scenarioId);
    try {
      const response = await fetch("/api/roleplay/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, scenarioTitle }),
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
    setSessionStatus("selecting");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canEndSession = messages.filter(m => m.role === "user").length >= 2;

  const handleDownloadFeedback = async () => {
    const scoreLabel = (feedback?.rating ?? 0) >= 8 ? "Excellent Performance" : (feedback?.rating ?? 0) >= 5 ? "Good Progress" : "Keep Practicing";
    try {
      await downloadPdf(
        `spartan-roleplay-${activeScenarioId}-${Date.now()}`,
        "Role-Play Session Transcript",
        [
          {
            heading: "Conversation",
            body: messages.map((m) => `${m.role === "user" ? "You" : "Spartan Coach"}: ${m.content}`).join("\n\n"),
          },
          {
            heading: "Performance Feedback",
            body: feedback?.text ?? "",
          },
        ],
        `${activeScenarioTitle} · Score: ${feedback?.rating ?? 0}/10 (${scoreLabel})`
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <SEO />
        <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Role-Play Practice" }]} />
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
        </StaggerContainer>
      <LeadGateDialog gateState={gateState} />
      </div>
    );
  }

  if (sessionStatus === "feedback") {
    const rating = feedback?.rating ?? 0;
    const scoreColor = getScoreColor(rating);
    const feedbackSections = parseFeedbackSections(feedback?.text || "");

    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <SEO />
        <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Role-Play Practice" }]} />

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
                    const scoreLabel = (feedback?.rating ?? 0) >= 8 ? "Excellent Performance" : (feedback?.rating ?? 0) >= 5 ? "Good Progress" : "Keep Practicing";
                    return {
                      sections: [
                        { heading: "Conversation", body: messages.map((m) => `${m.role === "user" ? "You" : "Spartan Coach"}: ${m.content}`).join("\n\n") },
                        { heading: "Performance Feedback", body: feedback?.text ?? "" },
                      ],
                      title: "Role-Play Session Transcript",
                      filename: `spartan-roleplay-${activeScenarioId}`,
                      subtitle: `${activeScenarioTitle} · Score: ${feedback?.rating ?? 0}/10 (${scoreLabel})`,
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

            <CoachingCTA className="mb-6" />

            <FadeIn delay={0.5}>
              <Button
                onClick={handlePracticeAgain}
                size="lg"
                className="font-bold touch-manipulation"
                data-testid="button-practice-again"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Practice Again
              </Button>
            </FadeIn>
          </Card>
        </FadeIn>
      <LeadGateDialog gateState={gateState} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16 flex flex-col" style={{ minHeight: "80vh" }}>
      <SEO />
      <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Role-Play Practice" }]} />

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
    </div>
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
