import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import type { ChatMessage } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Load persisted messages or add welcome message
      const savedMessages = localStorage.getItem('spartan-chat-history');
      if (savedMessages && messages.length === 0) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          // If parsing fails, start fresh
          setMessages([
            {
              role: "model",
              content: "Welcome to Spartan Coaching! I'm your expert AI hospice sales coach with deep knowledge of Medicare regulations, The Spartan Method sales framework, objection handling, territory management, and coaching strategies. Whether you need help with \"We already have a provider,\" want to improve your SNF relationships, or need coaching on pipeline management—I'm here to help. What's your challenge today?",
              timestamp: Date.now(),
            },
          ]);
        }
      } else if (messages.length === 0) {
        setMessages([
          {
            role: "model",
            content: "Welcome to Spartan Coaching! I'm your expert AI hospice sales coach with deep knowledge of Medicare regulations, The Spartan Method sales framework, objection handling, territory management, and coaching strategies. Whether you need help with \"We already have a provider,\" want to improve your SNF relationships, or need coaching on pipeline management—I'm here to help. What's your challenge today?",
            timestamp: Date.now(),
          },
        ]);
      }
    }
  }, [isOpen]);

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

  if (!isOpen) {
    return (
      <>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-primary text-primary-foreground p-3 md:p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all z-50"
            aria-label="Open chat"
          >
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={cn(
        "flex flex-col",
        isMobile
          ? "fixed inset-0 max-w-full h-full rounded-none"
          : "max-w-2xl max-h-[80vh]"
      )}>
        <DialogHeader>
          <DialogTitle>Expert Hospice Sales Coach</DialogTitle>
          <DialogDescription>
            Advanced AI coach specializing in hospice sales, objection handling, territory management, and The Spartan Method.
          </DialogDescription>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`chat-message-${idx}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground rounded-lg p-3">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background">
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
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
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about hospice sales..."
              className="min-h-10 max-h-24 resize-none"
              data-testid="textarea-chat-input"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}