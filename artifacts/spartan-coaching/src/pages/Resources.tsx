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
import { Download, Mail, User, Printer } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import type { SelectResource } from "@shared/schema";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";
import { apiRequest } from "@/lib/queryClient";
import { ContentNotice } from "@/components/ContentNotice";
import { FieldKitChrome } from "@/components/FieldKitChrome";
import { useAuth } from "@/context/AuthContext";

export default function Resources() {
  const { canUseFieldKit } = useAuth();
  const { data: resourcesData, isLoading, isError } = useQuery<{ resources: SelectResource[] }>({
    queryKey: ["/api/resources"],
  });

  const resources = resourcesData?.resources || [];

  const [gateOpen, setGateOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<SelectResource | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");

  /** Prefer /resources/files/* so PDF downloads never hit the SPA /resources page. */
  const resolveResourceUrl = (fileUrl: string): string => {
    if (!fileUrl) return fileUrl;
    if (fileUrl.startsWith("/resources/files/")) return fileUrl;
    if (fileUrl.startsWith("/resources/") && fileUrl.toLowerCase().endsWith(".pdf")) {
      const name = fileUrl.split("/").pop() || "";
      return `/resources/files/${name}`;
    }
    return fileUrl;
  };

  const openDownload = (resource: SelectResource) => {
    const url = resolveResourceUrl(resource.fileUrl);
    // Members already inside Membership — no lead gate
    if (canUseFieldKit) {
      trackEvent("resource_download", resource.title);
      window.open(url, "_blank");
      return;
    }
    setSelectedResource({ ...resource, fileUrl: url });
    setGateOpen(true);
  };

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
      {canUseFieldKit && <FieldKitChrome />}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">
          {canUseFieldKit ? "Hospice Sales Pro · Resources" : "Training library"}
        </p>
        <h1 className="text-h1 text-foreground mb-6" data-testid="text-resources-title">
          {canUseFieldKit ? "Resources" : "Training Resources Library"}
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">
          {canUseFieldKit
            ? "Templates, scripts, checklists, and guides for the field — part of Hospice Sales Pro. No PHI in downloads you fill out."
            : "Download field-tested templates, scripts, checklists, and guides to elevate your hospice sales performance."}
        </p>
        {canUseFieldKit && (
          <p className="text-sm text-muted-foreground mt-3">
            Pair these with{" "}
            <Link href="/tools" className="font-semibold text-primary hover:underline">
              Hospice Sales Pro tools
            </Link>{" "}
            (for example: objection cards → Objection Handler).
          </p>
        )}
      </div>
      {!canUseFieldKit && <ContentNotice />}

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
                      <p className="text-base text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                        {resource.description}
                      </p>
                    )}

                    {(() => {
                      const arch =
                        (
                          resource as SelectResource & {
                            architecture?: {
                              whenToUse?: string;
                              expectedOutcome?: string;
                              experienceLevel?: string;
                              clinicalSensitivity?: string;
                            };
                          }
                        ).architecture || resource.contentArchitecture;
                      if (!arch) return null;
                      return (
                        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                          {arch.whenToUse ? (
                            <p className="line-clamp-2" data-testid={`resource-when-${resource.id}`}>
                              <span className="font-semibold text-foreground">When: </span>
                              {arch.whenToUse}
                            </p>
                          ) : null}
                          {arch.expectedOutcome ? (
                            <p className="line-clamp-2" data-testid={`resource-outcome-${resource.id}`}>
                              <span className="font-semibold text-foreground">Outcome: </span>
                              {arch.expectedOutcome}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {arch.experienceLevel ? (
                              <Badge variant="secondary" className="text-xs">
                                {arch.experienceLevel}
                              </Badge>
                            ) : null}
                            {arch.clinicalSensitivity &&
                            arch.clinicalSensitivity !== "none" ? (
                              <Badge variant="outline" className="text-xs">
                                {arch.clinicalSensitivity}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      );
                    })()}

                    <Button
                      className="w-full gap-2"
                      onClick={() => openDownload(resource)}
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

      <div className="mt-16">
        <h2 className="text-h2 mb-2 flex items-center gap-3 flex-wrap">
          Printable Fill-In Templates
          <Badge variant="secondary" className="text-sm">5</Badge>
        </h2>
        <p className="text-muted-foreground mb-6">
          {canUseFieldKit
            ? "Open in your browser, fill in, and print — part of your membership resources."
            : "Open in your browser, fill in, and print. No account required."}
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-cards">
          {[
            { href: "/resources/weekly-plan", title: "Weekly Activity Planner", desc: "Daily schedule grid, priority accounts, follow-up tracker, and end-of-week review for any sales rep." },
            { href: "/resources/activity-tracker", title: "Weekly Activity Tracker", desc: "Detailed daily conversation log with Account, Contact, Topic, Stage, and Outcome columns. Includes weekly summary and reflection questions." },
            { href: "/resources/quick-start-guide", title: "First 30 Days Guide", desc: "Week-by-week actions, first contact scripts, objection responses, and a 30-day scorecard for new hires." },
            { href: "/resources/objection-cards", title: "Objection Response Cards", desc: "Eight of the most common hospice objections with response frameworks, coaching tips, and a universal reframe method." },
            { href: "/resources/territory-template", title: "Territory Planning Template", desc: "Account priority matrix (A/B/C tier), 25-row account table, weekly route planner, and routing tips." },
            { href: "/resources/metrics-dashboard", title: "Metrics Dashboard", desc: "Monthly tracking sheet for activity, conversions, speed to care, top referral sources, and reflections." },
          ].map((item) => (
            <Card key={item.href} className="flex flex-col border-2 hover-elevate spacing-card">
              <div className="flex-1">
                <h3 className="text-h3 text-foreground leading-tight mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
              </div>
              <Link href={item.href}>
                <Button className="w-full gap-2" data-testid={`button-open-${item.href.split("/").pop()}`}>
                  <Printer className="w-4 h-4" />
                  Open and Print
                </Button>
              </Link>
            </Card>
          ))}
        </div>
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
