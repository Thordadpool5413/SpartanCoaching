import { AccentText } from "@/components/AccentText";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgreementSignatureForm } from "@/components/AgreementSignatureForm";
import { CheckCircle2, FileText, Loader2, AlertCircle } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { queryClient } from "@/lib/queryClient";

const AGREEMENT_TITLES: Record<string, string> = {
  "HIPAA Business Associate Agreement": "HIPAA Business Associate Agreement",
  "Services Contract Agreement": "Services Contract Agreement",
  "Non-Disclosure Agreement (NDA)": "Non-Disclosure Agreement",
  "EMR/Data Access Agreement": "EMR/Data Access Agreement",
  "Conflict of Interest Disclosure": "Conflict of Interest Disclosure",
  "Liability Waiver / Hold Harmless Agreement": "Liability Waiver / Hold Harmless Agreement",
  "Testimonial / Case Study Release": "Testimonial / Case Study Release",
};

export default function SignAgreements() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{
    request: {
      id: number;
      recipientEmail: string;
      recipientName: string;
      documentTypes: string[];
      status: string;
    };
    signedTypes: string[];
  }>({
    queryKey: ["/api/sign", token],
    queryFn: async () => {
      const res = await fetch(`/api/sign/${token}`);
      if (!res.ok) throw new Error("Invalid or expired signing link");
      return res.json();
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-sign-error"><AccentText>Invalid Signing Link</AccentText></h1>
        <p className="text-muted-foreground">This signing link is invalid or has expired. Please contact Spartan Coaching for a new link.</p>
      </div>
    );
  }

  const { request, signedTypes } = data;
  const allSigned = request.documentTypes.every(t => signedTypes.includes(t));

  if (allSigned) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <SEO />
        <FadeIn>
          <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-sign-complete"><AccentText>All Agreements Signed</AccentText></h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            All requested agreements have been signed and PDF copies have been sent to your email. Thank you, {request.recipientName}.
          </p>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEO />
      <FadeIn>
        <h1 className="text-h1 text-foreground mb-2" data-testid="text-sign-title"><AccentText>Agreement Signing</AccentText></h1>
        <p className="text-body text-muted-foreground mb-8">
          Hi {request.recipientName}, please review and sign the following agreement(s) requested by Spartan Coaching.
        </p>
      </FadeIn>

      <StaggerContainer className="space-y-3 mb-8">
        {request.documentTypes.map((docType) => {
          const isSigned = signedTypes.includes(docType);
          const isActive = activeDoc === docType;
          return (
            <StaggerItem key={docType}>
              <Card
                className={`cursor-pointer transition-colors ${isActive ? "ring-2 ring-primary" : ""} ${isSigned ? "opacity-60" : "hover-elevate"}`}
                onClick={() => !isSigned && setActiveDoc(isActive ? null : docType)}
                data-testid={`card-sign-doc-${docType.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
              >
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <CardTitle className="text-base"><AccentText>{docType}</AccentText></CardTitle>
                  </div>
                  {isSigned ? (
                    <Badge variant="default" className="gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Signed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0">Pending</Badge>
                  )}
                </CardHeader>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {activeDoc && !signedTypes.includes(activeDoc) && (
        <AgreementSignatureForm
          agreementType={activeDoc}
          agreementTitle={AGREEMENT_TITLES[activeDoc] || activeDoc}
          prefillEmail={request.recipientEmail}
          prefillName={request.recipientName}
          requestId={request.id}
          submitUrl={`/api/sign/${token}`}
          onSigned={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/sign", token] });
            setActiveDoc(null);
          }}
        />
      )}
    </div>
  );
}
