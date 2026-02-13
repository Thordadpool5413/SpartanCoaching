import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Copy, Loader2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";

export default function EmailTemplates() {
  const [templateType, setTemplateType] = useState<"follow_up" | "thank_you" | "value_add">("follow_up");
  const [recipientName, setRecipientName] = useState("");
  const [context, setContext] = useState("");
  const [customization, setCustomization] = useState("");
  const [generatedTemplate, setGeneratedTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
    } catch (error: any) {
      console.error("Template generation error:", error);
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

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <SEO />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Email Templates" }]} />
        <div className="mb-8">
          <h1 className="text-h1 font-black mb-6">Email Templates</h1>
          <p className="text-body-lg text-muted-foreground leading-relaxed">
            Generate professional, relationship-building emails for your hospice sales outreach
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="card-lift border-2 shadow-lg spacing-card">
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
                onClick={handleGenerate}
                disabled={isLoading}
                size="lg"
                className="w-full font-bold min-h-[52px] touch-manipulation"
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
          <Card className="card-lift border-2 shadow-lg spacing-card">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Generated Template</CardTitle>
                {generatedTemplate && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleCopy}
                    className="font-bold min-h-[48px] touch-manipulation"
                    data-testid="button-copy-template"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    <span>Copy</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedTemplate ? (
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm" data-testid="text-generated-template">
                  {generatedTemplate}
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
      </div>
    </div>
  );
}
