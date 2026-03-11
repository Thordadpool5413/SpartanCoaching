import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Minimize2, ShieldCheck, Trash2, User } from "lucide-react";
import type { ChatMessage } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { MarkdownContent } from "@/components/MarkdownContent";


function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground/50 inline-block"
          style={{ animation: `bounce 1.2s infinite ${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function ChatWidgetContent() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setHasLoadedMessages(false);
  };

  const handleClearChat = () => {
    if (!window.confirm("Clear your conversation history?")) return;
    localStorage.removeItem('spartan-chat-history');
    setMessages([{
      role: "model",
      content: "Welcome to Spartan Coaching! I'm your expert AI hospice sales coach with deep knowledge of Medicare regulations, The Spartan Method sales framework, objection handling, territory management, and coaching strategies. Whether you need help with \"We already have a provider,\" want to improve your SNF relationships, or need coaching on pipeline management, I am here to help. What's your challenge today?",
      timestamp: Date.now(),
    }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && !hasLoadedMessages) {
      // Load persisted messages or add welcome message
      const savedMessages = localStorage.getItem('spartan-chat-history');
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed);
          setHasLoadedMessages(true);
        } catch (e) {
          // If parsing fails, start fresh with welcome message
          setMessages([
            {
              role: "model",
              content: "Welcome to Spartan Coaching! I'm your expert AI hospice sales coach with deep knowledge of Medicare regulations, The Spartan Method sales framework, objection handling, territory management, and coaching strategies. Whether you need help with \"We already have a provider,\" want to improve your SNF relationships, or need coaching on pipeline management, I am here to help. What's your challenge today?",
              timestamp: Date.now(),
            },
          ]);
          setHasLoadedMessages(true);
        }
      } else {
        // No saved messages, show welcome message
        setMessages([
          {
            role: "model",
            content: "Welcome to Spartan Coaching! I'm your expert AI hospice sales coach with deep knowledge of Medicare regulations, The Spartan Method sales framework, objection handling, territory management, and coaching strategies. Whether you need help with \"We already have a provider,\" want to improve your SNF relationships, or need coaching on pipeline management, I am here to help. What's your challenge today?",
            timestamp: Date.now(),
          },
        ]);
        setHasLoadedMessages(true);
      }
    }
  }, [isOpen, isMinimized, hasLoadedMessages]);

  // Persist messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('spartan-chat-history', JSON.stringify(messages.slice(-20)));
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(-10); // Send last 10 messages for context

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage.content,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const aiMessage: ChatMessage = {
        role: "model",
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: ChatMessage = {
        role: "model",
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const ChatContent = () => (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
        {messages.length <= 1 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center px-4 py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">How can I help you today?</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Ask me anything about hospice sales, territory strategy, objections, or eligibility.</p>
            </div>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={`${msg.timestamp}-${msg.role}-${index}`}
            className={cn(
              "flex flex-nowrap gap-2 items-end",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
            data-testid={`chat-message-${msg.timestamp}-${index}`}
          >
            {msg.role === "model" && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mb-4">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[85%]">
              <div
                className={cn(
                  "rounded-lg p-3 shadow-sm",
                  msg.role === "user"
                    ? "bg-spartan-gradient text-white"
                    : "bg-muted text-foreground border border-border"
                )}
              >
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <MarkdownContent content={msg.content} variant="compact" />
                )}
              </div>
              <p className={cn(
                "text-[10px] text-muted-foreground px-1",
                msg.role === "user" ? "text-right" : "text-left"
              )}>
                {msg.timestamp ? formatRelativeTime(msg.timestamp) : ""}
              </p>
            </div>
            {msg.role === "user" && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-nowrap gap-2 items-end justify-start">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="bg-muted text-foreground rounded-lg px-4 py-3 border border-border">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-muted/30">
        {messages.length <= 1 && (
          <div className={cn("mb-3", isMobile ? "flex flex-col gap-1.5" : "flex gap-2 overflow-x-auto pb-1 scrollbar-hide")}>
            {[
              'Handle "We already have a provider"',
              'How do I prioritize my territory?',
              'Coach me on SNF objections',
              'Build a weekly sales rhythm'
            ].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => setInput(suggestion)}
                className={cn("text-xs text-left justify-start", isMobile ? "w-full min-h-[44px]" : "whitespace-nowrap shrink-0")}
                data-testid={`button-suggestion-${suggestion.slice(0, 20)}`}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
        <div className="flex gap-2" style={{ flexDirection: "row" }}>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about hospice sales..."
            className="min-h-[48px] max-h-32 resize-none text-sm flex-1"
            data-testid="textarea-chat-input"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 self-end"
            data-testid="button-send-message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </>
  );


  // Closed state - Floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center justify-center rounded-full shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer border-0",
          "bg-spartan-gradient glow-primary-hover",
          isMobile
            ? "w-14 h-14"
            : "w-16 h-16"
        )}
        style={{
          position: 'fixed',
          bottom: isMobile ? 'calc(20px + env(safe-area-inset-bottom, 0px))' : '32px',
          right: isMobile ? 'calc(16px + env(safe-area-inset-right, 0px))' : '32px',
          zIndex: 50,
        }}
        data-testid="button-chat-widget"
        aria-label="Open AI Chat"
      >
        <MessageCircle className={cn(
          "text-white",
          isMobile ? "h-6 w-6" : "h-8 w-8"
        )} />
      </button>
    );
  }

  // Minimized state - Small tab on right edge
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          "rounded-l-lg rounded-r-none shadow-2xl transition-all duration-300 cursor-pointer border-0",
          "bg-spartan-gradient glow-primary-hover flex flex-col items-center gap-2 px-3 py-6"
        )}
        style={{
          position: 'fixed',
          top: isMobile ? '50%' : '33.333%',
          right: 0,
          transform: isMobile ? 'translateY(-50%)' : 'none',
          zIndex: 50,
        }}
        data-testid="button-chat-minimized"
        aria-label="Expand AI Chat"
      >
        <MessageCircle className="h-5 w-5 text-white" />
        <span className="text-white text-xs font-bold" style={{ writingMode: 'vertical-rl' }}>AI Coach</span>
      </button>
    );
  }

  // Open state - Floating sidebar panel or Drawer
  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="h-[85dvh] flex flex-col rounded-t-xl">
            <DrawerHeader className="border-b border-border bg-spartan-gradient">
              <div className="flex flex-nowrap items-center justify-between gap-2">
                <DrawerTitle className="flex items-center gap-3 text-white">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-white" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-400 border-2 border-white" style={{ animation: 'pulse 2s infinite' }} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-base leading-tight">Spartan AI Coach</p>
                    <DrawerDescription className="text-xs text-white/80 mt-0">
                      Expert in hospice sales
                    </DrawerDescription>
                  </div>
                </DrawerTitle>
                <div className="flex items-center gap-1 shrink-0">
                  {messages.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleClearChat}
                      className="h-8 w-8 text-white/70 hover:bg-white/20 hover:text-white"
                      data-testid="button-clear-chat-mobile"
                      title="Clear conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleClose}
                    className="h-8 w-8 text-white hover:bg-white/20"
                    data-testid="button-close-chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DrawerHeader>
            <ChatContent />
          </DrawerContent>
        </Drawer>
      ) : (
        <div
          className={cn(
            "fixed top-0 right-0 bottom-0 w-full max-w-md z-50 transition-all duration-300 ease-in-out",
            "border-l border-border"
          )}
          data-testid="chat-widget-panel"
        >
          <Card className={cn(
            "h-full flex flex-col shadow-2xl",
            "rounded-none border-r-0"
          )}>
            {/* Header */}
            <div className="flex flex-nowrap items-center justify-between p-4 border-b border-border bg-spartan-gradient shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" style={{ animation: 'pulse 2s infinite' }} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">Spartan AI Coach</h3>
                  <p className="text-xs text-white/80">Expert in hospice sales</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleClearChat}
                    className="h-8 w-8 text-white/70 hover:bg-white/20 hover:text-white"
                    data-testid="button-clear-chat"
                    title="Clear conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsMinimized(true)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                  data-testid="button-minimize-chat"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleClose}
                  className="h-8 w-8 text-white hover:bg-white/20"
                  data-testid="button-close-chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ChatContent />
          </Card>
        </div>
      )}
    </>
  );
}

export function ChatWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <ChatWidgetContent />,
    document.body
  );
}