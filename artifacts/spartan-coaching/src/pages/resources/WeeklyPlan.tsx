import { AccentText } from "@/components/AccentText";
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Save, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { ContentNotice } from "@/components/ContentNotice";
import { useLeadGate } from "@/hooks/use-lead-gate";
import { LeadGateDialog } from "@/components/LeadGateDialog";
import type { EmailPdfPayload } from "@/lib/downloadPdf";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const RESOURCE_KEY = "weekly-plan";
const LOCAL_DRAFT_KEY = "spartan_resource_work_weekly-plan";

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

type WeeklyPlanForm = {
  weekOf: string;
  territory: string;
  primaryObjective: string;
  monday: { priorities: string; touches: string; notes: string };
  tuesday: { priorities: string; touches: string; notes: string };
  wednesday: { priorities: string; touches: string; notes: string };
  thursday: { priorities: string; touches: string; notes: string };
  friday: { priorities: string; touches: string; notes: string };
  meaningfulTouches: string;
  referralsReceived: string;
  admissionsSoc: string;
  avgTimeToSoc: string;
  focusAccounts: string[];
  recoveryPlan: string;
  workedWell: string;
  needsAdjustment: string;
};

const emptyDay = () => ({ priorities: "", touches: "", notes: "" });

const emptyForm = (): WeeklyPlanForm => ({
  weekOf: "",
  territory: "",
  primaryObjective: "",
  monday: emptyDay(),
  tuesday: emptyDay(),
  wednesday: emptyDay(),
  thursday: emptyDay(),
  friday: emptyDay(),
  meaningfulTouches: "",
  referralsReceived: "",
  admissionsSoc: "",
  avgTimeToSoc: "",
  focusAccounts: ["", "", "", "", ""],
  recoveryPlan: "",
  workedWell: "",
  needsAdjustment: "",
});

function formFromUnknown(raw: Record<string, unknown> | null | undefined): WeeklyPlanForm {
  const base = emptyForm();
  if (!raw) return base;
  const day = (k: DayKey) => {
    const d = raw[k];
    if (d && typeof d === "object") {
      const o = d as Record<string, unknown>;
      return {
        priorities: String(o.priorities ?? ""),
        touches: String(o.touches ?? ""),
        notes: String(o.notes ?? ""),
      };
    }
    return emptyDay();
  };
  return {
    weekOf: String(raw.weekOf ?? ""),
    territory: String(raw.territory ?? ""),
    primaryObjective: String(raw.primaryObjective ?? ""),
    monday: day("monday"),
    tuesday: day("tuesday"),
    wednesday: day("wednesday"),
    thursday: day("thursday"),
    friday: day("friday"),
    meaningfulTouches: String(raw.meaningfulTouches ?? ""),
    referralsReceived: String(raw.referralsReceived ?? ""),
    admissionsSoc: String(raw.admissionsSoc ?? ""),
    avgTimeToSoc: String(raw.avgTimeToSoc ?? ""),
    focusAccounts: Array.isArray(raw.focusAccounts)
      ? [0, 1, 2, 3, 4].map((i) => String((raw.focusAccounts as unknown[])[i] ?? ""))
      : base.focusAccounts,
    recoveryPlan: String(raw.recoveryPlan ?? ""),
    workedWell: String(raw.workedWell ?? ""),
    needsAdjustment: String(raw.needsAdjustment ?? ""),
  };
}

export default function WeeklyPlan() {
  const { capture, gateState } = useLeadGate("Weekly Sales Plan");
  const { canUseFieldKit } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<WeeklyPlanForm>(emptyForm);
  const [status, setStatus] = useState<"draft" | "completed">("draft");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [detail, setDetail] = useState<{
    whenToUse?: string;
    expectedOutcome?: string;
    completionTimeMinutes?: number;
    audience?: string[];
    formats?: string[];
    relatedToolIds?: string[];
  } | null>(null);

  const persistLocal = useCallback((next: WeeklyPlanForm) => {
    try {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(next));
    } catch {
      // offline / private mode
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (canUseFieldKit) {
          const res = await fetch(`/api/v1/resource-work/${RESOURCE_KEY}`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) {
              setDetail(data.detail ?? null);
              if (data.work?.formData) {
                setForm(formFromUnknown(data.work.formData));
                setStatus(
                  data.work.status === "completed" ? "completed" : "draft",
                );
              } else {
                // Offline/local draft fallback
                const local = localStorage.getItem(LOCAL_DRAFT_KEY);
                if (local) setForm(formFromUnknown(JSON.parse(local)));
              }
            }
            setLoading(false);
            return;
          }
        }
        const local = localStorage.getItem(LOCAL_DRAFT_KEY);
        if (local && !cancelled) setForm(formFromUnknown(JSON.parse(local)));
        if (!cancelled) {
          setDetail({
            whenToUse:
              "Sunday night or Monday morning before the week starts.",
            expectedOutcome:
              "A filled weekly plan you can print or save when signed in.",
            completionTimeMinutes: 15,
            formats: ["interactive", "print"],
          });
        }
      } catch {
        try {
          const local = localStorage.getItem(LOCAL_DRAFT_KEY);
          if (local && !cancelled) setForm(formFromUnknown(JSON.parse(local)));
        } catch {
          /* ignore */
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canUseFieldKit]);

  const update = <K extends keyof WeeklyPlanForm>(key: K, value: WeeklyPlanForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      persistLocal(next);
      return next;
    });
    setSaveOk(false);
  };

  const updateDay = (
    day: DayKey,
    field: "priorities" | "touches" | "notes",
    value: string,
  ) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [day]: { ...prev[day], [field]: value },
      };
      persistLocal(next);
      return next;
    });
    setSaveOk(false);
  };

  const saveWork = async (nextStatus: "draft" | "completed") => {
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    persistLocal(form);

    if (!canUseFieldKit) {
      setSaving(false);
      toast({
        title: "Saved on this device",
        description: "Sign in to Hospice Sales Pro to sync across devices.",
      });
      setSaveOk(true);
      return;
    }

    try {
      const res = await fetch(`/api/v1/resource-work/${RESOURCE_KEY}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: form,
          status: nextStatus,
          title: "Spartan Weekly Plan",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message ||
            "Save failed",
        );
      }
      const work = (data as { work?: { status?: string } }).work;
      setStatus(work?.status === "completed" ? "completed" : "draft");
      const errs = (data as { validation?: { errors?: string[] } }).validation
        ?.errors;
      if (errs?.length && nextStatus === "completed") {
        setSaveError(
          "Saved as draft — add Week Of and Primary Objective to mark complete.",
        );
      } else {
        setSaveOk(true);
        toast({
          title: work?.status === "completed" ? "Plan completed" : "Progress saved",
          description: "Available when you resume on web or iOS.",
        });
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save");
      toast({
        title: "Save error",
        description:
          "Kept a local draft on this device. Retry when online.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const days: { key: DayKey; label: string }[] = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
  ];

  return (
    <div className="page-persuasion max-w-4xl mx-auto p-8 bg-white text-black print:p-0">
      <SEO />
      <div className="print:hidden">
        <Breadcrumbs
          items={[
            { label: "Training Resources", href: "/resources" },
            { label: "Weekly Plan" },
          ]}
        />
        <ContentNotice />
      </div>
      <style>{`
        @media print {
          body { margin: 0; padding: 20px; }
          button, nav, header, footer, .no-print { display: none !important; }
          div.bg-gray-100, div.bg-red-600, div.border-2, div.border {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
        input, textarea {
          border: none;
          border-bottom: 2px dotted #999;
          background: transparent;
          width: 100%;
          padding: 2px 4px;
        }
        input:focus, textarea:focus {
          outline: none;
          border-bottom-color: #dc2626;
        }
      `}</style>

      {/* Resource detail (HSP-26) */}
      <div className="no-print mb-6 rounded-xl border-2 border-red-100 bg-red-50/40 p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-black text-foreground"><AccentText>Interactive weekly plan</AccentText></h2>
          <Badge variant="secondary">{status === "completed" ? "Completed" : "In progress"}</Badge>
          {detail?.completionTimeMinutes ? (
            <Badge variant="outline">~{detail.completionTimeMinutes} min</Badge>
          ) : null}
        </div>
        {detail?.whenToUse ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">When: </span>
            {detail.whenToUse}
          </p>
        ) : null}
        {detail?.expectedOutcome ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Outcome: </span>
            {detail.expectedOutcome}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Formats: interactive · print · PDF download. Related tools:{" "}
          <Link href="/tools/weekly-plan-builder" className="text-primary font-semibold hover:underline">
            Weekly Plan Builder
          </Link>
          {" · "}
          <Link href="/tools/objections" className="text-primary font-semibold hover:underline">
            Objection Handler
          </Link>
        </p>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading saved work…</p>
        ) : null}
        {saveError ? (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {saveError}
          </p>
        ) : null}
        {saveOk ? (
          <p className="text-sm text-green-700 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => void saveWork("draft")}
            data-testid="button-save-weekly-plan"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save progress"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={saving}
            onClick={() => void saveWork("completed")}
            data-testid="button-complete-weekly-plan"
          >
            Mark complete
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <a href="/resources/files/weekly-activity-tracker.pdf" target="_blank" rel="noreferrer">
              <Download className="w-4 h-4" />
              PDF download
            </a>
          </Button>
        </div>
        {!canUseFieldKit ? (
          <p className="text-xs text-muted-foreground">
            Guest mode: drafts stay on this browser.{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>{" "}
            for cross-device resume.
          </p>
        ) : null}
      </div>
      
      <div className="text-center mb-6 border-b-4 border-red-600 pb-4">
        <h1 className="text-3xl font-black mb-2"><AccentText>SPARTAN WEEKLY PLAN</AccentText></h1>
        <p className="text-sm text-gray-600">Discipline • Empathy • Strategy</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 mb-6">
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase" htmlFor="week-of">Week Of:</label>
          <input
            id="week-of"
            name="week-of"
            type="text"
            className="mt-2 h-6"
            placeholder="e.g., Jan 15 to 19, 2026"
            value={form.weekOf}
            onChange={(e) => update("weekOf", e.target.value)}
          />
        </div>
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase" htmlFor="territory">Territory:</label>
          <input
            id="territory"
            name="territory"
            type="text"
            className="mt-2 h-6"
            placeholder="e.g., North Region"
            value={form.territory}
            onChange={(e) => update("territory", e.target.value)}
          />
        </div>
      </div>

      <div className="bg-red-600 text-white p-3 mb-4">
        <h2 className="text-lg font-bold mb-1"><AccentText>THIS WEEK&apos;S PRIMARY OBJECTIVE</AccentText></h2>
        <p className="text-xs">What is the ONE outcome that would make this week successful?</p>
      </div>
      <textarea
        id="primary-objective"
        name="primary-objective"
        className="border-2 border-gray-300 p-4 mb-6 min-h-[80px] w-full"
        placeholder="e.g., Convert 3 Tier A accounts to active referrers"
        value={form.primaryObjective}
        onChange={(e) => update("primaryObjective", e.target.value)}
      />

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b-2 border-gray-300 pb-2"><AccentText>DAILY PRIORITIES</AccentText></h2>
        {days.map(({ key, label }) => (
          <div key={key} className="mb-3 border border-gray-300 p-2">
            <div className="font-bold text-sm mb-1">{label.toUpperCase()}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="font-semibold">Top 3:</span>
                <input
                  id={`${key}-priorities`}
                  type="text"
                  className="h-5"
                  placeholder="Priority accounts"
                  value={form[key].priorities}
                  onChange={(e) => updateDay(key, "priorities", e.target.value)}
                />
              </div>
              <div>
                <span className="font-semibold">Touches:</span>
                <input
                  id={`${key}-touches`}
                  type="text"
                  className="h-5"
                  placeholder="0"
                  value={form[key].touches}
                  onChange={(e) => updateDay(key, "touches", e.target.value)}
                />
              </div>
              <div>
                <span className="font-semibold">Notes:</span>
                <input
                  id={`${key}-notes`}
                  type="text"
                  className="h-5"
                  placeholder="Notes"
                  value={form[key].notes}
                  onChange={(e) => updateDay(key, "notes", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 mb-6">
        <div className="border-2 border-gray-300 p-3">
          <h3 className="font-bold text-sm mb-2 bg-gray-100 p-2"><AccentText>KEY METRICS THIS WEEK</AccentText></h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center pb-1">
              <span>Meaningful Touches:</span>
              <input
                id="meaningful-touches"
                type="text"
                className="w-16 text-right"
                placeholder="0"
                value={form.meaningfulTouches}
                onChange={(e) => update("meaningfulTouches", e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center pb-1">
              <span>Referrals Received:</span>
              <input
                id="referrals-received"
                type="text"
                className="w-16 text-right"
                placeholder="0"
                value={form.referralsReceived}
                onChange={(e) => update("referralsReceived", e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center pb-1">
              <span>Admissions (SOC):</span>
              <input
                id="admissions-soc"
                type="text"
                className="w-16 text-right"
                placeholder="0"
                value={form.admissionsSoc}
                onChange={(e) => update("admissionsSoc", e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center pb-1">
              <span>Avg. Time to SOC:</span>
              <input
                id="avg-time-to-soc"
                type="text"
                className="w-16 text-right"
                placeholder="0h"
                value={form.avgTimeToSoc}
                onChange={(e) => update("avgTimeToSoc", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-2 border-gray-300 p-3">
          <h3 className="font-bold text-sm mb-2 bg-gray-100 p-2"><AccentText>TOP 5 FOCUS ACCOUNTS</AccentText></h3>
          <div className="space-y-1 text-xs">
            {[0, 1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center gap-2">
                <span className="font-bold">{num + 1}.</span>
                <input
                  id={`focus-account-${num + 1}`}
                  type="text"
                  className="flex-1 h-6"
                  placeholder="Account name (no patient identifiers)"
                  value={form.focusAccounts[num]}
                  onChange={(e) => {
                    const next = [...form.focusAccounts];
                    next[num] = e.target.value;
                    update("focusAccounts", next);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-3 mb-4">
        <h3 className="font-bold text-sm mb-2"><AccentText>WEEKLY RECOVERY PLAN</AccentText></h3>
        <p className="text-xs text-gray-600 mb-2">What will you do to recharge and avoid burnout?</p>
        <textarea
          id="recovery-plan"
          className="border border-gray-400 bg-white p-2 min-h-[60px] w-full"
          placeholder="e.g., Friday evening family time, Saturday morning run"
          value={form.recoveryPlan}
          onChange={(e) => update("recoveryPlan", e.target.value)}
        />
      </div>

      <div className="border-t-2 border-gray-300 pt-3">
        <h3 className="font-bold text-sm mb-2"><AccentText>END OF WEEK REFLECTION</AccentText></h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold block mb-1" htmlFor="worked-well">What worked well?</label>
            <textarea
              id="worked-well"
              className="border border-gray-400 p-2 min-h-[50px] w-full"
              placeholder="Wins and successes"
              value={form.workedWell}
              onChange={(e) => update("workedWell", e.target.value)}
            />
          </div>
          <div>
            <label className="font-semibold block mb-1" htmlFor="needs-adjustment">What needs adjustment?</label>
            <textarea
              id="needs-adjustment"
              className="border border-gray-400 p-2 min-h-[50px] w-full"
              placeholder="Areas to improve"
              value={form.needsAdjustment}
              onChange={(e) => update("needsAdjustment", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-gray-300">
        © {new Date().getFullYear()} Spartan Coaching | spartancoaching.com
      </div>

      <div className="mt-6 text-center print:hidden no-print flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => {
            const getEmailPdf = (): EmailPdfPayload => ({
              title: "Weekly Sales Plan",
              filename: "spartan-weekly-plan",
              subtitle: form.weekOf || "Hospice Sales Weekly Planning Template",
              sections: [
                {
                  heading: "Objective",
                  body: form.primaryObjective || "(not set)",
                },
                {
                  heading: "Territory",
                  body: form.territory || "(not set)",
                },
                {
                  heading: "Focus accounts",
                  body: form.focusAccounts.filter(Boolean).join("\n") || "(none)",
                },
              ],
            });
            capture(() => window.print(), getEmailPdf);
          }}
          size="lg"
          data-testid="button-print"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </div>
      <LeadGateDialog gateState={gateState} />
    </div>
  );
}
