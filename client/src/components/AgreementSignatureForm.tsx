import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Briefcase, Building2, Mail, CheckCircle2 } from "lucide-react";
import { FadeIn } from "@/components/animations";

interface AgreementSignatureFormProps {
  agreementType: string;
  agreementTitle: string;
}

export function AgreementSignatureForm({ agreementType, agreementTitle }: AgreementSignatureFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);

  const signMutation = useMutation({
    mutationFn: async (data: {
      agreementType: string;
      signerName: string;
      signerTitle: string;
      signerOrganization: string;
      signerEmail: string;
    }) => {
      const res = await apiRequest("POST", "/api/signed-agreements", data);
      return res.json();
    },
    onSuccess: () => {
      setSigned(true);
      toast({
        title: "Agreement Signed",
        description: "A confirmation has been sent to your email. Thank you.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit the agreement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    signMutation.mutate({
      agreementType,
      signerName: name.trim(),
      signerTitle: title.trim(),
      signerOrganization: organization.trim(),
      signerEmail: email.trim(),
    });
  };

  if (signed) {
    return (
      <FadeIn>
        <Card className="mt-12 border-green-200 dark:border-green-800">
          <CardContent className="py-10 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Agreement Signed Successfully</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              A confirmation copy of this {agreementTitle} has been sent to <strong className="text-foreground">{email}</strong>. Please retain it for your records.
            </p>
            <div className="mt-6 p-4 rounded-md bg-muted/50 inline-block text-left">
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Signed by:</strong> {name}</p>
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Title:</strong> {title}</p>
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Organization:</strong> {organization}</p>
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.2}>
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="text-xl" data-testid="text-signature-form-title">
            Digital Signature for {agreementTitle}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            By completing this form, you acknowledge that you have read and agree to the terms above. A signed copy will be emailed to you and to Spartan Coaching.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signer-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signer-name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    required
                    data-testid="input-signer-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signer-title">Title / Position</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signer-title"
                    placeholder="e.g. Director of Business Development"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="pl-9"
                    required
                    data-testid="input-signer-title"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signer-org">Organization</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signer-org"
                    placeholder="Your organization name"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="pl-9"
                    required
                    data-testid="input-signer-organization"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signer-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signer-email"
                    type="email"
                    placeholder="your@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    data-testid="input-signer-email"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signer-date">Date</Label>
              <Input
                id="signer-date"
                value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                disabled
                className="bg-muted/50"
                data-testid="input-signer-date"
              />
            </div>
            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="agreement-checkbox"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                data-testid="checkbox-agreement"
              />
              <Label htmlFor="agreement-checkbox" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I have read, understand, and agree to the terms of this {agreementTitle}. I acknowledge that this constitutes a legally binding digital signature.
              </Label>
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={!agreed || !name.trim() || !title.trim() || !organization.trim() || !email.trim() || signMutation.isPending}
              data-testid="button-sign-agreement"
            >
              {signMutation.isPending ? "Submitting..." : "Sign Agreement"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
