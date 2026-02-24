import { useState, useCallback, useRef } from "react";
import { Link } from "wouter";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { FadeIn, SlideUp, AnimatedCounter } from "@/components/animations";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Calculator,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  ArrowRight,
  Home,
  ChevronRight,
  BarChart3,
  Zap,
  CheckCircle,
  RotateCcw,
  UserPlus,
  Briefcase,
  MapPin,
  Coffee,
  FileText,
  MessageSquare,
  Car,
  Sun,
  Sunset,
} from "lucide-react";

const SETTINGS = {
  workdaysInMonth: 20,
  workdaysPerWeek: 5,
  bufferConversationsPerAdmission: 2,
  teamBaselineConversationsPerAdmission: 15,
  rampWeek1: 0.5,
  rampWeek2: 0.7,
  rampWeek3: 0.85,
  rampWeek4: 1.0,
};

interface CalculationResult {
  repName: string;
  repStatus: "tenured" | "new_hire";
  monthlyGoal: number;
  conversationsPerAdmission: number;
  rateSource: string;
  baseConversations: number;
  bufferConversations: number;
  targetConversationsMonth: number;
  targetConversationsWeek: number;
  targetConversationsDay: number;
  rampWeek1: number;
  rampWeek2: number;
  rampWeek3: number;
  rampWeek4: number;
  plainEnglishPlan: string;
  plainEnglishRampPlan: string;
}

function calculateTargets(
  repName: string,
  repStatus: "tenured" | "new_hire",
  monthlyGoal: number,
  lastCycleAdmissions: number,
  lastCycleConversations: number
): CalculationResult {
  let conversationsPerAdmission: number;
  let rateSource: string;

  if (repStatus === "tenured" && lastCycleAdmissions > 0) {
    conversationsPerAdmission = lastCycleConversations / lastCycleAdmissions;
    rateSource = "Personal history from last cycle";
  } else {
    conversationsPerAdmission = SETTINGS.teamBaselineConversationsPerAdmission;
    rateSource = "Team baseline (no prior cycle data)";
  }

  const baseConversations = Math.ceil(monthlyGoal * conversationsPerAdmission);
  const bufferConversations = monthlyGoal * SETTINGS.bufferConversationsPerAdmission;
  const targetConversationsMonth = baseConversations + bufferConversations;
  const targetConversationsWeek = Math.ceil(
    targetConversationsMonth / (SETTINGS.workdaysInMonth / SETTINGS.workdaysPerWeek)
  );
  const targetConversationsDay = Math.ceil(
    targetConversationsMonth / SETTINGS.workdaysInMonth
  );

  const rampWeek1 = Math.ceil(targetConversationsWeek * SETTINGS.rampWeek1);
  const rampWeek2 = Math.ceil(targetConversationsWeek * SETTINGS.rampWeek2);
  const rampWeek3 = Math.ceil(targetConversationsWeek * SETTINGS.rampWeek3);
  const rampWeek4 = Math.ceil(targetConversationsWeek * SETTINGS.rampWeek4);

  const convPerAdmRounded = conversationsPerAdmission.toFixed(1);

  const plainEnglishPlan =
    `${repName || "This rep"} needs ${targetConversationsMonth} referral source conversations this month to hit ${monthlyGoal} admissions. ` +
    `That works out to ${targetConversationsWeek} conversations per week, or about ${targetConversationsDay} per day across ${SETTINGS.workdaysInMonth} workdays. ` +
    `This is based on a rate of ${convPerAdmRounded} conversations per admission${repStatus === "tenured" ? " from last cycle" : " (team baseline)"}, plus a buffer of ${bufferConversations} extra conversations to account for variability.`;

  const plainEnglishRampPlan =
    repStatus === "new_hire"
      ? `Week 1: ${rampWeek1} conversations (50% ramp). Week 2: ${rampWeek2} conversations (70% ramp). Week 3: ${rampWeek3} conversations (85% ramp). Week 4: ${rampWeek4} conversations (full pace). ` +
        `By week 4, ${repName || "this rep"} should be at steady state activity levels.`
      : "";

  return {
    repName,
    repStatus,
    monthlyGoal,
    conversationsPerAdmission,
    rateSource,
    baseConversations,
    bufferConversations,
    targetConversationsMonth,
    targetConversationsWeek,
    targetConversationsDay,
    rampWeek1,
    rampWeek2,
    rampWeek3,
    rampWeek4,
    plainEnglishPlan,
    plainEnglishRampPlan,
  };
}

function RampChart({ result }: { result: CalculationResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const maxVal = result.targetConversationsWeek;
  const weeks = [
    { label: "Week 1", value: result.rampWeek1, pct: "50%" },
    { label: "Week 2", value: result.rampWeek2, pct: "70%" },
    { label: "Week 3", value: result.rampWeek3, pct: "85%" },
    { label: "Week 4", value: result.rampWeek4, pct: "100%" },
  ];

  return (
    <div ref={ref} className="space-y-4">
      {weeks.map((week, index) => {
        const widthPct = maxVal > 0 ? (week.value / maxVal) * 100 : 0;
        return (
          <div key={index} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">{week.label}</span>
              <span className="text-muted-foreground">
                {week.value} conversations ({week.pct})
              </span>
            </div>
            <div className="h-8 bg-accent/50 rounded-md overflow-hidden relative">
              <motion.div
                className="h-full rounded-md flex items-center justify-end pr-3"
                style={{
                  background: `linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)`,
                }}
                initial={{ width: 0 }}
                animate={isInView ? { width: `${widthPct}%` } : { width: 0 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.15,
                  ease: "easeOut",
                }}
              >
                <span className="text-xs font-bold text-white drop-shadow-sm">
                  {week.value}
                </span>
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayInTheFieldCard({ result }: { result: CalculationResult }) {
  const daily = result.targetConversationsDay;
  const morningConvos = Math.ceil(daily / 2);
  const afternoonConvos = daily - morningConvos;

  const totalWorkHours = 8;
  const lunchHours = 0.5;
  const driveHours = Math.min(2.5, Math.max(1.5, daily * 0.25));
  const docHours = Math.min(1.5, Math.max(0.5, daily * 0.15));
  const sellingHours = totalWorkHours - lunchHours - driveHours - docHours;
  const minutesBetween = sellingHours > 0 ? Math.round((sellingHours * 60) / daily) : 0;

  const driveRounded = Math.round(driveHours * 10) / 10;
  const docRounded = Math.round(docHours * 10) / 10;
  const sellingRounded = Math.round(sellingHours * 10) / 10;

  return (
    <Card className="border-2 spacing-card h-full" data-testid="card-day-in-field">
      <CardTitle className="text-h3 mb-6 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        Your Day in the Field
      </CardTitle>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Morning</span>
            </div>
            <p className="text-2xl font-black text-foreground">{morningConvos}</p>
            <p className="text-xs text-muted-foreground">conversations before lunch</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sunset className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">Afternoon</span>
            </div>
            <p className="text-2xl font-black text-foreground">{afternoonConvos}</p>
            <p className="text-xs text-muted-foreground">conversations after lunch</p>
          </div>
        </div>

        <div className="p-4 bg-primary/5 rounded-xl">
          <p className="text-sm font-semibold text-foreground mb-1">
            About 1 conversation every {minutesBetween} minutes of selling time
          </p>
          <p className="text-xs text-muted-foreground">
            Based on {sellingRounded} hours of actual face time per day
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested Time Blocks</p>
          <div className="space-y-2">
            {[
              { icon: Car, label: "Drive time between accounts", value: `${driveRounded} hours`, color: "text-slate-600 dark:text-slate-400" },
              { icon: MessageSquare, label: "Actual selling and face time", value: `${sellingRounded} hours`, color: "text-green-600 dark:text-green-400" },
              { icon: FileText, label: "Documentation and follow ups", value: `${docRounded} hours`, color: "text-purple-600 dark:text-purple-400" },
              { icon: Coffee, label: "Lunch break", value: "30 min", color: "text-amber-600 dark:text-amber-400" },
            ].map((block, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <block.icon className={`w-4 h-4 ${block.color}`} />
                  <span className="text-sm text-foreground">{block.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{block.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-accent/30 rounded-lg">
          <p className="text-xs text-muted-foreground leading-relaxed">
            These are suggested blocks. Adjust based on your territory size and account density. The key is making sure {daily} conversations actually happen, however you structure the day.
          </p>
        </div>
      </div>
    </Card>
  );
}

interface TimeBlock {
  label: string;
  start: string;
  end: string;
  type: "conversation" | "drive" | "doc" | "lunch";
  icon: typeof MessageSquare;
}

function buildDaySchedule(dailyTarget: number): TimeBlock[] {
  const schedule: TimeBlock[] = [];
  const morningConvos = Math.ceil(dailyTarget / 2);
  const afternoonConvos = dailyTarget - morningConvos;

  let hour = 8;
  let minute = 0;

  const addMinutes = (h: number, m: number, add: number) => {
    m += add;
    while (m >= 60) { h++; m -= 60; }
    return [h, m];
  };

  const fmt = (h: number, m: number) => {
    const period = h >= 12 ? "pm" : "am";
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${m.toString().padStart(2, "0")}${period}`;
  };

  const avgConvoMin = 20;
  const avgDriveMin = 15;
  const docMin = 10;

  for (let i = 0; i < morningConvos; i++) {
    if (i > 0) {
      const driveStart = fmt(hour, minute);
      [hour, minute] = addMinutes(hour, minute, avgDriveMin);
      schedule.push({ label: "Drive to next account", start: driveStart, end: fmt(hour, minute), type: "drive", icon: Car });
    }
    const convoStart = fmt(hour, minute);
    [hour, minute] = addMinutes(hour, minute, avgConvoMin);
    schedule.push({ label: `Conversation ${i + 1}`, start: convoStart, end: fmt(hour, minute), type: "conversation", icon: MessageSquare });
  }

  if (hour < 12) {
    const docStart = fmt(hour, minute);
    [hour, minute] = addMinutes(hour, minute, docMin);
    schedule.push({ label: "Quick notes and follow ups", start: docStart, end: fmt(hour, minute), type: "doc", icon: FileText });
  }

  if (hour < 12) { hour = 12; minute = 0; }
  schedule.push({ label: "Lunch break", start: fmt(hour, minute), end: fmt(12, 30), type: "lunch", icon: Coffee });
  hour = 12; minute = 30;

  for (let i = 0; i < afternoonConvos; i++) {
    if (i > 0 || morningConvos > 0) {
      const driveStart = fmt(hour, minute);
      [hour, minute] = addMinutes(hour, minute, avgDriveMin);
      schedule.push({ label: "Drive to next account", start: driveStart, end: fmt(hour, minute), type: "drive", icon: Car });
    }
    const convoStart = fmt(hour, minute);
    [hour, minute] = addMinutes(hour, minute, avgConvoMin);
    schedule.push({ label: `Conversation ${morningConvos + i + 1}`, start: convoStart, end: fmt(hour, minute), type: "conversation", icon: MessageSquare });
  }

  const wrapStart = fmt(hour, minute);
  const endTime = Math.max(hour + 1, 17);
  schedule.push({ label: "Documentation and wrap up", start: wrapStart, end: fmt(endTime > 17 ? 17 : endTime, 0), type: "doc", icon: FileText });

  return schedule;
}

const blockColors = {
  conversation: {
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-300 dark:border-green-700",
    text: "text-green-800 dark:text-green-300",
    icon: "text-green-600 dark:text-green-400",
    barBg: "bg-green-500",
  },
  drive: {
    bg: "bg-slate-100 dark:bg-slate-800/50",
    border: "border-slate-300 dark:border-slate-600",
    text: "text-slate-700 dark:text-slate-300",
    icon: "text-slate-500 dark:text-slate-400",
    barBg: "bg-slate-400",
  },
  doc: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-800 dark:text-purple-300",
    icon: "text-purple-600 dark:text-purple-400",
    barBg: "bg-purple-500",
  },
  lunch: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-800 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
    barBg: "bg-amber-500",
  },
};

function DayTimelineVisual({ result }: { result: CalculationResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const schedule = buildDaySchedule(result.targetConversationsDay);

  return (
    <Card className="border-2 spacing-card shadow-lg" data-testid="card-day-timeline" ref={ref}>
      <CardTitle className="text-h3 mb-2 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        A Day in the Life
      </CardTitle>
      <p className="text-xs text-muted-foreground mb-6">
        What a productive day looks like when you are hitting {result.targetConversationsDay} conversations
      </p>

      <div className="flex items-center gap-4 flex-wrap mb-6">
        {[
          { type: "conversation" as const, label: "Conversation" },
          { type: "drive" as const, label: "Drive Time" },
          { type: "doc" as const, label: "Documentation" },
          { type: "lunch" as const, label: "Lunch" },
        ].map((legend) => (
          <div key={legend.type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${blockColors[legend.type].barBg}`} />
            <span className="text-xs text-muted-foreground">{legend.label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {schedule.map((block, index) => {
          const colors = blockColors[block.type];
          const Icon = block.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border}`}
              data-testid={`timeline-block-${index}`}
            >
              <div className="flex-shrink-0">
                <Icon className={`w-4 h-4 ${colors.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${colors.text}`}>{block.label}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {block.start} to {block.end}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-3 bg-accent/30 rounded-lg">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This is one example of how the day could flow. Your actual schedule will vary based on geography, appointment availability, and account density. The point is to see that {result.targetConversationsDay} conversations per day is achievable with intentional planning.
        </p>
      </div>
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
  delay,
  gradient,
}: {
  icon: typeof Target;
  label: string;
  value: number;
  suffix?: string;
  description: string;
  delay: number;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="border-2 spacing-card h-full relative overflow-visible" data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-md ${gradient}`} />
        <div className="flex items-start gap-4 pt-2">
          <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              {label}
            </p>
            <div className="flex items-baseline gap-1">
              <AnimatedCounter
                target={value}
                duration={1.2}
                className="text-3xl font-black text-foreground"
              />
              {suffix && (
                <span className="text-sm font-medium text-muted-foreground">
                  {suffix}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function ActivityCalculator() {
  const [repName, setRepName] = useState("");
  const [repStatus, setRepStatus] = useState<"tenured" | "new_hire">("tenured");
  const [monthlyGoal, setMonthlyGoal] = useState<string>("");
  const [lastCycleAdmissions, setLastCycleAdmissions] = useState<string>("");
  const [lastCycleConversations, setLastCycleConversations] = useState<string>("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const isFormValid =
    monthlyGoal !== "" &&
    Number(monthlyGoal) > 0 &&
    (repStatus === "new_hire" ||
      (lastCycleAdmissions !== "" && lastCycleConversations !== "" && Number(lastCycleConversations) > 0));

  const handleCalculate = useCallback(() => {
    if (!isFormValid) return;
    const calc = calculateTargets(
      repName,
      repStatus,
      Number(monthlyGoal),
      Number(lastCycleAdmissions) || 0,
      Number(lastCycleConversations) || 0
    );
    setResult(calc);
    setShowResult(true);
  }, [repName, repStatus, monthlyGoal, lastCycleAdmissions, lastCycleConversations, isFormValid]);

  const handleReset = useCallback(() => {
    setShowResult(false);
    setTimeout(() => {
      setResult(null);
      setRepName("");
      setRepStatus("tenured");
      setMonthlyGoal("");
      setLastCycleAdmissions("");
      setLastCycleConversations("");
    }, 300);
  }, []);

  return (
    <div className="w-full" data-testid="section-activity-calculator">
      <SEO
        title="Activity Calculator | Spartan Coaching"
        description="Calculate the exact number of referral source conversations your hospice reps need each month, week, and day to hit their admission goals. Includes new hire ramp planning."
        keywords="hospice activity calculator, sales activity planner, admission goal calculator, referral conversations, hospice sales targets"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap"
          data-testid="breadcrumb-activity"
          aria-label="Breadcrumb navigation"
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            aria-label="Go to home page"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href="/tools"
            className="hover:text-foreground transition-colors"
            aria-label="Go to tools page"
          >
            Tools
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Activity Calculator</span>
        </nav>

        <SlideUp>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center shadow-lg">
                <Calculator className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1
              className="text-h1 font-black text-foreground mb-4"
              data-testid="text-activity-title"
            >
              Activity Calculator
            </h1>
            <p className="text-body-lg text-muted-foreground leading-relaxed">
              Turn a monthly admission goal into the exact number of referral source
              conversations needed for the month, week, and day. Built for tenured
              reps and new hires alike.
            </p>
          </div>
        </SlideUp>

        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              <div className="max-w-2xl mx-auto">
                <Card className="border-2 spacing-card shadow-lg" data-testid="card-activity-form">
                  <div className="space-y-8">
                    <div>
                      <Label htmlFor="repName" className="text-sm font-semibold mb-2 block">
                        Rep Name (optional)
                      </Label>
                      <Input
                        id="repName"
                        type="text"
                        placeholder="e.g. Sarah Johnson"
                        value={repName}
                        onChange={(e) => setRepName(e.target.value)}
                        data-testid="input-rep-name"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-3 block">
                        Rep Status
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRepStatus("tenured")}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                            repStatus === "tenured"
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                          data-testid="button-status-tenured"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                              repStatus === "tenured"
                                ? "bg-primary/10"
                                : "bg-accent"
                            }`}
                          >
                            <Briefcase
                              className={`w-5 h-5 transition-colors duration-300 ${
                                repStatus === "tenured"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-sm font-semibold transition-colors duration-300 ${
                              repStatus === "tenured"
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            Tenured Rep
                          </span>
                          <span className="text-xs text-muted-foreground text-center">
                            Has prior month data
                          </span>
                          {repStatus === "tenured" && (
                            <motion.div
                              layoutId="statusIndicator"
                              className="absolute top-2 right-2"
                              transition={{ type: "spring", duration: 0.4 }}
                            >
                              <CheckCircle className="w-5 h-5 text-primary" />
                            </motion.div>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setRepStatus("new_hire")}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                            repStatus === "new_hire"
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                          data-testid="button-status-new-hire"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                              repStatus === "new_hire"
                                ? "bg-primary/10"
                                : "bg-accent"
                            }`}
                          >
                            <UserPlus
                              className={`w-5 h-5 transition-colors duration-300 ${
                                repStatus === "new_hire"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-sm font-semibold transition-colors duration-300 ${
                              repStatus === "new_hire"
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            New Hire
                          </span>
                          <span className="text-xs text-muted-foreground text-center">
                            No prior month data yet
                          </span>
                          {repStatus === "new_hire" && (
                            <motion.div
                              layoutId="statusIndicator"
                              className="absolute top-2 right-2"
                              transition={{ type: "spring", duration: 0.4 }}
                            >
                              <CheckCircle className="w-5 h-5 text-primary" />
                            </motion.div>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="monthlyGoal"
                        className="text-sm font-semibold mb-2 block"
                      >
                        Monthly Admission Goal
                      </Label>
                      <Input
                        id="monthlyGoal"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="e.g. 8"
                        value={monthlyGoal}
                        onChange={(e) => setMonthlyGoal(e.target.value)}
                        data-testid="input-monthly-goal"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        The number of admissions this rep is targeting this month
                      </p>
                    </div>

                    <AnimatePresence>
                      {repStatus === "tenured" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-6 pt-2 border-t">
                            <p className="text-xs font-medium text-primary uppercase tracking-wider pt-4">
                              Last Cycle Performance (Previous 20 Workdays)
                            </p>
                            <div>
                              <Label
                                htmlFor="lastAdmissions"
                                className="text-sm font-semibold mb-2 block"
                              >
                                Last Cycle Admissions
                              </Label>
                              <Input
                                id="lastAdmissions"
                                type="number"
                                min="0"
                                max="100"
                                placeholder="e.g. 6"
                                value={lastCycleAdmissions}
                                onChange={(e) =>
                                  setLastCycleAdmissions(e.target.value)
                                }
                                data-testid="input-last-admissions"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                How many admissions did this rep get last cycle
                              </p>
                            </div>
                            <div>
                              <Label
                                htmlFor="lastConversations"
                                className="text-sm font-semibold mb-2 block"
                              >
                                Last Cycle Referral Conversations
                              </Label>
                              <Input
                                id="lastConversations"
                                type="number"
                                min="0"
                                max="500"
                                placeholder="e.g. 90"
                                value={lastCycleConversations}
                                onChange={(e) =>
                                  setLastCycleConversations(e.target.value)
                                }
                                data-testid="input-last-conversations"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Total live conversations with referral source contacts last cycle
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      size="lg"
                      className="w-full font-bold touch-manipulation group"
                      onClick={handleCalculate}
                      disabled={!isFormValid}
                      data-testid="button-calculate"
                    >
                      <Calculator className="w-5 h-5 mr-2" />
                      <span>Calculate Activity Targets</span>
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>

                <FadeIn delay={0.3}>
                  <div className="mt-8 text-center">
                    <p className="text-xs text-muted-foreground">
                      One activity equals a live conversation with a contact at a referral source.
                    </p>
                  </div>
                </FadeIn>
              </div>
            </motion.div>
          ) : result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-h2 font-black text-foreground" data-testid="text-results-title">
                      {result.repName ? `${result.repName}'s Plan` : "Activity Plan"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Target className="w-4 h-4 text-primary" />
                        {result.monthlyGoal} admission goal
                      </span>
                      <span className="text-border">|</span>
                      <span className="inline-flex items-center gap-1">
                        {result.repStatus === "tenured" ? (
                          <Briefcase className="w-4 h-4" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        {result.repStatus === "tenured"
                          ? "Tenured Rep"
                          : "New Hire"}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    data-testid="button-recalculate"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Recalculate
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <MetricCard
                    icon={Calendar}
                    label="Monthly Target"
                    value={result.targetConversationsMonth}
                    suffix="conversations"
                    description={`Across ${SETTINGS.workdaysInMonth} workdays`}
                    delay={0.1}
                    gradient="bg-gradient-to-r from-red-500 to-orange-500"
                  />
                  <MetricCard
                    icon={BarChart3}
                    label="Weekly Target"
                    value={result.targetConversationsWeek}
                    suffix="conversations"
                    description={`${SETTINGS.workdaysPerWeek} workdays per week`}
                    delay={0.2}
                    gradient="bg-gradient-to-r from-orange-500 to-amber-500"
                  />
                  <MetricCard
                    icon={Clock}
                    label="Daily Target"
                    value={result.targetConversationsDay}
                    suffix="conversations"
                    description="Per workday minimum"
                    delay={0.3}
                    gradient="bg-gradient-to-r from-amber-500 to-yellow-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Card className="border-2 spacing-card h-full" data-testid="card-breakdown">
                      <CardTitle className="text-h3 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        How We Got There
                      </CardTitle>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">
                            Conversations per admission
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {result.conversationsPerAdmission.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">
                            Rate source
                          </span>
                          <span className="text-xs font-medium text-muted-foreground text-right max-w-[50%]">
                            {result.rateSource}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">
                            Base conversations needed
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {result.baseConversations}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">
                            Buffer added (+{SETTINGS.bufferConversationsPerAdmission} per admission)
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            +{result.bufferConversations}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 bg-primary/5 rounded-lg px-3">
                          <span className="text-sm font-bold text-foreground">
                            Total target
                          </span>
                          <span className="text-lg font-black text-primary">
                            {result.targetConversationsMonth}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <Card className="border-2 spacing-card h-full" data-testid="card-coaching-note">
                      <CardTitle className="text-h3 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Coaching Note
                      </CardTitle>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {result.plainEnglishPlan}
                      </p>
                    </Card>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.55 }}
                  >
                    <DayInTheFieldCard result={result} />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <DayTimelineVisual result={result} />
                  </motion.div>
                </div>

                {result.repStatus === "new_hire" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <Card className="border-2 spacing-card shadow-lg" data-testid="card-ramp-plan">
                      <CardTitle className="text-h3 mb-2 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        New Hire Ramp Plan
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mb-6">
                        Weekly conversation targets that gradually increase to full pace over 4 weeks
                      </p>
                      <RampChart result={result} />
                      <div className="mt-6 p-4 bg-accent/30 rounded-lg">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.plainEnglishRampPlan}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <Card className="border-2 spacing-card bg-gradient-to-br from-accent/50 to-accent/30 shadow-lg" data-testid="card-cta">
                    <div className="text-center">
                      <h3 className="text-h3 font-bold text-foreground mb-3">
                        Need Help Building the System Behind These Numbers?
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
                        Knowing the numbers is one thing. Building the weekly rhythm, account plans, and coaching structure to actually hit them is another. That is what we do.
                      </p>
                      <Button
                        size="lg"
                        asChild
                        className="font-bold shadow-lg touch-manipulation group px-10"
                        data-testid="button-results-contact"
                      >
                        <Link href="/contact">
                          <span>Contact Us</span>
                          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
