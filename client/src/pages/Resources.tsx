import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import type { SelectResource } from "@shared/schema";
import { SEO } from "@/components/SEO";

export default function Resources() {
  const { data: resourcesData, isLoading, isError } = useQuery<{ resources: SelectResource[] }>({
    queryKey: ["/api/resources"],
  });

  const resources = resourcesData?.resources || [];

  // Group resources by category
  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, SelectResource[]>);

  // Category display names
  const categoryNames: Record<string, string> = {
    template: "Templates",
    script: "Scripts",
    checklist: "Checklists",
    guide: "Guides",
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <SEO />
      <BackButton />
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <h1 className="text-5xl font-black text-foreground mb-6" data-testid="text-resources-title">
          Training Resources Library
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Download field-tested templates, scripts, checklists, and guides to elevate your hospice sales performance.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading resources...</p>
        </div>
      ) : isError ? (
        <Card className="border-destructive/50">
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Failed to load resources. Please try again later.</p>
          </CardContent>
        </Card>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No resources available yet. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedResources).map(([category, categoryResources]) => (
            <div key={category} data-testid={`category-${category}`}>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                {categoryNames[category] || category}
                <Badge variant="secondary" className="text-sm">
                  {categoryResources.length}
                </Badge>
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryResources.map((resource) => (
                  <Card 
                    key={resource.id} 
                    className="hover-elevate active-elevate-2 transition-all duration-300"
                    data-testid={`resource-card-${resource.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-xl leading-tight">{resource.title}</CardTitle>
                        <Badge variant="outline" className="shrink-0">
                          {categoryNames[resource.category] || resource.category}
                        </Badge>
                      </div>
                      {resource.description && (
                        <CardDescription className="line-clamp-3">
                          {resource.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full gap-2"
                        onClick={() => window.open(resource.fileUrl, '_blank')}
                        data-testid={`button-download-${resource.id}`}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}