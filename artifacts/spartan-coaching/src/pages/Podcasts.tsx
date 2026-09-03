import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Mic, Radio } from "lucide-react";
import type { SelectPodcast } from "@shared/schema";
import { BackButton } from "@/components/BackButton";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { ContentNotice } from "@/components/ContentNotice";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";

export default function Podcasts() {
  const { data, isLoading } = useQuery<{ podcasts: SelectPodcast[] }>({
    queryKey: ["/api/podcasts"],
  });

  const podcasts = data?.podcasts || [];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SEO />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-5 w-96 mb-8" />
          <div className="grid md:grid-cols-2 gap-cards">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="flex flex-col border-2 spacing-card">
                <Skeleton className="h-5 w-24 mb-3" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-4" />
                <Skeleton className="h-16 w-full mb-4" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (podcasts.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
        <SEO />
        <div className="mb-8">
          <BackButton />
        </div>
        <div className="text-center max-w-2xl mx-auto py-20">
          <h1 className="text-h1 text-foreground mb-6" data-testid="text-podcasts-title">Coaching <span className="text-primary">Podcasts</span></h1>
          <p className="text-body-lg text-muted-foreground">
            No podcast episodes available yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <div className="mb-8">
        <BackButton />
      </div>

      <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-16">
        <h1 className="text-h1 text-foreground mb-8" data-testid="text-podcasts-title">
          Coaching <span className="text-primary">Podcasts</span>
        </h1>
        <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Listen to expert insights, strategies, and real-world advice to elevate your hospice sales performance
        </p>
      </div>
      <ContentNotice />

      {/* Season launch newsletter signup */}
      <div className="mb-10 sm:mb-14">
        <Card className="border-2 overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Radio className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground mb-1">Season 1 is in production</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All episodes are currently being recorded and edited. Subscribe below and you will be among the first to know when new episodes drop.
              </p>
            </div>
            <div className="w-full sm:w-auto sm:min-w-72 flex-shrink-0">
              <NewsletterSignup />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-cards">
        {podcasts.map((podcast) => (
          <Card
            key={podcast.id}
            className="flex flex-col hover-elevate border-2 group relative spacing-card"
            data-testid={`podcast-card-${podcast.id}`}
          >
            <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex-1 relative">
              {podcast.episodeNumber && (
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="default" data-testid={`badge-episode-${podcast.id}`}>
                    Episode {podcast.episodeNumber}
                  </Badge>
                </div>
              )}

              <h3 className="text-h3 text-foreground mb-4 leading-tight" data-testid={`title-podcast-${podcast.id}`}>
                {podcast.title}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span data-testid={`date-podcast-${podcast.id}`}>
                    {new Date(podcast.publishDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {podcast.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span data-testid={`duration-podcast-${podcast.id}`}>{podcast.duration}</span>
                  </div>
                )}
              </div>

              {podcast.description && (
                <p className="text-base text-muted-foreground leading-relaxed mb-6" data-testid={`description-podcast-${podcast.id}`}>
                  {podcast.description}
                </p>
              )}

              {podcast.audioUrl ? (
                <audio
                  controls
                  className="w-full"
                  data-testid={`audio-player-${podcast.id}`}
                  preload="metadata"
                >
                  <source src={podcast.audioUrl} type="audio/mpeg" />
                  <source src={podcast.audioUrl} type="audio/mp4" />
                  <source src={podcast.audioUrl} type="audio/ogg" />
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <div className="w-full py-4 px-5 bg-accent/40 rounded-lg border border-border" data-testid={`audio-coming-soon-${podcast.id}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mic className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground mb-1">Audio being prepared</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        This episode is in production. Subscribe to our newsletter for release updates.
                      </p>
                      <Button asChild variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs text-primary">
                        <Link href="/contact">Get notified</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      <PublicConversionPanel
        source="podcasts"
        audience="Hospice growth professionals who prefer to learn through coaching conversations and field context."
        promise="Move from an episode into an applicable method, resource, or human conversation."
        evidence="Episode dates and availability are shown directly; optional updates are separate from membership."
        primary={{ label: "Explore the Spartan Method", href: "/method", token: "method" }}
        secondary={{ label: "Talk through a challenge", href: "/contact", token: "strategy_call" }}
      />
    </div>
  );
}
