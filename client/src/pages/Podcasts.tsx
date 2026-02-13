import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import type { SelectPodcast } from "@shared/schema";
import { BackButton } from "@/components/BackButton";
import { SEO } from "@/components/SEO";

export default function Podcasts() {
  const { data, isLoading } = useQuery<{ podcasts: SelectPodcast[] }>({
    queryKey: ["/api/podcasts"],
  });

  const podcasts = data?.podcasts || [];

  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <div className="mb-8">
        <BackButton />
      </div>

      <div className="mb-12 text-center">
        <h1 className="text-h1 mb-4" data-testid="text-podcasts-title">
          Coaching Podcasts
        </h1>
        <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
          Listen to expert insights, strategies, and real-world advice to elevate your hospice sales performance
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading podcast episodes...</p>
        </div>
      ) : podcasts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No podcast episodes available yet. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {podcasts.map((podcast) => (
            <Card key={podcast.id} data-testid={`podcast-card-${podcast.id}`} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {podcast.episodeNumber && (
                        <Badge variant="default" data-testid={`badge-episode-${podcast.id}`}>
                          Episode {podcast.episodeNumber}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl mb-2" data-testid={`title-podcast-${podcast.id}`}>
                      {podcast.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                  </div>
                </div>
                {podcast.description && (
                  <CardDescription className="text-base mt-3" data-testid={`description-podcast-${podcast.id}`}>
                    {podcast.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
