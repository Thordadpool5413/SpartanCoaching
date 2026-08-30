import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, Copy, MessageSquarePlus, Printer, Send, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/MarkdownContent";
import { SEO } from "@/components/SEO";

type Conversation = { id: string; title: string; createdAt: string; updatedAt: string };
type Message = { id: string; role: "user" | "assistant"; content: string; createdAt: string; clientRequestId?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Spartan Coach is unavailable") as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data as T;
}

const conversationDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));

export const presentCoachResponse = (content: string) => {
  return content
    .replace(/(?:^|\n|(?<=[.!?])\s+)(Situation|What is happening|Best next move|What to say|Opening|Two discovery questions|Discovery questions|Value connection|Low pressure next step|If they still say no|If the concern is giving up care|What not to say|Compliance boundary|What to do next|One clear commitment)(?:\s*[.:])?\s*/gim, "\n\n## $1\n\n")
    .replace(/\s+[•●]\s+/g, "\n- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export default function Coach() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eliteRequired, setEliteRequired] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function openConversation(id: string) {
    setError(null);
    const data = await request<{ conversation: Conversation; messages: Message[] }>(`/api/v1/coach/conversations/${id}`);
    setConversationId(data.conversation.id);
    setMessages(Array.isArray(data.messages) ? data.messages : []);
  }

  async function refresh(selectFirst = false) {
    const data = await request<{ conversations: Conversation[] }>("/api/v1/coach/conversations");
    const nextConversations = Array.isArray(data.conversations) ? data.conversations : [];
    setConversations(nextConversations);
    if (selectFirst && nextConversations[0]) await openConversation(nextConversations[0].id);
  }

  useEffect(() => {
    void refresh(true)
      .catch((cause: Error & { status?: number; code?: string }) => {
        if (cause.status === 403 || cause.code === "ELITE_REQUIRED") setEliteRequired(true);
        else setError(cause.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function createConversation() {
    setError(null);
    try {
      const data = await request<{ conversation: Conversation }>("/api/v1/coach/conversations", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setConversations((current) => [data.conversation, ...current]);
      setConversationId(data.conversation.id);
      setMessages([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start a conversation");
    }
  }

  async function sendMessage() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    const requestId = crypto.randomUUID();
    try {
      let id = conversationId;
      if (!id) {
        const created = await request<{ conversation: Conversation }>("/api/v1/coach/conversations", {
          method: "POST",
          body: JSON.stringify({ title: content.slice(0, 80) }),
        });
        id = created.conversation.id;
        setConversationId(id);
      }
      setMessages((current) => [...current, {
        id: requestId,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
        clientRequestId: requestId,
      }]);
      setDraft("");
      const data = await request<{ message: Message }>(`/api/v1/coach/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: content, requestId }),
      });
      setMessages((current) => [...current, data.message]);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Coach could not respond");
      setDraft(content);
      setMessages((current) => current.filter((item) => item.id !== requestId));
    } finally {
      setSending(false);
    }
  }

  async function deleteConversation() {
    if (!conversationId || !window.confirm("Delete this private conversation permanently?")) return;
    try {
      await request(`/api/v1/coach/conversations/${conversationId}`, { method: "DELETE" });
      setConversationId(null);
      setMessages([]);
      await refresh(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this conversation");
    }
  }

  async function copyResponse(message: Message) {
    await navigator.clipboard.writeText(message.content);
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId(null), 1800);
  }

  function printResponse(message: Message) {
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return;
    const safe = message.content.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    popup.document.write(`<!doctype html><html><head><title>Spartan Coach Brief</title><style>body{font:16px/1.65 system-ui,-apple-system,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;color:#111}h1{font-size:24px}pre{white-space:pre-wrap;font:inherit}</style></head><body><h1>Spartan Coach Brief</h1><pre>${safe}</pre></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  if (loading) return <div className="min-h-[60vh] grid place-items-center px-6" role="status" aria-live="polite"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm"><div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /><h1 className="mt-4 text-xl font-bold">Opening your coaching workspace</h1><p className="mt-2 text-sm text-muted-foreground">Loading your private conversation history and latest field brief.</p></div></div>;

  if (eliteRequired) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <SEO title="Spartan Coach | Hospice Sales Pro Elite" noIndex />
        <Card className="p-8 sm:p-12 border-2 border-primary/40 text-center space-y-5">
          <p className="text-kicker justify-center">Hospice Sales Pro Elite</p>
          <h1 className="text-h1 font-display font-extrabold">Your private field coach</h1>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Continue one private conversation on the website and iPhone. Elite includes Spartan Coach, shared history, and 90 day conversation retention.
          </p>
          <Button asChild size="lg" className="font-bold">
            <Link href="/account?subscribe=1&plan=elite_weekly">Choose Elite for $19.99 per week <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
          <p className="text-sm text-muted-foreground">Standard remains available for $14.99 per week.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12" data-testid="page-coach">
      <SEO title="Spartan Coach | Hospice Sales Pro Elite" noIndex />
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
        <div className="space-y-3">
          <p className="text-kicker">Elite private coaching</p>
          <h1 className="text-h1 font-display font-extrabold">Spartan Coach</h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Prepare, rehearse, review, and keep the conversation going. Your private history follows your account on the website and iPhone for 90 days.
          </p>
        </div>
        <Button onClick={() => void createConversation()} className="font-bold min-h-11">
          <MessageSquarePlus className="mr-2 w-4 h-4" /> New conversation
        </Button>
      </div>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
        <Card className="p-3 lg:sticky lg:top-24 border border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-3 py-3 border-b border-border mb-2">Conversation history</p>
          <div className="space-y-2 max-h-72 lg:max-h-[64vh] overflow-y-auto">
            {conversations.length === 0 ? <p className="text-sm text-muted-foreground p-3">Your first conversation starts here.</p> : conversations.map((item) => (
              <button key={item.id} onClick={() => void openConversation(item.id).catch((cause: Error) => setError(cause.message))} className={`w-full text-left rounded-xl p-3 transition-colors ${conversationId === item.id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted"}`}>
                <span className="block text-sm font-bold text-foreground line-clamp-2">{item.title}</span>
                <span className="block text-xs text-muted-foreground mt-1">{conversationDate(item.updatedAt)}</span>
              </button>
            ))}
          </div>
          <div className="flex items-start gap-2 px-3 pt-4 mt-3 border-t border-border text-xs text-muted-foreground leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Private by default. Do not enter PHI. Conversations expire after 90 days.
          </div>
        </Card>

        <Card className="border border-border overflow-hidden min-h-[620px] flex flex-col">
          <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-5 border-b border-border bg-muted/30">
            <div>
              <p className="font-display font-extrabold text-lg">One conversation, continued</p>
              <p className="text-xs text-muted-foreground mt-1">Ask a follow up. Challenge the answer. Rehearse the next move.</p>
            </div>
            {conversationId && <Button variant="ghost" size="icon" onClick={() => void deleteConversation()} aria-label="Delete conversation"><Trash2 className="w-4 h-4" /></Button>}
          </div>

          <div className="flex-1 p-5 sm:p-7 space-y-6">
            {error ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert"><span>{error}</span><Button type="button" size="sm" variant="outline" onClick={() => void refresh(true).catch((cause: Error) => setError(cause.message))}>Try again</Button></div> : null}
            {messages.length === 0 && (
              <div className="max-w-xl mx-auto text-center py-14 space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center mx-auto shadow-elite-red"><MessageSquarePlus className="w-6 h-6" /></div>
                <h2 className="text-2xl font-display font-extrabold">What are you walking into?</h2>
                <p className="text-muted-foreground leading-relaxed">Give Coach the situation, the outcome you want, and what feels difficult. Use general professional context only.</p>
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={message.role === "user" ? "max-w-[88%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-5 py-4" : "w-full max-w-[94%] rounded-2xl rounded-bl-sm border border-border bg-card px-5 sm:px-7 py-6 shadow-sm"}>
                  {message.role === "assistant" ? <><div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Your field coaching brief</p><p className="mt-1 text-xs text-muted-foreground">Review it, adapt it to your voice, then take one next step.</p></div><div className="flex gap-2 no-print"><Button type="button" variant="outline" size="sm" onClick={() => void copyResponse(message)} data-testid={`button-copy-coach-${message.id}`}>{copiedMessageId === message.id ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}{copiedMessageId === message.id ? "Copied" : "Copy"}</Button><Button type="button" variant="outline" size="sm" onClick={() => printResponse(message)} data-testid={`button-print-coach-${message.id}`}><Printer className="mr-1.5 h-4 w-4" /> Print</Button></div></div><MarkdownContent content={presentCoachResponse(message.content)} className="[&_h2]:border-l-2 [&_h2]:border-primary [&_h2]:pl-3 [&_h2]:tracking-tight [&_p]:max-w-3xl" /></> : <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>}
                </div>
              </div>
            ))}
            {sending && <p className="text-sm text-muted-foreground" role="status">Coach is thinking through your next move.</p>}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border bg-background p-4 sm:p-6">
            {error && <p className="text-sm text-destructive mb-3" role="alert">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
              }} placeholder="Describe the situation or ask a follow up" maxLength={4000} className="min-h-24 resize-none" aria-label="Message Spartan Coach" />
              <Button onClick={() => void sendMessage()} disabled={!draft.trim() || sending} size="lg" className="font-bold w-full sm:w-auto min-h-12">Send <Send className="ml-2 w-4 h-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Enter sends. Shift and Enter adds a new line.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
