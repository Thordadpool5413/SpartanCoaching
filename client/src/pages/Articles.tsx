import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { ExternalLink, Calendar, Star, FileText } from "lucide-react";
import type { SelectArticle } from "@shared/schema";
import { SEO } from "@/components/SEO";

export default function Articles() {
  const { data, isLoading } = useQuery<{ articles: SelectArticle[] }>({
    queryKey: ["/api/articles"],
  });

  const articles = data?.articles || [];
  const featuredArticles = articles.filter((a) => a.featured);
  const regularArticles = articles.filter((a) => !a.featured);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
        <SEO />
        <BackButton />
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading articles...</p>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
        <SEO />
        <BackButton />
        <div className="text-center max-w-2xl mx-auto py-20">
          <h1 className="text-h1 text-foreground mb-6">Articles</h1>
          <p className="text-body-lg text-muted-foreground">
            No articles have been published yet. Check back soon for insights on hospice sales, coaching, and industry trends.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <BackButton />
      
      {/* Header */}
      <div className="text-center max-w-4xl mx-auto mb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl -z-10"></div>
        <h1 className="text-hero text-foreground mb-8" data-testid="text-articles-title">
          Articles & <span className="text-gradient-primary">Insights</span>
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">
          Practical insights on hospice sales, territory management, and building relationships that matter. 
          Real strategies from the field, not theory from a desk.
        </p>
      </div>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Star className="w-7 h-7 text-primary fill-primary" />
            <h2 className="text-h2 text-foreground">Featured Articles</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-cards">
            {featuredArticles.map((article) => (
              <Card 
                key={article.id} 
                className="flex flex-col hover:shadow-2xl transition-elegant border-2 group relative overflow-hidden spacing-card"
                data-testid={`card-featured-article-${article.id}`}
              >
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex-1 relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-primary fill-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Featured</span>
                  </div>
                  
                  <h3 className="text-h3 text-foreground mb-4 leading-tight">
                    {article.title}
                  </h3>
                  
                  <p className="text-base text-muted-foreground leading-relaxed mb-6">
                    {article.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(article.publishDate)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1 gap-2"
                      asChild
                      data-testid={`button-read-article-${article.id}`}
                    >
                      <a 
                        href={article.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Read on LinkedIn
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    {article.pdfUrl && (
                      <Button
                        variant="outline"
                        className="gap-2"
                        asChild
                        data-testid={`button-view-pdf-${article.id}`}
                      >
                        <a 
                          href={article.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <FileText className="w-4 h-4" />
                          PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Regular Articles */}
      {regularArticles.length > 0 && (
        <div>
          <h2 className="text-h2 text-foreground mb-8">All Articles</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-cards">
            {regularArticles.map((article) => (
              <Card 
                key={article.id} 
                className="flex flex-col hover:shadow-2xl transition-elegant border-2 group relative overflow-hidden spacing-card"
                data-testid={`card-article-${article.id}`}
              >
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex-1 relative">
                  <h3 className="text-h3 text-foreground mb-4 leading-tight">
                    {article.title}
                  </h3>
                  
                  <p className="text-base text-muted-foreground leading-relaxed mb-6">
                    {article.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(article.publishDate)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      asChild
                      data-testid={`button-read-article-${article.id}`}
                    >
                      <a 
                        href={article.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Read on LinkedIn
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    {article.pdfUrl && (
                      <Button
                        variant="outline"
                        className="gap-2"
                        asChild
                        data-testid={`button-view-pdf-${article.id}`}
                      >
                        <a 
                          href={article.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <FileText className="w-4 h-4" />
                          PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
