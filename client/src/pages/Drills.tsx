import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
import { cn } from "@/lib/utils";
import {
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
} from "@/components/animations";

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

const categoryColors: Record<string, string> = {
  "Prospecting": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "Communication": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "Objection Handling": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  "Relationship Building": "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "Follow-Up": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  "Self-Reflection": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  "Planning": "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  "Clinical Knowledge": "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
};

const motivationalQuotes = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "The difference between a successful person and others is not lack of strength, but rather a lack of will.",
  "Every master was once a disaster. Keep drilling.",
  "Discipline is the bridge between goals and accomplishment.",
  "The only way to do great work is to love what you do and practice relentlessly.",
  "Champions don't show up to get everything they want; they show up to give everything they have.",
  "Your daily habits determine your future results.",
  "Consistency is what transforms average into excellence.",
  "The pain of discipline is far less than the pain of regret.",
  "Small daily improvements over time lead to stunning results.",
];

function getCompletionsThisWeek(completions: DrillCompletion[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return completions.filter(c => c.completedAt >= startOfWeek.getTime()).length;
}

function buildHeatmapData(completions: DrillCompletion[]): Map<string, number> {
  const map = new Map<string, number>();
  completions.forEach(c => {
    const d = new Date(c.completedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

function ActivityHeatmap({ completions }: { completions: DrillCompletion[] }) {
  const heatmapData = useMemo(() => buildHeatmapData(completions), [completions]);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: Date[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }

    const firstDay = days[0];
    const paddingDays = firstDay.getDay();
    const paddedDays: (Date | null)[] = Array(paddingDays).fill(null).concat(days);

    const weeksArr: (Date | null)[][] = [];
    for (let i = 0; i < paddedDays.length; i += 7) {
      weeksArr.push(paddedDays.slice(i, i + 7));
    }
    while (weeksArr[weeksArr.length - 1].length < 7) {
      weeksArr[weeksArr.length - 1].push(null);
    }

    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeksArr.forEach((week, colIdx) => {
      const validDay = week.find(d => d !== null);
      if (validDay) {
        const month = validDay.getMonth();
        if (month !== lastMonth) {
          labels.push({
            label: validDay.toLocaleDateString('en-US', { month: 'short' }),
            col: colIdx,
          });
          lastMonth = month;
        }
      }
    });

    return { weeks: weeksArr, monthLabels: labels };
  }, []);

  const getColor = (date: Date | null) => {
    if (!date) return "bg-transparent";
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const count = heatmapData.get(key) || 0;
    if (count === 0) return "bg-muted";
    if (count === 1) return "bg-primary/30";
    if (count === 2) return "bg-primary/60";
    return "bg-primary";
  };

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <Card className="spacing-card" data-testid="card-activity-heatmap">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold" data-testid="text-activity-title">Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-flex gap-0.5">
            <div className="flex flex-col gap-0.5 mr-1 pt-5">
              {dayLabels.map((label, i) => (
                <div key={i} className="h-[14px] flex items-center">
                  <span className="text-[10px] text-muted-foreground leading-none w-6 text-right">{label}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-1">
                {weeks.map((_, colIdx) => {
                  const ml = monthLabels.find(m => m.col === colIdx);
                  return (
                    <div key={colIdx} className="w-[14px]">
                      <span className="text-[10px] text-muted-foreground leading-none">
                        {ml ? ml.label : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-0.5">
                {weeks.map((week, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-0.5">
                    {week.map((day, rowIdx) => (
                      <div
                        key={rowIdx}
                        className={cn(
                          "w-[14px] h-[14px] rounded-sm",
                          getColor(day)
                        )}
                        title={day ? `${day.toLocaleDateString()}: ${heatmapData.get(`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`) || 0} completions` : ""}
                        data-testid={day ? `heatmap-day-${day.toISOString().split('T')[0]}` : undefined}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
  const totalCompleted = completions ? completions.length : 0;
  const thisWeek = completions ? getCompletionsThisWeek(completions) : 0;
  const dailyQuote = motivationalQuotes[new Date().getDate() % motivationalQuotes.length];

  const getCategoryBadgeClass = (category: string) => {
    return categoryColors[category] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <SEO
        title="Daily Coaching Drills | Spartan"
        description="Sharpen your hospice sales skills with daily coaching drills. Build consistency and track your progress."
      />
      <Breadcrumbs items={[{ label: "AI Tools", href: "/tools" }, { label: "Daily Drills" }]} />

      <SlideUp>
        <h1 className="text-h1 font-black text-foreground mb-2" data-testid="text-drills-title">
          Daily Coaching Drills
        </h1>
        <p className="text-body-lg text-muted-foreground mb-8 leading-relaxed" data-testid="text-drills-subtitle">
          Elevate your performance with focused daily practice. Each drill is designed to sharpen a specific skill that drives results.
        </p>
      </SlideUp>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="spacing-card bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-950/20 dark:to-transparent" data-testid="card-streak">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500 shrink-0" />
            <div>
              <p className="text-3xl font-black text-foreground" data-testid="text-streak-count">
                {completionsLoading ? "—" : <AnimatedCounter target={streak} />}
              </p>
              <p className="text-sm text-muted-foreground font-medium">Day Streak</p>
            </div>
          </div>
        </Card>
        <Card className="spacing-card bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent" data-testid="card-total-completed">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
            <div>
              <p className="text-3xl font-black text-foreground" data-testid="text-total-count">
                {completionsLoading ? "—" : <AnimatedCounter target={totalCompleted} />}
              </p>
              <p className="text-sm text-muted-foreground font-medium">Total Completed</p>
            </div>
          </div>
        </Card>
        <Card className="spacing-card bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent" data-testid="card-this-week">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-3xl font-black text-foreground" data-testid="text-week-count">
                {completionsLoading ? "—" : <AnimatedCounter target={thisWeek} />}
              </p>
              <p className="text-sm text-muted-foreground font-medium">This Week</p>
            </div>
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
        <Card className="spacing-card mb-8 border-2 border-primary/50" data-testid="card-today-drill">
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-2">
            <CardTitle className="text-h3 font-bold" data-testid="text-drill-heading">
              Today's Drill
            </CardTitle>
            <Badge
              className={cn("no-default-hover-elevate no-default-active-elevate", getCategoryBadgeClass(drillData.category))}
              data-testid="badge-drill-category"
            >
              {drillData.category}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-foreground leading-relaxed mb-6" data-testid="text-drill-content">
              {drillData.drill}
            </p>

            <AnimatePresence mode="wait">
              {completed ? (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ScaleIn>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400" data-testid="text-drill-completed">
                      <CheckCircle className="w-6 h-6" />
                      <span className="font-semibold text-lg">Completed!</span>
                    </div>
                  </ScaleIn>
                </motion.div>
              ) : showNotes ? (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
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
                </motion.div>
              ) : (
                <motion.div
                  key="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button onClick={handleMarkComplete} data-testid="button-mark-complete">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Mark as Complete
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      ) : null}

      {completionsLoading ? (
        <Card className="spacing-card mb-8">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[14px] w-full" />
            ))}
          </div>
        </Card>
      ) : completions ? (
        <div className="mb-8">
          <ActivityHeatmap completions={completions} />
        </div>
      ) : null}

      <div className="mb-8">
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
          <StaggerContainer className="space-y-4">
            {completions.map((completion) => (
              <StaggerItem key={completion.id}>
                <Card
                  className="spacing-card"
                  data-testid={`card-completion-${completion.id}`}
                >
                  <div className="flex items-start gap-3 flex-wrap">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
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
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <Card className="spacing-card" data-testid="card-empty-history">
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No completions yet. Complete today's drill to start your streak!</p>
            </div>
          </Card>
        )}
      </div>

      <FadeIn>
        <div className="text-center py-8" data-testid="text-motivational-quote">
          <p className="text-sm text-muted-foreground italic leading-relaxed max-w-lg mx-auto">
            "{dailyQuote}"
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
