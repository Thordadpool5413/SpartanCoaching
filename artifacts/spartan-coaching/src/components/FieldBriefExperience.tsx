import { useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  MapPinned,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FIELD_KIT_PHI, PRICING_FACTS } from "@/lib/complianceCopy";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";
import { cn } from "@/lib/utils";

type PathfinderOption = {
  id: "field" | "team" | "combined";
  label: string;
  description: string;
  icon: LucideIcon;
  result: {
    label: string;
    headline: string;
    body: string;
    primary: { label: string; href: string; token: string };
    secondary?: { label: string; href: string; token: string };
  };
};

type FieldStep = {
  id: "prepare" | "practice" | "execute" | "review";
  number: string;
  label: string;
  icon: LucideIcon;
  title: string;
  body: string;
  signal: string;
  nextMove: string;
  bullets: string[];
  artifact: {
    eyebrow: string;
    title: string;
    detail: string;
    lines: string[];
  };
};

const PATHFINDER_OPTIONS: PathfinderOption[] = [
  {
    id: "field",
    label: "I carry a territory",
    description: "I need a sharper plan for the next referral conversation.",
    icon: MapPinned,
    result: {
      label: "Recommended path · daily field system",
      headline: "Hospice Sales Pro keeps the next move in view.",
      body: "Preview the workflow without signing in. When you are ready, choose the individual plan for web and iPhone access.",
      primary: {
        label: "Preview the field system",
        href: "#field-brief-tour",
        token: "pathfinder_field_preview",
      },
      secondary: {
        label: "See individual access",
        href: "/hospice-sales-pro",
        token: "pathfinder_field_membership",
      },
    },
  },
  {
    id: "team",
    label: "I lead the team",
    description: "I need shared language, coaching rhythm, and visibility.",
    icon: Users,
    result: {
      label: "Recommended path · consulting or evaluation",
      headline: "Start with the operating problem, not a catalog.",
      body: "A strategy call maps the gap, then a team evaluation or consulting engagement can be scoped around your market and leadership rhythm.",
      primary: {
        label: "Book a strategy call",
        href: "/contact",
        token: "pathfinder_team_strategy_call",
      },
      secondary: {
        label: "Request team evaluation",
        href: "/request-access",
        token: "pathfinder_team_evaluation",
      },
    },
  },
  {
    id: "combined",
    label: "I need both",
    description: "I want coaching around the work and a system that carries it.",
    icon: BriefcaseBusiness,
    result: {
      label: "Recommended path · consulting + seats",
      headline: "Pair a field system with human coaching.",
      body: "Use a strategy call to define the engagement, then arrange Hospice Sales Pro seats under the same team plan.",
      primary: {
        label: "Talk through the fit",
        href: "/contact?service=Consulting+%2B+Hospice+Sales+Pro",
        token: "pathfinder_combined_strategy_call",
      },
      secondary: {
        label: "Preview Hospice Sales Pro",
        href: "#field-brief-tour",
        token: "pathfinder_combined_preview",
      },
    },
  },
];

const FIELD_STEPS: FieldStep[] = [
  {
    id: "prepare",
    number: "01",
    label: "Prepare",
    icon: Target,
    title: "Know the objective before you walk in.",
    body: "Turn a broad territory visit into one specific conversation objective and one useful question.",
    signal: "Account signal",
    nextMove: "Choose the referral relationship that needs movement this week.",
    bullets: ["Account context", "Conversation objective", "One next question"],
    artifact: {
      eyebrow: "Thursday · 08:40",
      title: "Maple Ridge Medical Group",
      detail: "Warm introduction to case management",
      lines: ["Two recent discharges", "Gatekeeper: office manager", "Ask: who owns the family handoff?"],
    },
  },
  {
    id: "practice",
    number: "02",
    label: "Practice",
    icon: MessageSquare,
    title: "Pressure-test the words before the room.",
    body: "Practice the likely pushback so a “not yet” becomes a conversation, not a dead end.",
    signal: "Objection pattern",
    nextMove: "Say the response in your voice, then sharpen the ask.",
    bullets: ["Likely objection", "Plain-language response", "Clear ask"],
    artifact: {
      eyebrow: "Likely pushback",
      title: "“We already have a hospice.”",
      detail: "Keep the door open without turning the visit into a pitch.",
      lines: ["Acknowledge the current partner", "Ask what is working well", "Offer one useful comparison"],
    },
  },
  {
    id: "execute",
    number: "03",
    label: "Execute",
    icon: Smartphone,
    title: "Carry the plan into the field.",
    body: "Keep the objective and talk track close while you make the visit. The tool supports the conversation; it never replaces judgment.",
    signal: "Field action",
    nextMove: "Complete the visit and capture the professional follow-up.",
    bullets: ["Visit plan", "Conversation cue", "Follow-up window"],
    artifact: {
      eyebrow: "In the field · 11:15",
      title: "Visit cue is ready",
      detail: "Maple Ridge Medical Group · 12 min window",
      lines: ["Lead with the family handoff question", "Listen for discharge friction", "Follow up Friday morning"],
    },
  },
  {
    id: "review",
    number: "04",
    label: "Review",
    icon: ClipboardCheck,
    title: "Close the loop while it is still fresh.",
    body: "Review what happened, keep the useful signal, and schedule the next move before the week gets noisy.",
    signal: "Next move",
    nextMove: "Record the learning and put the next conversation on the calendar.",
    bullets: ["What landed", "What changed", "Next scheduled move"],
    artifact: {
      eyebrow: "After-action note",
      title: "A door opened",
      detail: "The office manager offered an introduction to case management.",
      lines: ["Signal: family handoff is inconsistent", "Learning: lead with workflow, not service list", "Next: Friday · 09:00"],
    },
  },
];

function trackPublicAction(token: string) {
  trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, `home:${token}`);
}

function Pathfinder() {
  const [selectedId, setSelectedId] = useState<PathfinderOption["id"]>("field");
  const selected = PATHFINDER_OPTIONS.find((option) => option.id === selectedId) ?? PATHFINDER_OPTIONS[0];

  return (
    <div className="field-brief-pathfinder" data-testid="field-brief-pathfinder">
      <div className="field-brief-pathfinder-heading">
        <p className="field-brief-label">Pathfinder / choose your brief</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          One question. One recommended next move.
        </p>
      </div>

      <div className="field-brief-pathfinder-options" role="list" aria-label="Choose your role">
        {PATHFINDER_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = option.id === selected.id;

          return (
            <button
              key={option.id}
              type="button"
              className={cn("field-brief-pathfinder-option", isSelected && "is-selected")}
              aria-pressed={isSelected}
              onClick={() => {
                setSelectedId(option.id);
                trackPublicAction(`pathfinder_select_${option.id}`);
              }}
              data-testid={`pathfinder-option-${option.id}`}
            >
              <span className="field-brief-pathfinder-icon">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-sm font-bold text-foreground">{option.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {option.description}
                </span>
              </span>
              <span className="field-brief-pathfinder-check" aria-hidden>
                {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="field-brief-pathfinder-result" aria-live="polite">
        <p className="field-brief-label text-[10px]">{selected.result.label}</p>
        <h3 className="mt-2 text-xl font-display font-bold tracking-tight text-foreground">
          {selected.result.headline}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.result.body}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button asChild size="sm" className="min-h-10 font-bold">
            <Link
              href={selected.result.primary.href}
              onClick={() => {
                if (selected.result.primary.href.startsWith("#")) {
                  trackPublicFunnelEvent(
                    PUBLIC_FUNNEL_EVENT.toolPreviewStart,
                    `home:${selected.result.primary.token}`,
                  );
                } else {
                  trackPublicAction(selected.result.primary.token);
                }
              }}
            >
              {selected.result.primary.label}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          {selected.result.secondary ? (
            <Button asChild size="sm" variant="outline" className="min-h-10 font-bold">
              <Link
                href={selected.result.secondary.href}
                onClick={() => {
                  if (selected.result.secondary?.href.startsWith("#")) {
                    trackPublicFunnelEvent(
                      PUBLIC_FUNNEL_EVENT.toolPreviewStart,
                      `home:${selected.result.secondary.token}`,
                    );
                  } else {
                    trackPublicAction(selected.result.secondary?.token ?? "");
                  }
                }}
              >
                {selected.result.secondary.label}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FieldBriefTour() {
  const [selectedId, setSelectedId] = useState<FieldStep["id"]>("prepare");
  const tabRefs = useRef<Partial<Record<FieldStep["id"], HTMLButtonElement | null>>>({});
  const selected = FIELD_STEPS.find((step) => step.id === selectedId) ?? FIELD_STEPS[0];
  const SelectedIcon = selected.icon;
  const selectStep = (id: FieldStep["id"]) => {
    setSelectedId(id);
    trackPublicAction(`tour_step_${id}`);
  };
  const moveTab = (currentId: FieldStep["id"], direction: -1 | 1) => {
    const currentIndex = FIELD_STEPS.findIndex((step) => step.id === currentId);
    const nextIndex = (currentIndex + direction + FIELD_STEPS.length) % FIELD_STEPS.length;
    const nextId = FIELD_STEPS[nextIndex].id;
    selectStep(nextId);
    tabRefs.current[nextId]?.focus();
  };

  return (
    <div className="field-brief-tour" id="field-brief-tour" data-testid="field-brief-tour">
      <div className="field-brief-tour-header">
        <div>
          <p className="field-brief-label">Read-only product tour</p>
          <h3 className="mt-2 text-2xl font-display font-bold tracking-tight text-foreground sm:text-3xl">
            A field system with a memory.
          </h3>
        </div>
          <div className="field-brief-tour-context">
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              See the four moves behind Hospice Sales Pro. This sample is useful without an account; live
              generation and saved work stay behind the existing access paths.
            </p>
            <div className="field-brief-situation" aria-label="Fictional field situation">
              <span className="field-brief-situation-stamp">Case 07 / fictional</span>
              <span>Maple Ridge Medical Group</span>
              <span>Thursday · community territory</span>
            </div>
          </div>
      </div>

      <div className="field-brief-tour-tabs" role="tablist" aria-label="Hospice Sales Pro workflow">
        {FIELD_STEPS.map((step) => {
          const Icon = step.icon;
          const isSelected = selected.id === step.id;

          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`field-brief-panel-${step.id}`}
              tabIndex={isSelected ? 0 : -1}
              className={cn("field-brief-tour-tab", isSelected && "is-selected")}
              onClick={() => {
                selectStep(step.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveTab(step.id, 1);
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveTab(step.id, -1);
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  selectStep(FIELD_STEPS[0].id);
                  tabRefs.current[FIELD_STEPS[0].id]?.focus();
                }
                if (event.key === "End") {
                  event.preventDefault();
                  const lastId = FIELD_STEPS[FIELD_STEPS.length - 1].id;
                  selectStep(lastId);
                  tabRefs.current[lastId]?.focus();
                }
              }}
              ref={(node) => {
                tabRefs.current[step.id] = node;
              }}
              data-testid={`field-brief-tab-${step.id}`}
            >
              <span className="field-brief-tour-tab-number">{step.number}</span>
              <Icon className="h-4 w-4" aria-hidden />
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="field-brief-tour-panel"
        id={`field-brief-panel-${selected.id}`}
        role="tabpanel"
        aria-label={`${selected.label} workflow preview`}
        aria-live="polite"
        tabIndex={0}
      >
        <div className="field-brief-tour-copy">
          <div className="field-brief-panel-icon">
            <SelectedIcon className="h-5 w-5" aria-hidden />
          </div>
          <p className="field-brief-label">{selected.signal}</p>
          <h4 className="mt-3 text-2xl font-display font-bold leading-tight text-foreground">
            {selected.title}
          </h4>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{selected.body}</p>
          <div className="field-brief-next-move">
            <span>Next move</span>
            <p>{selected.nextMove}</p>
          </div>
        </div>
        <div
          className={cn("field-brief-paper field-brief-artifact", `is-${selected.id}`)}
          aria-label={`${selected.label} sample output`}
          data-testid={`field-brief-artifact-${selected.id}`}
        >
          <div className="field-brief-paper-topline">
            <span>Field artifact / {selected.number}</span>
            <span className="field-brief-artifact-status"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> No PHI</span>
          </div>
          <p className="field-brief-artifact-eyebrow">{selected.artifact.eyebrow}</p>
          <h5>{selected.artifact.title}</h5>
          <p className="field-brief-artifact-detail">{selected.artifact.detail}</p>
          <ul className="field-brief-artifact-lines">
            {selected.artifact.lines.map((line, index) => (
              <li key={line}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="field-brief-artifact-footer">
            <span>{selected.signal}</span>
            <span className="field-brief-artifact-mark">{selected.id === "review" ? "Filed" : "Live brief"}</span>
          </div>
        </div>
      </div>

      <div className="field-brief-tour-footer">
        <p>
          {FIELD_KIT_PHI.short}. {PRICING_FACTS.previewNote}
        </p>
        <Button asChild variant="outline" size="sm" className="min-h-10 font-bold">
          <Link
            href="/tools/sales-workflow"
            onClick={() =>
              trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.toolPreviewStart, "home:field_brief_tour")
            }
          >
            Open the tool preview
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function FieldBriefExperience() {
  return (
    <section
      className="field-brief-section"
      aria-labelledby="field-brief-title"
      data-testid="section-field-brief"
    >
      <div className="field-brief-shell">
        <div className="field-brief-intro">
          <div className="max-w-2xl">
            <p className="field-brief-label">Field brief / 01</p>
            <h2
              id="field-brief-title"
              className="mt-4 text-3xl font-display font-black tracking-tight text-foreground sm:text-5xl"
            >
              Prepared conversations are built, not wished for.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Spartan turns the work between meetings into a repeatable rhythm: prepare the objective,
            practice the pressure, execute the visit, and review the next move.
          </p>
        </div>

        <div className="field-brief-main-grid">
          <div className="field-brief-route">
            <p className="field-brief-label">Start with the work in front of you</p>
            <h3 className="mt-3 text-2xl font-display font-bold tracking-tight text-foreground">
              Find the right Spartan path in under a minute.
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              No generic funnel. Choose the role closest to your current responsibility and get a
              specific next step with clear expectations.
            </p>
            <Pathfinder />
          </div>
          <div className="field-brief-manifesto">
            <p className="field-brief-label">The operating rhythm</p>
            <div className="mt-7 space-y-5">
              {[
                ["01", "Plan the conversation", "The objective is decided before the drive."],
                ["02", "Practice the pressure", "The hard question gets a useful answer."],
                ["03", "Carry the next move", "The visit has a purpose, not just a stop."],
                ["04", "Review what changed", "The learning becomes tomorrow’s advantage."],
              ].map(([number, title, body]) => (
                <div key={number} className="field-brief-manifesto-row">
                  <span className="field-brief-manifesto-number">{number}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-primary/25 pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Field standard</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Clear enough to use on a Tuesday. Human enough to sound like you.
              </p>
            </div>
          </div>
        </div>

        <FieldBriefTour />
      </div>
    </section>
  );
}