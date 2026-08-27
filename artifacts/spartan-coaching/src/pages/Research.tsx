import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, SpinnerIcon } from "@/components/icons";
import { CoachingCTA } from "@/components/CoachingCTA";
import { SEO } from "@/components/SEO";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { trackEvent } from "@/lib/analytics";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ToolResultActions } from "@/components/ToolResultActions";

type SpartanCitation = {
  id: string;
  title: string;
  category: string;
  excerpt?: string;
};

type ResearchResult = {
  text: string;
  sources?: Array<{ title: string; uri: string }>;
  spartanCitations?: SpartanCitation[];
};

export default function Research() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exampleQueries = [
    "What are the latest CMS guidelines for hospice eligibility?",
    "How can hospice improve hospital readmission rates?",
    "What are effective strategies for engaging with physician practices?",
    "How do I explain the difference between palliative care and hospice?",
  ];

  const runSearch = async (q: string) => {
    if (q.length < 5) {
      setValidationError("Query must be at least 5 characters");
      return;
    }

    trackEvent("ai_tool_usage", "research");
    setIsLoading(true);
    setResults(null);
    setValidationError(null);
    setError(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: q }),
      });

      if (!response.ok) {
        throw new Error("Failed to perform research");
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Research error:", error);
      setError("Research could not be completed. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => runSearch(query);

  return (
    <FieldKitToolLayout toolPath="/tools/research" className="max-w-4xl">
      <SEO />
      <h1 className="text-h1 font-black text-foreground mb-6" data-testid="text-research-title">
        Grounded Research
      </h1>
      <p className="text-body-lg text-muted-foreground mb-8 leading-relaxed">
        Get expert insights with real web sources plus Spartan Method grounding. Ask about hospice trends,
        regulations, or competitive intelligence — never include PHI.
      </p>

      <Card className="mb-8 border-2 shadow-lg spacing-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (validationError && e.target.value.length >= 5) {
                setValidationError(null);
              }
            }}
            placeholder="Ask a question about hospice sales, regulations, or industry trends..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            data-testid="input-research-query"
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading || !query || query.length < 5}
            size="lg"
            className="font-bold touch-manipulation"
            data-testid="button-search"
          >
            {isLoading ? (
              <SpinnerIcon className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <SearchIcon className="w-5 h-5" />
                <span>Search</span>
              </>
            )}
          </Button>
        </div>
        {validationError && (
          <p className="text-sm text-destructive mt-2" data-testid="text-validation-error">
            {validationError}
          </p>
        )}
      </Card>

      {!results && !isLoading && (
        <div>
          <p className="text-body font-semibold text-muted-foreground mb-4">Example questions:</p>
          <div className="grid gap-3">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(example);
                  void runSearch(example);
                }}
                className="text-left p-4 rounded-lg bg-accent hover-elevate active-elevate-2 transition-all text-foreground touch-manipulation"
                data-testid={`button-example-${idx}`}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <Card className="flex items-center justify-center h-48 border-2 shadow-lg spacing-card">
          <div className="text-center">
            <SpinnerIcon className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Searching for relevant information...</p>
          </div>
        </Card>
      )}

      {error && !isLoading && (
        <Card className="border-destructive/30 spacing-card" role="alert" data-testid="card-research-error">
          <ToolResultActions
            toolId="research"
            title="Research unavailable"
            description={error}
            actions={[
              {
                id: "retry",
                label: "Retry research",
                onClick: () => void runSearch(query),
              },
            ]}
            persistenceNote="No result was created or saved. Retry only after confirming the question contains no PHI."
            testId="research-error-action"
          />
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          <Card className="border-2 shadow-lg spacing-card">
            <h2 className="text-h2 font-bold text-foreground mb-4">Research Results</h2>
            <div className="mb-6" data-testid="text-research-results">
              <MarkdownContent content={results.text} />
            </div>

            {results.spartanCitations && results.spartanCitations.length > 0 && (
              <div className="mb-6 rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-2" data-testid="spartan-citations">
                <h3 className="text-xs font-bold tracking-widest uppercase text-primary">
                  Spartan Method grounding
                </h3>
                <ul className="space-y-2">
                  {results.spartanCitations.map((c) => (
                    <li key={c.id} className="text-sm">
                      <span className="font-semibold text-foreground">{c.title}</span>
                      <span className="text-muted-foreground"> · {c.category}</span>
                      {c.excerpt && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {c.excerpt}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.sources && results.sources.length > 0 && (
              <div>
                <h3 className="text-h3 font-bold text-muted-foreground mb-4">Web sources</h3>
                <ul className="space-y-2">
                  {results.sources.map((source, idx) => (
                    <li key={idx}>
                      <a
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                        data-testid={`link-source-${idx}`}
                      >
                        <span>{source.title}</span>
                        <span className="text-xs">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ToolResultActions
              toolId="research"
              description="Turn one verified insight into a specific conversation plan before the next visit."
              actions={[
                {
                  id: "build-playbook",
                  label: "Build a Playbook from This Insight",
                  href: "/tools/playbooks",
                },
              ]}
              persistenceNote="Research is shown in this page session. It is not automatically saved to My Work; review the sources and copy only what you need."
              testId="research-next-action"
            />
          </Card>
          <CoachingCTA className="mt-2" />
        </div>
      )}
    </FieldKitToolLayout>
  );
}
