import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Loader2, Minimize2 } from "lucide-react";
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


function ChatWidgetContent() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset minimized state when closing the widget
  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setHasLoadedMessages(false);
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
              content: "Welcome to Spartan Coaching! I'm your expert AI hospice sales coach with deep knowledge of Medicare regulations, The Spartan Method sales framework, objection handling, territory management, and coaching strategies. Whether you need help with \"We already have a provider,\" want to improve your SNF relationships, or need coaching on pipeline management—I'm here to help. What's your challenge today?",
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
            content: "Welcome to Spartan Coaching! I'm your expert AI hospice sales coach with deep knowledge of Medicare regulations, The Spartan Method sales framework, objection handling, territory management, and coaching strategies. Whether you need help with \"We already have a provider,\" want to improve your SNF relationships, or need coaching on pipeline management—I'm here to help. What's your challenge today?",
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.map((msg, index) => (
          <div
            key={`${msg.timestamp}-${msg.role}-${index}`}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
            data-testid={`chat-message-${msg.timestamp}-${index}`}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg p-3 shadow-sm",
                msg.role === "user"
                  ? "bg-spartan-gradient text-white"
                  : "bg-muted text-foreground border border-border"
              )}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-lg p-3 border border-border">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-muted/30">
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
                className="text-xs hover-elevate"
                data-testid={`button-suggestion-${suggestion.slice(0, 20)}`}
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
            className="min-h-[48px] max-h-32 resize-none text-sm"
            data-testid="textarea-chat-input"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
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
          bottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom, 0px))' : '32px',
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
          <DrawerContent className="h-[85vh] flex flex-col rounded-t-xl">
            <DrawerHeader className="border-b border-border bg-spartan-gradient">
              <DrawerTitle className="flex items-center gap-3 text-white">
                <MessageCircle className="h-5 w-5" />
                <h3 className="font-bold text-base">Expert Hospice Sales Coach</h3>
              </DrawerTitle>
              <DrawerDescription className="text-xs text-white/80">
                AI-powered by The Spartan Method
              </DrawerDescription>
              <div className="absolute top-4 right-4">
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
            <div className="flex items-center justify-between p-4 border-b border-border bg-spartan-gradient">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-white" />
                <div>
                  <h3 className="font-bold text-white text-base">Expert Hospice Sales Coach</h3>
                  <p className="text-xs text-white/80">AI-powered by The Spartan Method</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
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