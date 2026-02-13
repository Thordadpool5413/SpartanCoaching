import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  AnimatedCounter,
  ProgressRing,
  SlideUp,
  StaggerContainer,
  StaggerItem,
  FadeIn,
} from "@/components/animations";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { cn } from "@/lib/utils";
import {
  Target,
  Users,
  Flame,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Search,
  Zap,
  Calendar,
  CheckCircle,
  Star,
  Clock,
  Quote,
} from "lucide-react";

interface RolePlaySession {
  id: number;
  scenarioId: string;
  scenarioTitle: string;
  status: string;
  feedback: string | null;
  rating: number | null;
  createdAt: number;
}

interface DrillCompletion {
  id: number;
  drillIndex: number;
  drillTitle: string;
  notes: string | null;
  completedAt: number;
}

const MOTIVATIONAL_QUOTES = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The difference between a successful person and others is not a lack of strength, but a lack of will.", author: "Vince Lombardi" },
  { text: "Every sale has five basic obstacles: no need, no money, no hurry, no desire, no trust.", author: "Zig Ziglar" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Your attitude, not your aptitude, will determine your altitude.", author: "Zig Ziglar" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The harder the conflict, the greater the triumph.", author: "George Washington" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupery" },
];

function calculateStreak(completions: DrillCompletion[]): number {
  if (!completions.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completionDays = new Set(
    completions.map((c) => {
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

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getDailyQuote() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

export default function Dashboard() {
  const { data: sessions, isLoading: sessionsLoading } = useQuery<RolePlaySession[]>({
    queryKey: ["/api/roleplay/sessions"],
  });

  const { data: completions, isLoading: completionsLoading } = useQuery<DrillCompletion[]>({
    queryKey: ["/api/drills/completions"],
  });

  const isLoading = sessionsLoading || completionsLoading;

  const totalSessions = sessions?.length ?? 0;
  const completedWithRating = sessions?.filter((s) => s.status === "completed" && s.rating != null) ?? [];
  const avgRating = completedWithRating.length > 0
    ? Math.round((completedWithRating.reduce((sum, s) => sum + (s.rating ?? 0), 0) / completedWithRating.length) * 10) / 10
    : 0;
  const streak = completions ? calculateStreak(completions) : 0;
  const totalDrills = completions?.length ?? 0;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const drillsThisWeek = completions?.filter((c) => c.completedAt >= startOfWeek.getTime()).length ?? 0;
  const weeklyGoalProgress = Math.min((drillsThisWeek / 5) * 100, 100);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const sessionsThisMonth = sessions?.filter((s) => s.createdAt >= startOfMonth).length ?? 0;
  const monthlySessionsProgress = Math.min((sessionsThisMonth / 10) * 100, 100);

  type ActivityItem = {
    id: string;
    type: "drill" | "roleplay";
    title: string;
    timestamp: number;
    subtitle?: string;
    rating?: number | null;
  };

  const activityItems: ActivityItem[] = [];
  if (completions) {
    completions.forEach((c) => {
      activityItems.push({
        id: `drill-${c.id}`,
        type: "drill",
        title: c.drillTitle,
        timestamp: c.completedAt,
        subtitle: c.notes ?? undefined,
      });
    });
  }
  if (sessions) {
    sessions.forEach((s) => {
      activityItems.push({
        id: `roleplay-${s.id}`,
        type: "roleplay",
        title: s.scenarioTitle,
        timestamp: s.createdAt,
        subtitle: s.status === "completed" ? "Completed" : "In Progress",
        rating: s.rating,
      });
    });
  }
  activityItems.sort((a, b) => b.timestamp - a.timestamp);
  const recentActivity = activityItems.slice(0, 10);

  const quote = getDailyQuote();

  const stats = [
    { label: "Role-Play Sessions", value: totalSessions, icon: Users, color: "text-blue-500" },
    { label: "Avg Rating", value: avgRating, icon: Star, color: "text-yellow-500", suffix: "/10" },
    { label: "Day Streak", value: streak, icon: Flame, color: "text-orange-500" },
    { label: "Drills Completed", value: totalDrills, icon: CheckCircle, color: "text-green-500" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <SEO
        title="Dashboard | Spartan Coaching"
        description="Track your progress, view stats, and stay on top of your hospice sales training."
      />
      <Breadcrumbs items={[{ label: "Dashboard" }]} />

      <div className="mb-8">
        <h1 className="text-h1 font-black text-foreground mb-2" data-testid="text-dashboard-title">
          Your Dashboard
        </h1>
        <p className="text-body-lg text-muted-foreground" data-testid="text-dashboard-subtitle">
          Track your training progress and keep the momentum going.
        </p>
      </div>

      <FadeIn>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="stats-bar">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="spacing-card">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </Card>
              ))
            : stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="spacing-card bg-gradient-to-br from-background to-accent/5"
                  data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                    <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
                  </div>
                  <div className="text-3xl font-black text-foreground" data-testid={`text-stat-value-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                </Card>
              ))}
        </div>
      </FadeIn>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {isLoading ? (
          <>
            <Card className="spacing-card">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="flex items-center gap-6">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </Card>
            <Card className="spacing-card">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="flex items-center gap-6">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className="spacing-card bg-gradient-to-br from-background to-accent/5" data-testid="card-weekly-goal">
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-2 p-0 mb-4">
                <CardTitle className="text-lg font-bold">Weekly Goal</CardTitle>
                <Badge variant="secondary" data-testid="badge-weekly-count">
                  {drillsThisWeek}/5
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex items-center gap-6">
                  <ProgressRing
                    progress={weeklyGoalProgress}
                    size={80}
                    strokeWidth={6}
                    color="hsl(var(--primary))"
                  />
                  <div>
                    <p className="text-2xl font-black text-foreground" data-testid="text-weekly-drills">
                      {drillsThisWeek} <span className="text-base font-normal text-muted-foreground">of 5 drills</span>
                    </p>
                    <p className="text-sm text-muted-foreground">Complete 5 drills this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="spacing-card bg-gradient-to-br from-background to-accent/5" data-testid="card-monthly-sessions">
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-2 p-0 mb-4">
                <CardTitle className="text-lg font-bold">Monthly Sessions</CardTitle>
                <Badge variant="secondary" data-testid="badge-monthly-count">
                  {sessionsThisMonth}/10
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex items-center gap-6">
                  <ProgressRing
                    progress={monthlySessionsProgress}
                    size={80}
                    strokeWidth={6}
                    color="hsl(var(--primary))"
                  />
                  <div>
                    <p className="text-2xl font-black text-foreground" data-testid="text-monthly-sessions">
                      {sessionsThisMonth} <span className="text-base font-normal text-muted-foreground">of 10 sessions</span>
                    </p>
                    <p className="text-sm text-muted-foreground">Role-play sessions this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2">
          <Card className="spacing-card" data-testid="card-recent-activity">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground" data-testid="text-no-activity">
                    No activity yet. Complete a drill or start a role-play session!
                  </p>
                </div>
              ) : (
                <StaggerContainer className="space-y-3">
                  {recentActivity.map((item) => (
                    <StaggerItem key={item.id}>
                      <div
                        className="flex items-start gap-3 p-3 rounded-md bg-gradient-to-r from-accent/5 to-transparent"
                        data-testid={`activity-item-${item.id}`}
                      >
                        <div
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                            item.type === "drill"
                              ? "bg-orange-500/10 text-orange-500"
                              : "bg-blue-500/10 text-blue-500"
                          )}
                        >
                          {item.type === "drill" ? (
                            <Flame className="w-4 h-4" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate" data-testid={`text-activity-title-${item.id}`}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground" data-testid={`text-activity-time-${item.id}`}>
                              {getRelativeTime(item.timestamp)}
                            </span>
                            {item.type === "roleplay" && item.subtitle && (
                              <Badge variant="secondary" className="text-xs" data-testid={`badge-activity-status-${item.id}`}>
                                {item.subtitle}
                              </Badge>
                            )}
                            {item.type === "roleplay" && item.rating != null && (
                              <span className="flex items-center gap-0.5 text-xs text-yellow-500">
                                <Star className="w-3 h-3" />
                                {item.rating}/10
                              </span>
                            )}
                            {item.type === "drill" && item.subtitle && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="spacing-card" data-testid="card-quick-actions">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-muted-foreground" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <Button asChild className="w-full justify-between gap-2" variant="outline" data-testid="button-quick-action-roleplay">
                <Link href="/tools/role-play">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Start Role-Play
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild className="w-full justify-between gap-2" variant="outline" data-testid="button-quick-action-drill">
                <Link href="/drills">
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    Today's Drill
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild className="w-full justify-between gap-2" variant="outline" data-testid="button-quick-action-playbook">
                <Link href="/tools/playbooks">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Generate Playbook
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild className="w-full justify-between gap-2" variant="outline" data-testid="button-quick-action-research">
                <Link href="/tools/research">
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Research
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <SlideUp>
        <Card className="spacing-card bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20" data-testid="card-motivational-quote">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Quote className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-body-lg text-foreground italic leading-relaxed mb-2" data-testid="text-quote">
                "{quote.text}"
              </p>
              <p className="text-sm text-muted-foreground font-medium" data-testid="text-quote-author">
                — {quote.author}
              </p>
            </div>
          </div>
        </Card>
      </SlideUp>
    </div>
  );
}
