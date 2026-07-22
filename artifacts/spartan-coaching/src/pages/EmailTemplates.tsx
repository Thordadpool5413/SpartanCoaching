import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoachingCTA } from "@/components/CoachingCTA";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Mail, Copy, Loader2, Send, Download, X } from "lucide-react";
import { SEO } from "@/components/SEO";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { trackEvent } from "@/lib/analytics";
import { MarkdownContent } from "@/components/MarkdownContent";
import { downloadPdf, cleanMarkdown, type EmailPdfPayload } from "@/lib/downloadPdf";
import { useLeadGate } from "@/hooks/use-lead-gate";
import { LeadGateDialog } from "@/components/LeadGateDialog";
import { useReminderHistory } from "@/hooks/use-reminder-history";
import type { PendingReminder } from "@/hooks/use-reminder-history";
import { ReminderPicker } from "@/components/ReminderPicker";

function formatScheduledTime(ts: number): string {
  const now = Date.now();
  const diffMs = ts - now;
  if (diffMs <= 0) return "soon";
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 60) return `in ${diffMin}m`;
  const diffHr = Math.round(diffMs / 3_600_000);
  if (diffHr < 24) return `in ${diffHr}h`;
  const diffDays = Math.round(diffMs / 86_400_000);
  return `in ${diffDays}d`;
}

function PendingReminders({
  reminders,
  onRemove,
}: {
  reminders: PendingReminder[];
  onRemove: (id: string) => void;
}) {
  if (reminders.length === 0) return null;
  return (
    <div className="mb-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-primary">
          Pending Reminders
        </h3>
      </div>
      <ul className="space-y-2">
        {reminders.map((r) => (
          <li
            key={r.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3"
          >
            <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-snug truncate">
                {r.title}
              </p>
              {r.contact ? (
                <p className="text-sm font-medium text-foreground/80 truncate">
                  {r.contact}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground mt-0.5">
                {r.presetLabel} · {formatScheduledTime(r.scheduledFor)}
              </p>
            </div>
            <button
              onClick={() => onRemove(r.id)}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
              aria-label="Cancel reminder"
            >
              <X className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EmailTemplates() {
  const { capture, gateState } = useLeadGate("Email Template");
  const [templateType, setTemplateType] = useState<"follow_up" | "thank_you" | "value_add">("follow_up");
  const [recipientName, setRecipientName] = useState("");
  const [context, setContext] = useState("");
  const [customization, setCustomization] = useState("");
  const [generatedTemplate, setGeneratedTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const { reminders, load: reloadReminders, removeReminder } = useReminderHistory();

  const handleGenerate = async () => {
    if (context.length < 10) {
      toast({
        title: "Context required",
        description: "Please provide more context (at least 10 characters)",
        variant: "destructive",
      });
      return;
    }

    trackEvent("ai_tool_usage", "email_templates");
    setIsLoading(true);

    try {
      const response = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateType,
          recipientName: recipientName || undefined,
          context,
          customization: customization || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate template");
      }

      const data = await response.json();
      setGeneratedTemplate(data.template);

      const defaultSubjects: Record<string, string> = {
        follow_up: `Following Up - ${recipientName || 'Our Conversation'}`,
        thank_you: `Thank You${recipientName ? ` ${recipientName}` : ''}`,
        value_add: `Resource for You${recipientName ? `, ${recipientName}` : ''}`,
      };
      setEmailSubject(defaultSubjects[templateType] || "From Spartan Coaching");
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedTemplate);
    toast({
      title: "Copied!",
      description: "Email template copied to clipboard",
    });
  };

  const handleDownload = async () => {
    try {
      await downloadPdf(
        "spartan-email-template",
        "Email Template",
        [{ body: cleanMarkdown(generatedTemplate) }],
        emailSubject || undefined
      );
      toast({ title: "Downloaded", description: "Your email template PDF is ready." });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message || "Could not generate PDF.", variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!recipientEmail || !emailSubject) {
      toast({
        title: "Missing information",
        description: "Please enter both recipient email and subject",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailSubject,
          body: generatedTemplate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email");
      }

      toast({
        title: "Email sent!",
        description: `Email delivered to ${recipientEmail}`,
      });
      setRecipientEmail("");
    } catch (error: any) {
      toast({
        title: "Send failed",
        description: error.message || "Could not send the email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRemoveReminder = (id: string) => {
    removeReminder(id);
    reloadReminders();
  };

  return (
    <FieldKitToolLayout toolPath="/tools/email-templates" className="max-w-4xl">
      <SEO />
        <div className="mb-8">
          <h1 className="text-h1 font-black mb-6">Email Templates</h1>
          <p className="text-body-lg text-muted-foreground leading-relaxed">
            Generate professional, relationship-building emails for your hospice sales outreach
          </p>
        </div>

        <PendingReminders reminders={reminders} onRemove={handleRemoveReminder} />

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="border-2 shadow-lg spacing-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Template Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-type">Template Type</Label>
                <Select
                  value={templateType}
                  onValueChange={(value: any) => setTemplateType(value)}
                >
                  <SelectTrigger id="template-type" data-testid="select-template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow_up">Follow-Up Email</SelectItem>
                    <SelectItem value="thank_you">Thank You Email</SelectItem>
                    <SelectItem value="value_add">Value-Add Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient-name">Recipient Name (Optional)</Label>
                <Input
                  id="recipient-name"
                  placeholder="e.g., Dr. Smith"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  data-testid="input-recipient-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="context">Context *</Label>
                <Textarea
                  id="context"
                  placeholder="Describe the situation... e.g., 'Met at the regional healthcare conference last week, discussed their growing census challenges'"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  data-testid="textarea-context"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customization">Additional Customization (Optional)</Label>
                <Textarea
                  id="customization"
                  placeholder="Any specific points to mention or tone adjustments..."
                  value={customization}
                  onChange={(e) => setCustomization(e.target.value)}
                  rows={3}
                  data-testid="textarea-customization"
                />
              </div>

              <Button
                onClick={() => capture(handleGenerate)}
                disabled={isLoading}
                size="lg"
                className="w-full font-bold touch-manipulation"
                data-testid="button-generate-template"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    <span>Generate Email</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Template */}
          <Card className="border-2 shadow-lg spacing-card">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Generated Template</CardTitle>
                {generatedTemplate && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleCopy}
                      className="font-bold touch-manipulation"
                      data-testid="button-copy-template"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      <span>Copy</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => {
                        const getEmailPdf = (): EmailPdfPayload => ({
                          sections: [{ body: cleanMarkdown(generatedTemplate) }],
                          title: "Email Template",
                          filename: "spartan-email-template",
                          subtitle: emailSubject || undefined,
                        });
                        capture(handleDownload, getEmailPdf);
                      }}
                      className="font-bold touch-manipulation"
                      data-testid="button-download-template"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      <span>Download</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedTemplate ? (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg" data-testid="text-generated-template">
                    <MarkdownContent content={generatedTemplate} />
                  </div>

                  <ReminderPicker
                    title={
                      recipientName
                        ? `Follow up with ${recipientName}`
                        : "Follow-Up Reminder"
                    }
                    contact={recipientName}
                    onScheduled={reloadReminders}
                  />

                  <div className="mt-6 space-y-3 border-t pt-4">
                    <h4 className="font-semibold text-sm">Send this Email</h4>
                    <div className="space-y-2">
                      <Label htmlFor="send-to">Recipient Email</Label>
                      <Input
                        id="send-to"
                        type="email"
                        placeholder="recipient@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        data-testid="input-send-to"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="send-subject">Subject Line</Label>
                      <Input
                        id="send-subject"
                        placeholder="Email subject"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        data-testid="input-send-subject"
                      />
                    </div>
                    <Button
                      onClick={handleSend}
                      disabled={isSending || !recipientEmail}
                      className="w-full font-bold touch-manipulation"
                      data-testid="button-send-email"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          <span>Send Email</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Your generated email will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {generatedTemplate && (
        <CoachingCTA className="mt-6" />
      )}
      <LeadGateDialog gateState={gateState} />
    </FieldKitToolLayout>
  );
}
