import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

const SCENARIOS = [
  { id: "cold_call_snf", title: "Cold Call: SNF Director", description: "Practice cold-calling a busy, skeptical Skilled Nursing Facility Director of Nursing.", icon: Phone },
  { id: "physician_objection", title: "Physician Objection", description: "Handle a physician who is hesitant about hospice referrals and believes in aggressive treatment.", icon: Stethoscope },
  { id: "family_consultation", title: "Family Consultation", description: "Guide an emotional family member through understanding what hospice care really means.", icon: Heart },
  { id: "hospital_discharge", title: "Hospital Discharge Planner", description: "Impress an overworked discharge planner comparing multiple hospice providers.", icon: Building2 },
  { id: "assisted_living_admin", title: "Assisted Living Admin", description: "Address concerns from a facility administrator about hospice presence in their community.", icon: Home },
  { id: "competitor_territory", title: "Win from Competitor", description: "Convince a satisfied referral source to consider switching from their current hospice provider.", icon: Target },
];

export default function RolePlay() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; rating: number } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"selecting" | "active" | "feedback" | "loading_feedback">("selecting");
  const [input, setInput] = useState("");
  const [activeScenarioTitle, setActiveScenarioTitle] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartSession = async (scenarioId: string, scenarioTitle: string) => {
    setIsLoading(true);
    setActiveScenarioTitle(scenarioTitle);
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
    setSessionStatus("selecting");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.round(rating);
    return (
      <div className="flex items-center gap-1" data-testid="display-rating-stars">
        {Array.from({ length: 10 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "w-5 h-5",
              i < fullStars ? "fill-primary text-primary" : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
    );
  };

  if (sessionStatus === "selecting") {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <SEO />
        <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Role-Play Practice" }]} />
        <h1 className="text-h1 font-black text-foreground mb-4" data-testid="text-roleplay-title">
          Role-Play Practice
        </h1>
        <p className="text-body-lg text-muted-foreground mb-8 leading-relaxed" data-testid="text-roleplay-subtitle">
          Sharpen your hospice sales skills by practicing realistic conversations with AI-powered characters. Choose a scenario below and start your practice session.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <Card
                key={scenario.id}
                className="hover-elevate spacing-card flex flex-col"
                data-testid={`card-scenario-${scenario.id}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-h3 font-bold text-foreground" data-testid={`text-scenario-title-${scenario.id}`}>
                    {scenario.title}
                  </h3>
                </div>
                <p className="text-body text-muted-foreground mb-4 flex-1" data-testid={`text-scenario-desc-${scenario.id}`}>
                  {scenario.description}
                </p>
                <Button
                  onClick={() => handleStartSession(scenario.id, scenario.title)}
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
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (sessionStatus === "feedback") {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <SEO />
        <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Role-Play Practice" }]} />
        <Card className="spacing-card" data-testid="card-feedback">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Badge variant="destructive" data-testid="badge-scenario-feedback">
              {activeScenarioTitle}
            </Badge>
            <span className="text-sm text-muted-foreground">Session Complete</span>
          </div>
          <h2 className="text-h2 font-bold text-foreground mb-4" data-testid="text-feedback-heading">
            Performance Feedback
          </h2>
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <span className="text-4xl font-black text-primary" data-testid="text-rating-number">
              {feedback?.rating}/10
            </span>
            {feedback && renderStars(feedback.rating)}
          </div>
          <div
            className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground mb-8"
            data-testid="text-feedback-content"
          >
            {feedback?.text}
          </div>
          <Button
            onClick={handlePracticeAgain}
            size="lg"
            className="font-bold touch-manipulation"
            data-testid="button-practice-again"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Practice Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16 flex flex-col" style={{ minHeight: "80vh" }}>
      <SEO />
      <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Role-Play Practice" }]} />
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-h3 font-bold text-foreground" data-testid="text-conversation-title">
            {activeScenarioTitle}
          </h1>
          <Badge variant="destructive" data-testid="badge-scenario-active">
            Live Practice
          </Badge>
        </div>
        <Button
          variant="outline"
          onClick={handleEndSession}
          disabled={sessionStatus === "loading_feedback" || isLoading}
          className="font-bold touch-manipulation"
          data-testid="button-end-session"
        >
          {sessionStatus === "loading_feedback" ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Star className="w-4 h-4 mr-2" />
          )}
          End Session & Get Feedback
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden" data-testid="card-conversation">
        <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="display-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              data-testid={`chat-message-${index}`}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg p-3 shadow-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground border border-border"
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {(isLoading || sessionStatus === "loading_feedback") && (
            <div className="flex justify-start" data-testid="display-loading-indicator">
              <div className="bg-muted text-foreground rounded-lg p-3 border border-border">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="min-h-[48px] max-h-32 resize-none text-sm"
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
    </div>
  );
}
