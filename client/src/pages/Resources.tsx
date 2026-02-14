import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Mail, User } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import type { SelectResource } from "@shared/schema";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";
import { apiRequest } from "@/lib/queryClient";

export default function Resources() {
  const { data: resourcesData, isLoading, isError } = useQuery<{ resources: SelectResource[] }>({
    queryKey: ["/api/resources"],
  });

  const resources = resourcesData?.resources || [];

  const [gateOpen, setGateOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<SelectResource | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");

  const leadMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; resourceId: number; resourceTitle: string }) => {
      const res = await apiRequest("POST", "/api/resource-leads", data);
      return res.json();
    },
    onSuccess: () => {
      if (selectedResource) {
        trackEvent("resource_download", selectedResource.title);
        window.open(selectedResource.fileUrl, '_blank');
      }
      setGateOpen(false);
      setLeadName("");
      setLeadEmail("");
      setSelectedResource(null);
    },
  });

  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, SelectResource[]>);

  const categoryNames: Record<string, string> = {
    template: "Templates",
    script: "Scripts",
    checklist: "Checklists",
    guide: "Guides",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SEO />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-5 w-96 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-cards">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="flex flex-col border-2 spacing-card">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-5 w-20 mb-4" />
                <Skeleton className="h-12 w-full mb-4" />
                <Skeleton className="h-9 w-32" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
        <SEO />
        <BackButton />
        <div className="text-center max-w-2xl mx-auto py-20">
          <p className="text-destructive">Failed to load resources. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
        <SEO />
        <BackButton />
        <div className="text-center max-w-2xl mx-auto py-20">
          <h1 className="text-h1 text-foreground mb-6" data-testid="text-resources-title">Training Resources Library</h1>
          <p className="text-body-lg text-muted-foreground">
            No resources available yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <BackButton />
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <h1 className="text-h1 text-foreground mb-6" data-testid="text-resources-title">
          Training Resources Library
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">
          Download field-tested templates, scripts, checklists, and guides to elevate your hospice sales performance.
        </p>
      </div>

      <div className="space-y-12">
        {Object.entries(groupedResources).map(([category, categoryResources]) => (
          <div key={category} data-testid={`category-${category}`}>
            <h2 className="text-h2 mb-6 flex items-center gap-3 flex-wrap">
              {categoryNames[category] || category}
              <Badge variant="secondary" className="text-sm">
                {categoryResources.length}
              </Badge>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-cards">
              {categoryResources.map((resource) => (
                <Card
                  key={resource.id}
                  className="flex flex-col hover-elevate border-2 group relative spacing-card"
                  data-testid={`resource-card-${resource.id}`}
                >
                  <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex-1 relative">
                    <div className="flex items-start justify-between gap-2 mb-4 flex-wrap">
                      <h3 className="text-h3 text-foreground leading-tight">{resource.title}</h3>
                      <Badge variant="outline" className="shrink-0">
                        {categoryNames[resource.category] || resource.category}
                      </Badge>
                    </div>

                    {resource.description && (
                      <p className="text-base text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                        {resource.description}
                      </p>
                    )}

                    <Button
                      className="w-full gap-2"
                      onClick={() => {
                        setSelectedResource(resource);
                        setGateOpen(true);
                      }}
                      data-testid={`button-download-${resource.id}`}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={gateOpen} onOpenChange={(open) => { setGateOpen(open); if (!open) setSelectedResource(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Get Your Free Resource</DialogTitle>
            <DialogDescription>
              Enter your name and email to download "{selectedResource?.title}". We'll also send you occasional hospice sales tips.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedResource && leadName.trim() && leadEmail.trim()) {
                leadMutation.mutate({
                  name: leadName.trim(),
                  email: leadEmail.trim(),
                  resourceId: selectedResource.id,
                  resourceTitle: selectedResource.title,
                });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="lead-name">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="lead-name"
                  placeholder="Your name"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="pl-9"
                  required
                  data-testid="input-lead-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="your@email.com"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  className="pl-9"
                  required
                  data-testid="input-lead-email"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={leadMutation.isPending}
              data-testid="button-submit-lead"
            >
              <Download className="w-4 h-4" />
              {leadMutation.isPending ? "Processing..." : "Download Now"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
