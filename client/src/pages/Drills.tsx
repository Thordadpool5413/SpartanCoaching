import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Flame, CheckCircle, Loader2, Calendar, BookOpen } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DailyDrill {
  drill: string;
  category: string;
  index: number;
}

interface DrillCompletion {
  id: number;
  drillIndex: number;
  drillTitle: string;
  notes: string | null;
  completedAt: number;
}

function calculateStreak(completions: Array<{ completedAt: number }>): number {
  if (!completions.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completionDays = new Set(
    completions.map(c => {
      const d = new Date(c.completedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let streak = 0;
  let checkDate = new Date(today);

  while (true) {
    if (completionDays.has(checkDate.getTime())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (streak === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (completionDays.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Drills() {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();

  const { data: drillData, isLoading: drillLoading } = useQuery<DailyDrill>({
    queryKey: ['/api/daily-drill'],
  });

  const { data: completions, isLoading: completionsLoading } = useQuery<DrillCompletion[]>({
    queryKey: ['/api/drills/completions'],
  });

  const completeMutation = useMutation({
    mutationFn: async (payload: { drillIndex: number; drillTitle: string; notes?: string }) => {
      const res = await apiRequest("POST", "/api/drills/completions", payload);
      return res.json();
    },
    onSuccess: () => {
      setCompleted(true);
      setShowNotes(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/drills/completions'] });
      toast({
        title: "Drill completed!",
        description: "Great work. Keep the streak going!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save completion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMarkComplete = () => {
    setShowNotes(true);
  };

  const handleSubmitCompletion = () => {
    if (!drillData) return;
    completeMutation.mutate({
      drillIndex: drillData.index,
      drillTitle: drillData.drill,
      notes: notes || undefined,
    });
  };

  const streak = completions ? calculateStreak(completions) : 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <SEO
        title="Daily Coaching Drills | Spartan"
        description="Sharpen your hospice sales skills with daily coaching drills. Build consistency and track your progress."
      />
      <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Daily Drills" }]} />

      <h1 className="text-h1 font-black text-foreground mb-2" data-testid="text-drills-title">
        Daily Coaching Drills
      </h1>
      <p className="text-body-lg text-muted-foreground mb-8 leading-relaxed" data-testid="text-drills-subtitle">
        Sharpen your skills with a new drill every day. Consistency builds mastery.
      </p>

      <div className="flex items-center gap-4 mb-8">
        <Card className="flex items-center gap-3 spacing-card" data-testid="card-streak">
          <Flame className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-3xl font-black text-foreground" data-testid="text-streak-count">
              {completionsLoading ? "—" : streak}
            </p>
            <p className="text-sm text-muted-foreground font-medium">Day Streak</p>
          </div>
        </Card>
      </div>

      {drillLoading ? (
        <Card className="spacing-card mb-8">
          <Skeleton className="h-5 w-28 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-3/4 mb-6" />
          <Skeleton className="h-9 w-40" />
        </Card>
      ) : drillData ? (
        <Card className="border-2 spacing-card mb-8" data-testid="card-today-drill">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-h3 font-bold" data-testid="text-drill-heading">
              Today's Drill
            </CardTitle>
            <Badge variant="secondary" data-testid="badge-drill-category">
              {drillData.category}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-body-lg text-foreground leading-relaxed mb-6" data-testid="text-drill-content">
              {drillData.drill}
            </p>

            {completed ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400" data-testid="text-drill-completed">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Completed!</span>
              </div>
            ) : showNotes ? (
              <div className="space-y-4">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this drill (optional)"
                  className="min-h-24"
                  data-testid="textarea-drill-notes"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handleSubmitCompletion}
                    disabled={completeMutation.isPending}
                    data-testid="button-submit-completion"
                  >
                    {completeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Submit Completion
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNotes(false);
                      setNotes("");
                    }}
                    data-testid="button-cancel-notes"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleMarkComplete} data-testid="button-mark-complete">
                <BookOpen className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h2 className="text-h2 font-bold text-foreground mb-6" data-testid="text-history-heading">
          Completion History
        </h2>

        {completionsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="spacing-card">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </Card>
            ))}
          </div>
        ) : completions && completions.length > 0 ? (
          <div className="space-y-4">
            {completions.map((completion) => (
              <Card
                key={completion.id}
                className="spacing-card border-2"
                data-testid={`card-completion-${completion.id}`}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground" data-testid={`text-completion-title-${completion.id}`}>
                      {completion.drillTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span data-testid={`text-completion-date-${completion.id}`}>
                        {formatDate(completion.completedAt)}
                      </span>
                    </div>
                    {completion.notes && (
                      <p className="mt-2 text-sm text-muted-foreground" data-testid={`text-completion-notes-${completion.id}`}>
                        {completion.notes}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="spacing-card" data-testid="card-empty-history">
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No completions yet. Complete today's drill to start your streak!</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
