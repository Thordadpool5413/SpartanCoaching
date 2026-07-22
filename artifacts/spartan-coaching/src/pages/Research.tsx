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

export default function Research() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ text: string; sources?: Array<{ title: string; uri: string }> } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const exampleQueries = [
    "What are the latest CMS guidelines for hospice eligibility?",
    "How can hospice improve hospital readmission rates?",
    "What are effective strategies for engaging with physician practices?",
    "How do I explain the difference between palliative care and hospice?",
  ];

  const handleSearch = async () => {
    if (query.length < 5) {
      setValidationError("Query must be at least 5 characters");
      return;
    }
    
    if (!query) return;
    
    trackEvent("ai_tool_usage", "research");
    setIsLoading(true);
    setResults(null);
    setValidationError(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Failed to perform research");
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Research error:", error);
      setResults({
        text: "Sorry, I couldn't complete the research. Please try again.",
        sources: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FieldKitToolLayout toolPath="/tools/research" className="max-w-4xl">
      <SEO />
      <h1 className="text-h1 font-black text-foreground mb-6" data-testid="text-research-title">
        Grounded Research
      </h1>
      <p className="text-body-lg text-muted-foreground mb-8 leading-relaxed">
        Get expert insights with real web sources. Ask questions about hospice trends, regulations, or competitive intelligence, and receive answers backed by credible citations.
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
          <Button onClick={handleSearch} disabled={isLoading || !query || query.length < 5} size="lg" className="font-bold touch-manipulation" data-testid="button-search">
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
                  setTimeout(() => {
                    setIsLoading(true);
                    setResults(null);
                    setValidationError(null);
                    fetch("/api/research", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ query: example }),
                    })
                      .then((response) => {
                        if (!response.ok) {
                          throw new Error("Failed to perform research");
                        }
                        return response.json();
                      })
                      .then((data) => {
                        setResults(data);
                      })
                      .catch((error) => {
                        console.error("Research error:", error);
                        setResults({
                          text: "Sorry, I couldn't complete the research. Please try again.",
                          sources: [],
                        });
                      })
                      .finally(() => {
                        setIsLoading(false);
                      });
                  }, 0);
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

      {results && (
        <div className="space-y-6">
          <Card className="border-2 shadow-lg spacing-card">
            <h2 className="text-h2 font-bold text-foreground mb-4">Research Results</h2>
            <div className="mb-6" data-testid="text-research-results">
              <MarkdownContent content={results.text} />
            </div>
            {results.sources && results.sources.length > 0 && (
              <div>
                <h3 className="text-h3 font-bold text-muted-foreground mb-4">Sources:</h3>
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
          </Card>
          <CoachingCTA className="mt-2" />
        </div>
      )}
    </FieldKitToolLayout>
  );
}
