import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CoachingCTA } from "@/components/CoachingCTA";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Flame, CheckCircle, Loader2, Calendar, BookOpen, ChevronDown, ChevronRight, Library } from "lucide-react";
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

const CLIENT_DRILLS = [
  { category: "Prospecting", drill: "Review your territory map and identify the top 3 referral sources you have not contacted in 30 days. Send each a personalized value message today." },
  { category: "Prospecting", drill: "Identify 5 new potential referral sources in your territory that you have never visited. Research each one and plan your approach for this week." },
  { category: "Prospecting", drill: "Create a value drop for your top prospect. Find a relevant article, case study, or industry insight to share with no sales ask attached." },
  { category: "Communication", drill: "Practice your elevator pitch 3 times out loud. Time yourself. Can you deliver it confidently in under 60 seconds?" },
  { category: "Communication", drill: "Record yourself explaining hospice benefits to a family member. Listen back and identify filler words, unclear explanations, or missed empathy moments." },
  { category: "Communication", drill: "Write three different opening statements for cold calls. Test which feels most natural and authentic to your style." },
  { category: "Objection Handling", drill: "Identify one common objection you heard this week. Write out 3 different empathetic responses and practice them." },
  { category: "Objection Handling", drill: "Practice the Feel, Felt, Found technique. Write responses to 'Hospice means giving up,' 'We are not ready,' and 'We already have a hospice provider.'" },
  { category: "Objection Handling", drill: "Role-play handling the objection 'The patient is not ready for hospice yet' with three different approaches: clinical, emotional, and practical." },
  { category: "Relationship Building", drill: "Research one of your top referral partners. Find a recent news article or achievement about them to reference in your next visit." },
  { category: "Relationship Building", drill: "Send a handwritten thank-you note to a referral source who sent you a patient this month. Mention something specific about the case." },
  { category: "Relationship Building", drill: "Schedule a lunch-and-learn at a facility you want to grow. Prepare a 10-minute educational presentation on a hospice topic they would value." },
  { category: "Follow-Up", drill: "Review your follow-up list. Choose 3 prospects and send them valuable content (article, tip, resource) with no sales ask." },
  { category: "Follow-Up", drill: "Create a 30-60-90 day follow-up plan for your newest referral source. Map out touchpoints, value drops, and check-ins." },
  { category: "Self-Reflection", drill: "Reflect on your last 5 conversations. What questions did you ask? Write down 3 better discovery questions for next time." },
  { category: "Self-Reflection", drill: "Review your win/loss ratio this month. For each lost opportunity, identify the moment the conversation went sideways and what you would do differently." },
  { category: "Planning", drill: "Map out your ideal week. Block time for prospecting, follow-ups, education, and relationship building. Stick to it today." },
  { category: "Planning", drill: "Analyze your top 10 accounts by revenue potential. Are you spending enough time on your highest-value opportunities?" },
  { category: "Clinical Knowledge", drill: "Study one hospice eligibility diagnosis you are less familiar with. Learn the specific decline indicators and practice explaining them simply." },
  { category: "Clinical Knowledge", drill: "Review the four levels of hospice care. Practice explaining when each is appropriate in language a non-clinical person would understand." },
  { category: "Prospecting", drill: "Look at your calendar for the next two weeks. Identify any day where you have fewer than 4 conversations scheduled and fill those gaps with new or existing account visits right now." },
  { category: "Prospecting", drill: "List your top 5 referral sources from last quarter. Have any of them gone quiet? If so, plan a specific value touch for each one this week." },
  { category: "Communication", drill: "Think about the last referral you received. Write a thank you message to the person who sent it. Be specific about the patient outcome and why the referral mattered." },
  { category: "Communication", drill: "Practice explaining the difference between palliative care and hospice in 30 seconds or less. Say it out loud three times until it sounds natural." },
  { category: "Objection Handling", drill: "Write out your response to this exact phrase: 'Our patients are not ready for hospice.' Then practice delivering it with genuine curiosity rather than defensiveness." },
  { category: "Relationship Building", drill: "Pick one discharge planner you have a good relationship with. Ask them this week what the biggest challenge they are facing at work is. Just listen." },
  { category: "Relationship Building", drill: "Identify a referral source you lost this year. Write down what happened and what you would do differently. Consider whether it is worth re-engaging." },
  { category: "Follow-Up", drill: "Open your CRM or contact list. Find every referral source you spoke with last week and make sure each one has a clear next step documented." },
  { category: "Self-Reflection", drill: "Rate your energy level today on a scale of 1 to 10. If it is below a 7, identify one thing you can change about your routine tomorrow to show up sharper." },
  { category: "Planning", drill: "Write down your top 3 priorities for this week. Not tasks, priorities. Then check if your calendar actually reflects those priorities or if you are spending time on things that do not move the needle." },
  { category: "Clinical Knowledge", drill: "Pick one hospice eligibility diagnosis you are less confident discussing. Read the LCD criteria for that diagnosis and write down the three most important decline indicators in your own words." },
  { category: "Clinical Knowledge", drill: "Practice explaining what a FAST Scale score of 7A means to a nurse who asks why their dementia patient might qualify for hospice. Keep it under 60 seconds." },
];

function getClientFallbackDrill(): DailyDrill {
  const date = new Date();
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % CLIENT_DRILLS.length;
  return { ...CLIENT_DRILLS[index], index };
}

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
          <div className="inline-flex gap-0.5 min-w-max">
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
                      <span className="text-[10px] text-muted-foreground leading-none whitespace-nowrap">
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

interface LibraryDrill {
  index: number;
  category: string;
  drill: string;
}

export default function Drills() {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(false);
  const [librarySelectedIndex, setLibrarySelectedIndex] = useState<number | null>(null);
  const [libraryNotes, setLibraryNotes] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Prospecting"]));
  const { toast } = useToast();

  const { data: drillData } = useQuery<DailyDrill>({
    queryKey: ['/api/daily-drill'],
  });

  const activeDrill: DailyDrill = drillData ?? getClientFallbackDrill();

  const { data: completions, isLoading: completionsLoading } = useQuery<DrillCompletion[]>({
    queryKey: ['/api/drills/completions'],
  });

  const { data: libraryDrills } = useQuery<LibraryDrill[]>({
    queryKey: ['/api/drills'],
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

  const libraryCompleteMutation = useMutation({
    mutationFn: async (payload: { drillIndex: number; drillTitle: string; notes?: string }) => {
      const res = await apiRequest("POST", "/api/drills/completions", payload);
      return res.json();
    },
    onSuccess: () => {
      setLibrarySelectedIndex(null);
      setLibraryNotes("");
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
    completeMutation.mutate({
      drillIndex: activeDrill.index,
      drillTitle: activeDrill.drill,
      notes: notes || undefined,
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) { next.delete(category); } else { next.add(category); }
      return next;
    });
  };

  const completedIndexes = useMemo(() => {
    if (!completions) return new Set<number>();
    return new Set(completions.map(c => c.drillIndex));
  }, [completions]);

  const groupedLibrary = useMemo(() => {
    if (!libraryDrills) return {};
    return libraryDrills.reduce<Record<string, LibraryDrill[]>>((acc, d) => {
      if (!acc[d.category]) acc[d.category] = [];
      acc[d.category].push(d);
      return acc;
    }, {});
  }, [libraryDrills]);

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
                {completionsLoading ? "..." : <AnimatedCounter target={streak} />}
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
                {completionsLoading ? "..." : <AnimatedCounter target={totalCompleted} />}
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
                {completionsLoading ? "..." : <AnimatedCounter target={thisWeek} />}
              </p>
              <p className="text-sm text-muted-foreground font-medium">This Week</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="spacing-card mb-8 border-2 border-primary/50" data-testid="card-today-drill">
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-2">
            <CardTitle className="text-h3 font-bold" data-testid="text-drill-heading">
              Today's Drill
            </CardTitle>
            <Badge
              className={cn("no-default-hover-elevate no-default-active-elevate", getCategoryBadgeClass(activeDrill.category))}
              data-testid="badge-drill-category"
            >
              {activeDrill.category}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-foreground leading-relaxed mb-6" data-testid="text-drill-content">
              {activeDrill.drill}
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

      <div className="mb-8" data-testid="section-drill-library">
        <div className="flex items-center gap-3 mb-6">
          <Library className="w-6 h-6 text-primary shrink-0" />
          <div>
            <h2 className="text-h2 font-bold text-foreground" data-testid="text-library-heading">
              Drill Library
            </h2>
            <p className="text-sm text-muted-foreground">
              {libraryDrills ? `${libraryDrills.length} drills across ${Object.keys(groupedLibrary).length} categories. Complete any drill to build your streak.` : "Loading drills..."}
            </p>
          </div>
        </div>

        {!libraryDrills ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedLibrary).map(([category, drills]) => {
              const isExpanded = expandedCategories.has(category);
              const categoryDoneCount = drills.filter(d => completedIndexes.has(d.index)).length;
              return (
                <Card key={category} className="overflow-hidden" data-testid={`card-category-${category.replace(/\s+/g, '-').toLowerCase()}`}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover-elevate"
                    onClick={() => toggleCategory(category)}
                    data-testid={`button-toggle-category-${category.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      <span className="font-semibold text-foreground">{category}</span>
                      <Badge className={cn("no-default-hover-elevate no-default-active-elevate text-xs", getCategoryBadgeClass(category))}>
                        {drills.length} drills
                      </Badge>
                    </div>
                    {categoryDoneCount > 0 && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0">
                        {categoryDoneCount} of {drills.length} done
                      </span>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="border-t border-border divide-y divide-border">
                          {drills.map((drill) => {
                            const isDone = completedIndexes.has(drill.index);
                            const isSelected = librarySelectedIndex === drill.index;
                            return (
                              <div key={drill.index} className="px-4 py-3" data-testid={`drill-library-item-${drill.index}`}>
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground leading-relaxed">{drill.drill}</p>
                                    {isSelected && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-3 space-y-2"
                                      >
                                        <Textarea
                                          value={libraryNotes}
                                          onChange={(e) => setLibraryNotes(e.target.value)}
                                          placeholder="Add notes about this drill (optional)"
                                          className="min-h-20 text-sm"
                                          data-testid={`textarea-library-notes-${drill.index}`}
                                        />
                                        <div className="flex gap-2 flex-wrap">
                                          <Button
                                            size="sm"
                                            onClick={() => libraryCompleteMutation.mutate({ drillIndex: drill.index, drillTitle: drill.drill, notes: libraryNotes || undefined })}
                                            disabled={libraryCompleteMutation.isPending}
                                            data-testid={`button-library-submit-${drill.index}`}
                                          >
                                            {libraryCompleteMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                                            Save Completion
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => { setLibrarySelectedIndex(null); setLibraryNotes(""); }} data-testid={`button-library-cancel-${drill.index}`}>
                                            Cancel
                                          </Button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                  <div className="shrink-0">
                                    {isDone ? (
                                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400" data-testid={`status-done-${drill.index}`}>
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="text-xs font-medium hidden sm:block">Done</span>
                                      </div>
                                    ) : !isSelected ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setLibrarySelectedIndex(drill.index)}
                                        data-testid={`button-library-complete-${drill.index}`}
                                      >
                                        Complete
                                      </Button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <FadeIn>
        <div className="text-center py-8" data-testid="text-motivational-quote">
          <p className="text-sm text-muted-foreground italic leading-relaxed max-w-lg mx-auto">
            "{dailyQuote}"
          </p>
        </div>
      </FadeIn>

      <FadeIn>
        <CoachingCTA />
      </FadeIn>
    </div>
  );
}
