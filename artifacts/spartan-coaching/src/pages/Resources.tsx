import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Mail, User, Printer, Sparkles, Search } from "lucide-react";
import type { SelectResource } from "@shared/schema";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";
import { apiRequest } from "@/lib/queryClient";
import { ContentNotice } from "@/components/ContentNotice";
import { ToolResultActions } from "@/components/ToolResultActions";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { trackProductOutcome } from "@/lib/analytics";
import { stageAiToolHandoff } from "@/lib/aiToolHandoff";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { StateBlock } from "@/components/StateBlock";
import { UX_WORKSPACE_IMPROVEMENTS } from "@/lib/workspaceUxFlag";
import {
  FIELD_KIT_TOOLS,
  getResourceWorkGuide,
  getToolById,
  getToolWorkGuide,
  type FieldKitResourceWorkflowCustomization,
} from "@/lib/fieldKitCatalog";

type ProviderResourceItem = {
  id: number;
  title: string;
  description?: string | null;
  fileUrl: string;
  kind: string;
  status: string;
  ownershipLabel?: string;
  isProviderOwned?: boolean;
  meta?: {
    workflow?: FieldKitResourceWorkflowCustomization | null;
    [key: string]: unknown;
  } | null;
};

type ProviderWorkflowForm = {
  job: string;
  expectedOutput: string;
  reviewCheckpoint: string;
  nextToolId: string;
};

const EMPTY_PROVIDER_WORKFLOW: ProviderWorkflowForm = {
  job: "",
  expectedOutput: "",
  reviewCheckpoint: "",
  nextToolId: "",
};

function workflowPayload(form: ProviderWorkflowForm): FieldKitResourceWorkflowCustomization | undefined {
  const workflow: FieldKitResourceWorkflowCustomization = {
    job: form.job.trim() || undefined,
    expectedOutput: form.expectedOutput.trim() || undefined,
    reviewCheckpoint: form.reviewCheckpoint.trim() || undefined,
    nextToolId: form.nextToolId || undefined,
  };
  return Object.values(workflow).some(Boolean) ? workflow : undefined;
}

function workflowForm(item: ProviderResourceItem): ProviderWorkflowForm {
  return {
    job: item.meta?.workflow?.job || "",
    expectedOutput: item.meta?.workflow?.expectedOutput || "",
    reviewCheckpoint: item.meta?.workflow?.reviewCheckpoint || "",
    nextToolId: item.meta?.workflow?.nextToolId || "",
  };
}

function ProviderWorkflowFields({
  value,
  onChange,
  idPrefix,
}: {
  value: ProviderWorkflowForm;
  onChange: (next: ProviderWorkflowForm) => void;
  idPrefix: string;
}) {
  const update = (key: keyof ProviderWorkflowForm, next: string) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <Label htmlFor={`${idPrefix}-job`}>Field job (optional)</Label>
        <Textarea
          id={`${idPrefix}-job`}
          value={value.job}
          onChange={(event) => update("job", event.target.value)}
          maxLength={500}
          placeholder="What field job does this resource support?"
          className="mt-1 min-h-16"
          data-testid={`${idPrefix}-workflow-job`}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-output`}>Expected output (optional)</Label>
        <Textarea
          id={`${idPrefix}-output`}
          value={value.expectedOutput}
          onChange={(event) => update("expectedOutput", event.target.value)}
          maxLength={500}
          placeholder="What should a rep have when finished?"
          className="mt-1 min-h-16"
          data-testid={`${idPrefix}-workflow-output`}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-review`}>Review checkpoint (optional)</Label>
        <Textarea
          id={`${idPrefix}-review`}
          value={value.reviewCheckpoint}
          onChange={(event) => update("reviewCheckpoint", event.target.value)}
          maxLength={500}
          placeholder="What should be checked before using it?"
          className="mt-1 min-h-16"
          data-testid={`${idPrefix}-workflow-review`}
        />
      </div>
      <div className="md:col-span-2">
        <Label>Next Field Kit tool (optional)</Label>
        <Select
          value={value.nextToolId || "__none__"}
          onValueChange={(next) => update("nextToolId", next === "__none__" ? "" : next)}
        >
          <SelectTrigger className="mt-1" data-testid={`${idPrefix}-workflow-next-tool`}>
            <SelectValue placeholder="Use the safe default for this resource type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Use the safe default for this resource type</SelectItem>
            {FIELD_KIT_TOOLS.map((tool) => (
              <SelectItem key={tool.id} value={tool.id}>
                {tool.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          Guidance is organization-authored. Do not include member details, patient information, or PHI.
        </p>
      </div>
    </div>
  );
}

type ResourceArchitecture = {
  jobToAccomplish?: string;
  useCase?: string;
  whenToUse?: string;
  expectedOutcome?: string;
  role?: string[];
  completionTimeMinutes?: number | null;
  relatedToolIds?: string[];
  clinicalSensitivity?: string;
  experienceLevel?: string;
};

type ResourceWorkflow = {
  phase: "prepare" | "practice" | "execute" | "review";
  job: string;
  checklist: [string, string, string];
  tool?: ReturnType<typeof getToolById>;
};

function resourceArchitecture(resource: SelectResource): ResourceArchitecture {
  return (
    (resource as SelectResource & { architecture?: ResourceArchitecture }).architecture ??
    resource.contentArchitecture ??
    {}
  );
}

/**
 * A download needs a job and a finish line. This intentionally uses only
 * resource metadata and catalog IDs, never member-entered content.
 */
function resourceWorkflow(resource: SelectResource): ResourceWorkflow {
  const architecture = resourceArchitecture(resource);
  const category = resource.category;
  const defaults: Record<string, Omit<ResourceWorkflow, "job"> & { job: string }> = {
    template: {
      phase: "prepare",
      job: "Build a clear field plan before the next visit or territory block.",
      checklist: [
        "Choose one account, meeting, or planning block.",
        "Fill it with deidentified professional context only.",
        "Carry one commitment into the next field action.",
      ],
      tool: getToolById("playbooks"),
    },
    script: {
      phase: "practice",
      job: "Rehearse the language before the live conversation.",
      checklist: [
        "Pick the exact moment you expect to face.",
        "Practice one opening or response aloud.",
        "Adjust the wording after the real conversation.",
      ],
      tool: getToolById("role-play"),
    },
    checklist: {
      phase: "execute",
      job: "Move a real account or weekly commitment to a clear next step.",
      checklist: [
        "Use it immediately before or after the field task.",
        "Mark the commitment kept, moved, or blocked.",
        "Capture the owner and date for the follow-through.",
      ],
      tool: getToolById("sales-workflow"),
    },
    guide: {
      phase: "review",
      job: "Turn a lesson into one change in the next field block.",
      checklist: [
        "Read for one situation you will face this week.",
        "Choose one behavior or phrase to try.",
        "Review what changed after the next conversation.",
      ],
      tool: getToolById("weekly-plan"),
    },
  };
  const fallback = defaults[category] ?? defaults.guide;
  const relatedTool = architecture.relatedToolIds
    ?.map((id) => getToolById(id))
    .find((tool) => Boolean(tool));

  return {
    ...fallback,
    job: architecture.jobToAccomplish || architecture.useCase || fallback.job,
    tool: relatedTool ?? fallback.tool,
  };
}

export default function Resources() {
  const [, navigate] = useLocation();
  const { canUseFieldKit, member } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOrgAdmin =
    member?.role === "org_admin" || member?.role === "platform_admin";

  const { data: resourcesData, isLoading, isError, refetch: refetchResources } = useQuery<{
    resources: SelectResource[];
    ownershipLabel?: string;
  }>({
    queryKey: ["/api/resources"],
  });

  const {
    data: providerData,
    isLoading: providerLoading,
    isError: providerError,
    refetch: refetchProviderResources,
  } = useQuery<{
    items: ProviderResourceItem[];
    canManage?: boolean;
    ownershipLabel?: string;
  }>({
    queryKey: ["/api/v1/provider-resources"],
    queryFn: async () => {
      const res = await fetch("/api/v1/provider-resources", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Provider resources are temporarily unavailable.");
      }
      return res.json();
    },
    enabled: Boolean(canUseFieldKit),
  });

  const [providerSearch, setProviderSearch] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceCategory, setResourceCategory] = useState("all");
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newKind, setNewKind] = useState("script");
  const [newWorkflow, setNewWorkflow] = useState<ProviderWorkflowForm>(
    EMPTY_PROVIDER_WORKFLOW,
  );
  const [editingProviderId, setEditingProviderId] = useState<number | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<ProviderWorkflowForm>(
    EMPTY_PROVIDER_WORKFLOW,
  );

  const createProviderMutation = useMutation({
    mutationFn: async () => {
      const workflow = workflowPayload(newWorkflow);
      const res = await fetch("/api/v1/provider-resources", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          fileUrl: newUrl,
          kind: newKind,
          status: "published",
          meta: workflow ? { workflow } : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: { message?: string } })?.error?.message ||
            "Create failed",
        );
      }
      return res.json();
    },
    onSuccess: () => {
      setNewTitle("");
      setNewUrl("");
      setNewWorkflow(EMPTY_PROVIDER_WORKFLOW);
      queryClient.invalidateQueries({ queryKey: ["/api/v1/provider-resources"] });
      toast({ title: "Provider resource added" });
    },
    onError: (e: Error) => {
      toast({
        title: "Could not add resource",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({
      item,
      workflow,
    }: {
      item: ProviderResourceItem;
      workflow: ProviderWorkflowForm;
    }) => {
      const nextWorkflow = workflowPayload(workflow);
      const res = await fetch(`/api/v1/provider-resources/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta: {
            ...(item.meta || {}),
            workflow: nextWorkflow || null,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: { message?: string } })?.error?.message ||
            "Update failed",
        );
      }
      return res.json();
    },
    onSuccess: () => {
      setEditingProviderId(null);
      setEditingWorkflow(EMPTY_PROVIDER_WORKFLOW);
      queryClient.invalidateQueries({ queryKey: ["/api/v1/provider-resources"] });
      toast({ title: "Resource guidance updated" });
    },
    onError: (e: Error) => {
      toast({
        title: "Could not update guidance",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const resources = resourcesData?.resources || [];
  const providerItems = (providerData?.items || []).filter((item) => {
    if (!providerSearch.trim()) return true;
    const q = providerSearch.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      item.kind.toLowerCase().includes(q)
    );
  });

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
      trackProductOutcome("resource_completion", {
        resourceId: String(resource.id),
        surface: "resource-library",
        platform: "web",
      });
      window.open(url, "_blank");
      return;
    }
    setSelectedResource({ ...resource, fileUrl: url });
    setGateOpen(true);
  };

  const applyResourceWithSpartan = ({
    title,
    description,
    job,
    expectedOutcome,
  }: {
    title: string;
    description?: string | null;
    job?: string;
    expectedOutcome?: string;
  }) => {
    stageAiToolHandoff({
      sourceToolId: "content-recommender",
      targetToolId: "content-generator",
      output: {
        selectedResource: title,
        description: description || undefined,
        fieldJob: job,
        expectedOutcome,
        instruction: "Use this resource as the starting point. Create a deidentified field-ready version for the user's next professional conversation. Never request or include PHI.",
      },
    });
    trackEvent("resource_ai_apply", title);
    navigate("/tools/ai/content-generator");
  };

  const leadMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; resourceId: number; resourceTitle: string }) => {
      const res = await apiRequest("POST", "/api/resource-leads", data);
      return res.json();
    },
    onSuccess: () => {
      if (selectedResource) {
        trackEvent("resource_download", selectedResource.title);
        trackProductOutcome("resource_completion", {
          resourceId: String(selectedResource.id),
          surface: "resource-library",
          platform: "web",
        });
        window.open(selectedResource.fileUrl, '_blank');
      }
      setGateOpen(false);
      setLeadName("");
      setLeadEmail("");
      setSelectedResource(null);
    },
  });

  const visibleResources = resources.filter((resource) => {
    const architecture = resourceArchitecture(resource);
    const query = resourceSearch.trim().toLowerCase();
    const matchesCategory = resourceCategory === "all" || resource.category === resourceCategory;
    const matchesQuery = !query || [
      resource.title,
      resource.description || "",
      resource.category,
      architecture.whenToUse || "",
      architecture.expectedOutcome || "",
    ].some((value) => value.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  const groupedResources = visibleResources.reduce((acc, resource) => {
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
        <div className="text-center max-w-2xl mx-auto py-20">
          <p className="text-destructive">Failed to load resources. Please try again later.</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => void refetchResources()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
        <SEO />
        <div className="text-center max-w-2xl mx-auto py-20">
          <h1 className="text-h1 text-foreground mb-6" data-testid="text-resources-title">Training <span className="text-primary">Resources Library</span></h1>
          <p className="text-body-lg text-muted-foreground">
            No resources are available yet. You can continue with a focused tool or contact support.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild><Link href="/tools">Open Tools</Link></Button>
            <Button asChild variant="outline"><Link href="/contact">Contact support</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="resources-premium w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <div className="max-w-3xl mb-7">
        <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">
          {canUseFieldKit ? "Hospice Sales Pro · Field resources" : "Training library"}
        </p>
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl" data-testid="text-resources-title">
          {canUseFieldKit ? (
            <>Use the right resource at the <span className="text-primary">right moment.</span></>
          ) : (
            <>Training <span className="text-primary">Resources Library</span></>
          )}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-7">
          {canUseFieldKit
            ? "Current templates, scripts, and checklists for work you want to take into the field."
            : "Download field-tested templates, scripts, checklists, and guides to elevate your hospice sales performance."}
        </p>
        {canUseFieldKit && (
          <p className="text-sm text-muted-foreground mt-3">
            This library is for downloadable work aids. Use{" "}
            <Link href="/tools" className="font-semibold text-primary hover:underline">Tools</Link>
            {" "}when you need an interactive workspace.
          </p>
        )}
      </div>
      {!canUseFieldKit && <ContentNotice />}
      <Card className="mb-8 flex flex-col gap-3 border border-primary/20 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between" data-testid="resources-work-guide">
        <div>
          <p className="font-bold text-foreground">Keep professional context deidentified</p>
          <p className="mt-1 text-sm text-muted-foreground">Do not enter patient identifiers, PHI, or clinical records. AI-adapted work can be saved to My Work.</p>
        </div>
        <Button asChild variant="outline" className="shrink-0"><Link href="/my-work">Open My Work</Link></Button>
      </Card>
      <section className="resources-library-dock mb-8 rounded-2xl border border-border/80 bg-card p-4 sm:p-5" aria-labelledby="core-library-heading">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-primary uppercase">Core field library</p>
            <h2 id="core-library-heading" className="mt-1 text-h2">Find the right working asset</h2>
            <p className="mt-1 text-sm text-muted-foreground">Search by the conversation, outcome, or resource you need.</p>
          </div>
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Label htmlFor="resource-library-search" className="sr-only">Search core resources</Label>
            <Input
              id="resource-library-search"
              type="search"
              className="pl-9"
              placeholder="Search scripts, checklists, guides…"
              value={resourceSearch}
              onChange={(event) => setResourceSearch(event.target.value)}
              data-testid="input-core-resource-search"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter resources by type">
          {["all", "template", "script", "checklist", "guide"].map((category) => (
            <Button
              key={category}
              type="button"
              size="sm"
              variant={resourceCategory === category ? "default" : "outline"}
              className="min-h-10 shrink-0"
              aria-pressed={resourceCategory === category}
              onClick={() => setResourceCategory(category)}
              data-testid={`resource-filter-${category}`}
            >
              {category === "all" ? `All ${resources.length}` : categoryNames[category]}
            </Button>
          ))}
        </div>
      </section>
      {canUseFieldKit && (
        <div className="mb-12 space-y-4" data-testid="provider-resource-library">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">
                Provider organization
              </p>
              <h2 className="text-h2">Your private <span className="text-primary">library</span></h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Organization-only scripts, coverage maps, escalation guides, and policies.
                Clearly separate from{" "}
                <span className="font-semibold text-foreground">
                  {resourcesData?.ownershipLabel || "Hospice Sales Pro Core"}
                </span>
                .
              </p>
            </div>
            <div className="w-full sm:max-w-xs">
            <Label htmlFor="provider-resource-search" className="sr-only">Search provider library</Label>
            <Input
              id="provider-resource-search"
              placeholder="Search provider library"
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
              data-testid="input-provider-resource-search"
            />
            </div>
          </div>

          {isOrgAdmin && (
            <details className="rounded-xl border border-border bg-card p-4">
              <summary className="cursor-pointer text-sm font-bold text-foreground">Manage provider resources</summary>
            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold">Add provider resource (org admin)</p>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    data-testid="input-provider-title"
                  />
                </div>
                <div>
                  <Label>File URL (https or /objects/…)</Label>
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    data-testid="input-provider-file-url"
                  />
                </div>
                <div>
                  <Label>Kind</Label>
                  <Input
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value)}
                    placeholder="script, policy, form…"
                    data-testid="input-provider-kind"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Optional field guidance
                </p>
                <ProviderWorkflowFields
                  value={newWorkflow}
                  onChange={setNewWorkflow}
                  idPrefix="new-provider"
                />
              </div>
              <Button
                type="button"
                disabled={
                  !newTitle.trim() ||
                  !newUrl.trim() ||
                  createProviderMutation.isPending
                }
                onClick={() => createProviderMutation.mutate()}
                data-testid="button-add-provider-resource"
              >
                {createProviderMutation.isPending ? "Saving…" : "Publish to library"}
              </Button>
            </div>
            </details>
          )}

          {providerLoading ? (
            <p className="text-sm text-muted-foreground">Loading provider library…</p>
          ) : providerError ? (
            <StateBlock
              variant="error"
              title="Provider library unavailable"
              description="Your organization resources could not be loaded. Core Hospice Sales Pro resources are still available below."
              action={{ label: "Try provider library again", onClick: () => void refetchProviderResources() }}
              className="py-8"
            />
          ) : providerItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No provider-owned resources yet
              {isOrgAdmin ? " — add one above." : "."}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-cards">
              {providerItems.map((item) => {
                const workflow = getResourceWorkGuide({
                  category: item.kind,
                  workflow: item.meta?.workflow,
                });
                const nextTool = workflow.nextToolId ? getToolById(workflow.nextToolId) : undefined;
                return (
                  <Card
                    key={item.id}
                    className="flex flex-col border-2 spacing-card"
                    data-testid={`provider-resource-card-${item.id}`}
                  >
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge variant="default">Provider owned</Badge>
                      <Badge variant="outline">{item.kind}</Badge>
                      <Badge variant="secondary">{item.status}</Badge>
                    </div>
                    <h3 className="text-h3 text-foreground leading-tight mb-2">
                      {item.title}
                    </h3>
                    {item.description ? (
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                        {item.description}
                      </p>
                    ) : null}
                    <details
                      className="mb-4 rounded-lg border border-border/70 bg-muted/25 p-3 text-xs leading-relaxed text-muted-foreground"
                      data-testid={`provider-resource-workflow-${item.id}`}
                    >
                      <summary className="cursor-pointer font-semibold text-foreground">How to use this resource</summary>
                      <Badge variant="outline" className="mb-2 mt-3 text-[10px] uppercase tracking-wide text-primary">{workflow.phase}</Badge>
                      <p><span className="font-semibold text-foreground">Job: </span>{workflow.job}</p>
                      <p className="mt-1"><span className="font-semibold text-foreground">Safe use: </span>{workflow.inputHint}</p>
                      <p className="mt-1"><span className="font-semibold text-foreground">Expected output: </span>{workflow.outputPreview}</p>
                      <p className="mt-1"><span className="font-semibold text-foreground">Saved: </span>{workflow.persistence}</p>
                      <p className="mt-1"><span className="font-semibold text-foreground">Review: </span>{workflow.reviewCheckpoint}</p>
                      {nextTool ? (
                        <Link href={nextTool.path} className="mt-2 inline-flex min-h-8 items-center font-bold text-primary hover:underline">
                          Next: {nextTool.title}
                        </Link>
                      ) : null}
                    </details>
                    {isOrgAdmin && editingProviderId === item.id ? (
                      <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <p className="mb-3 text-sm font-semibold text-foreground">
                          Tailor field guidance
                        </p>
                        <ProviderWorkflowFields
                          value={editingWorkflow}
                          onChange={setEditingWorkflow}
                          idPrefix={`edit-provider-${item.id}`}
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={updateProviderMutation.isPending}
                            onClick={() =>
                              updateProviderMutation.mutate({
                                item,
                                workflow: editingWorkflow,
                              })
                            }
                            data-testid={`button-save-provider-guidance-${item.id}`}
                          >
                            {updateProviderMutation.isPending ? "Saving…" : "Save guidance"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingProviderId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-auto grid gap-2 sm:grid-cols-2">
                    <Button
                      className="w-full gap-2"
                      onClick={() => {
                        trackEvent("provider_resource_open", item.title);
                        window.open(item.fileUrl, "_blank");
                      }}
                      data-testid={`button-open-provider-${item.id}`}
                    >
                      <Download className="w-4 h-4" />
                      Open
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => applyResourceWithSpartan({ title: item.title, description: item.description, job: workflow.job, expectedOutcome: workflow.outputPreview })}
                      data-testid={`button-ai-provider-${item.id}`}
                    >
                      <Sparkles className="w-4 h-4" /> Apply with Spartan
                    </Button>
                    </div>
                    {isOrgAdmin && editingProviderId !== item.id ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-2 w-full"
                        onClick={() => {
                          setEditingProviderId(item.id);
                          setEditingWorkflow(workflowForm(item));
                        }}
                        data-testid={`button-edit-provider-guidance-${item.id}`}
                      >
                        Edit field guidance
                      </Button>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {canUseFieldKit && (
        <div className="mb-12">
          <ToolResultActions
            toolId="resources"
            title="Use the current copy in the field"
            description="Opening or downloading a resource does not save it to My Work or sync it to iPhone. Return to this library when you need the current copy."
            actions={[{ id: "open-tools", label: "Open Tools", href: "/tools" }]}
            persistenceNote="Downloads remain separate from saved tool outputs."
            testId="resources-next-action"
          />
        </div>
      )}

      <div className="space-y-10">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">
            {resourcesData?.ownershipLabel || "Hospice Sales Pro Core"}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Shared product library (not organization-private)
          </p>
        </div>
        {Object.entries(groupedResources).map(([category, categoryResources], index) => (
          <details key={category} className="resource-category-group rounded-2xl border border-border/70 bg-card/30 p-4" open={resourceCategory !== "all" || index === 0 ? true : undefined} data-testid={`category-${category}`}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-xl font-black tracking-tight">
              <span className="flex items-center gap-3">
                {categoryNames[category] || category}
                <Badge variant="secondary" className="text-sm">{categoryResources.length}</Badge>
              </span>
              <span className="resource-category-toggle text-xs font-bold uppercase tracking-widest text-primary">View</span>
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categoryResources.map((resource) => (
                <Card
                  key={resource.id}
                  className="resource-copy-safe group relative flex min-w-0 flex-col overflow-hidden border border-border/80 p-4 shadow-none transition-colors hover:border-primary/40"
                  data-testid={`resource-card-${resource.id}`}
                >
                  <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex-1 relative">
                    <div className="mb-3 flex min-w-0 items-start justify-between gap-2">
                      <h3 className="min-w-0 overflow-wrap-anywhere text-base font-bold leading-5 text-foreground">{resource.title}</h3>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        <Badge variant="outline">
                          {categoryNames[resource.category] || resource.category}
                        </Badge>
                        {(() => {
                          const life = (
                            resource as SelectResource & {
                              lifecycle?: {
                                versionLabel?: string;
                                hasNewerVersion?: boolean;
                                documentVersionLine?: string;
                                currentVersion?: { id: number; versionLabel: string };
                              };
                              versionLabel?: string | null;
                            }
                          ).lifecycle;
                          const ver =
                            life?.versionLabel ||
                            resource.versionLabel ||
                            resource.contentArchitecture?.versionLabel ||
                            resource.contentArchitecture?.contentVersion;
                          return ver ? (
                            <Badge variant="secondary" data-testid={`resource-version-${resource.id}`}>
                              v{ver}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    {(() => {
                      const life = (
                        resource as SelectResource & {
                          lifecycle?: {
                            hasNewerVersion?: boolean;
                            documentVersionLine?: string;
                            currentVersion?: { id: number; versionLabel: string; title: string };
                          };
                        }
                      ).lifecycle;
                      if (!life?.hasNewerVersion || !life.currentVersion) return null;
                      return (
                        <div
                          className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground"
                          data-testid={`resource-newer-${resource.id}`}
                        >
                          A newer version is available (v{life.currentVersion.versionLabel}
                          {life.currentVersion.title ? `: ${life.currentVersion.title}` : ""}
                          ). This copy is retained for history — do not treat it as current.
                        </div>
                      );
                    })()}

                    {resource.description && (
                      UX_WORKSPACE_IMPROVEMENTS ? (
                        <ExpandableText className="mb-3" lines={3}>{resource.description}</ExpandableText>
                      ) : (
                        <p className="resource-preview-clamp mb-3 text-sm text-muted-foreground">{resource.description}</p>
                      )
                    )}

                    {(() => {
                      const arch = resourceArchitecture(resource);
                      if (!arch) return null;
                      return (
                        <div className="mb-3 space-y-2 text-xs leading-5 text-muted-foreground">
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

                    {(() => {
                      const workflow = resourceWorkflow(resource);
                      const resourceGuide = getResourceWorkGuide({
                        category: resource.category,
                        relatedToolIds: resourceArchitecture(resource).relatedToolIds,
                      });
                      const relatedGuide = workflow.tool
                        ? getToolWorkGuide(workflow.tool)
                        : null;
                      return (
                        <details
                          className="mb-4 rounded-lg border border-border/70 bg-muted/25 p-3"
                          data-testid={`resource-workflow-${resource.id}`}
                        >
                          <summary className="cursor-pointer text-xs font-semibold text-foreground">How to use this resource</summary>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="mt-3 text-[10px] uppercase tracking-wide text-primary">
                              {workflow.phase}
                            </Badge>
                            <p className="text-xs font-semibold text-foreground">Completion checklist</p>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            <span className="font-semibold text-foreground">Job: </span>
                            {workflow.job}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            <span className="font-semibold text-foreground">Safe use: </span>
                            {resourceGuide.inputHint}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            <span className="font-semibold text-foreground">Expected output: </span>
                            {resourceGuide.outputPreview}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            <span className="font-semibold text-foreground">Saved: </span>
                            {resourceGuide.persistence}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            <span className="font-semibold text-foreground">Review: </span>
                            {resourceGuide.reviewCheckpoint}
                          </p>
                          <ol className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
                            {workflow.checklist.map((step, index) => (
                              <li key={step}>
                                <span className="mr-1 font-bold text-primary">{index + 1}.</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                          {workflow.tool ? (
                            <Link
                              href={workflow.tool.path}
                              className="mt-3 inline-flex min-h-9 items-center text-xs font-bold text-primary hover:underline"
                              data-testid={`resource-next-tool-${resource.id}`}
                            >
                              Next: {workflow.tool.title} · {relatedGuide?.phase}
                            </Link>
                          ) : null}
                        </details>
                      );
                    })()}

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button className="w-full gap-2" onClick={() => openDownload(resource)} data-testid={`button-download-${resource.id}`}>
                        <Download className="w-4 h-4" /> Download
                      </Button>
                      {canUseFieldKit ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => {
                            const arch = resourceArchitecture(resource);
                            applyResourceWithSpartan({
                              title: resource.title,
                              description: resource.description,
                              job: arch.jobToAccomplish || arch.useCase,
                              expectedOutcome: arch.expectedOutcome,
                            });
                          }}
                          data-testid={`button-ai-resource-${resource.id}`}
                        >
                          <Sparkles className="w-4 h-4" /> Apply with Spartan
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </details>
        ))}
        {visibleResources.length === 0 ? (
          <Card className="p-8 text-center" data-testid="resources-empty-search">
            <h2 className="text-lg font-bold text-foreground">No resources match that search</h2>
            <p className="mt-2 text-sm text-muted-foreground">Try a broader phrase or choose a different resource type.</p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => { setResourceSearch(""); setResourceCategory("all"); }}>
              Clear filters
            </Button>
          </Card>
        ) : null}
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
            {
              href: "/resources/weekly-plan",
              title: "Weekly Activity Planner",
              desc: "Interactive plan with save/resume across devices (signed in), print, and PDF. Purpose: Monday focus. Outcome: a completed week plan.",
              interactive: true,
            },
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
                  {"interactive" in item && item.interactive
                    ? "Open interactive plan"
                    : "Open and Print"}
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
      {!canUseFieldKit && (
        <PublicConversionPanel
          source="resources"
          audience="Hospice sales professionals looking for a usable template, script, checklist, or printable plan."
          promise="Start with an immediate resource, then continue into the tools and workflow that fit the task."
          evidence="Resources identify their intended use and expected outcome; optional email updates are separate from delivery."
          primary={{ label: "Preview Hospice Sales Pro tools", href: "/tools", token: "tools_preview" }}
          secondary={{ label: "Explore Hospice Sales Pro", href: "/hospice-sales-pro", token: "hospice_sales_pro" }}
        />
      )}
    </div>
  );
}
