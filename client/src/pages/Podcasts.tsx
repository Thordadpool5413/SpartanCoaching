import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock } from "lucide-react";
import type { SelectPodcast } from "@shared/schema";
import { BackButton } from "@/components/BackButton";
import { SEO } from "@/components/SEO";

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
          <h1 className="text-h1 text-foreground mb-6" data-testid="text-podcasts-title">Coaching Podcasts</h1>
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
          Coaching Podcasts
        </h1>
        <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Listen to expert insights, strategies, and real-world advice to elevate your hospice sales performance
        </p>
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
                <div className="w-full py-3 px-4 bg-accent/50 rounded-lg text-center" data-testid={`audio-coming-soon-${podcast.id}`}>
                  <p className="text-sm font-medium text-muted-foreground">Episode coming soon</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
