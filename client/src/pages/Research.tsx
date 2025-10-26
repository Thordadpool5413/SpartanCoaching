import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, SpinnerIcon } from "@/components/icons";
import { BackButton } from "@/components/BackButton";

export default function Research() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ text: string; sources?: Array<{ title: string; uri: string }> } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const exampleQueries = [
    "What are the latest CMS guidelines for hospice eligibility?",
    "How can hospice improve hospital readmission rates?",
    "What are effective strategies for engaging with physician practices?",
    "How do I explain the difference between palliative care and hospice?",
  ];

  const handleSearch = async () => {
    if (!query) return;
    
    setIsLoading(true);
    setResults(null);

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
    <div className="w-full max-w-4xl mx-auto px-6 py-16">
      <BackButton />
      <h1 className="text-4xl font-black text-foreground mb-2" data-testid="text-research-title">
        Grounded Research Tool
      </h1>
      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
        Get AI-powered insights with real web sources. Ask questions about hospice trends, regulations, or competitive intelligence, and receive answers backed by credible citations.
      </p>

      <Card className="mb-8">
        <div className="flex gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about hospice sales, regulations, or industry trends..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            data-testid="input-research-query"
          />
          <Button onClick={handleSearch} disabled={isLoading || !query} className="font-bold" data-testid="button-search">
            {isLoading ? (
              <SpinnerIcon className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <SearchIcon className="w-5 h-5" />
                Search
              </>
            )}
          </Button>
        </div>
      </Card>

      {!results && !isLoading && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-4">Example questions:</p>
          <div className="grid gap-3">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="text-left p-4 rounded-lg bg-accent hover-elevate transition-all text-foreground"
                data-testid={`button-example-${idx}`}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <Card className="flex items-center justify-center h-48">
          <div className="text-center">
            <SpinnerIcon className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Searching for relevant information...</p>
          </div>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl font-bold text-foreground mb-4">Research Results</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap mb-6" data-testid="text-research-results">
              {results.text}
            </div>
            {results.sources && results.sources.length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-muted-foreground mb-3">Sources:</h3>
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
        </div>
      )}
    </div>
  );
}
