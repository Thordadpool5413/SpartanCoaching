import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import Assessment from "./Assessment";
import type { SelectAssessment } from "@shared/schema";

interface ClientConfig {
  client: {
    slug: string;
    companyName: string;
    logoUrl: string | null;
    accentColor: string | null;
  };
  assessmentId: number;
}

export default function BrandedAssessment() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery<ClientConfig>({
    queryKey: ["/api/assess", slug],
    queryFn: async () => {
      const res = await fetch(`/api/assess/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
    retry: false,
  });

  const { data: assessmentsData } = useQuery<{ assessments: SelectAssessment[] }>({
    queryKey: ["/api/assessments-public-list"],
    queryFn: async () => {
      const res = await fetch("/api/assessments");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!error || (!isLoading && !data),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="display-branded-loading">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    const fallbackId = assessmentsData?.assessments?.[0]?.id;
    if (fallbackId) {
      navigate(`/assessment/${fallbackId}`);
    } else {
      navigate("/");
    }
    return null;
  }

  return (
    <>
      <SEO title={`${data.client.companyName} Assessment`} />
      <Assessment
        overrideAssessmentId={data.assessmentId}
        clientBranding={{
          companyName: data.client.companyName,
          logoUrl: data.client.logoUrl,
          accentColor: data.client.accentColor,
          slug: data.client.slug,
        }}
      />
    </>
  );
}
