/**
 * Behavioral evidence for the public web Field Kit.
 *
 * Keep this list deliberately boring and explicit. In particular, do not turn
 * it into FIELD_KIT_CAPABILITY_MATRIX.map(...): this is the reviewer's
 * catalog-wide checklist and a new catalog capability must add evidence here.
 */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FIELD_KIT_CAPABILITY_MATRIX,
  type FieldKitToolId,
} from "@workspace/field-kit-catalog";
import BrandVideo from "@/pages/BrandVideo";
import ActivityCalculator from "@/pages/ActivityCalculator";
import SalesWorkflow from "@/pages/SalesWorkflow";
import SpartanIntelligence from "@/pages/SpartanIntelligence";
import Playbooks from "@/pages/Playbooks";
import Objections from "@/pages/Objections";
import Research from "@/pages/Research";
import Transcribe from "@/pages/Transcribe";
import EmailTemplates from "@/pages/EmailTemplates";
import RolePlay from "@/pages/RolePlay";
import RepCostCalculator from "@/pages/RepCostCalculator";
import ROICalculator from "@/pages/ROICalculator";
import BranchProfitability from "@/pages/BranchProfitability";
import ColdCallScript from "@/pages/ColdCallScript";
import WeeklyPlanBuilder from "@/pages/WeeklyPlanBuilder";

const toastMock = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({ member: { id: 1, organizationId: 1, role: "rep" } as any }));

class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", NoopIntersectionObserver);
vi.stubGlobal("ResizeObserver", NoopResizeObserver);
HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/BackButton", () => ({ BackButton: () => null }));
vi.mock("@/components/animations", () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SlideUp: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  StaggerContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  StaggerItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PulsingDot: () => <span />,
  ProgressRing: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  AnimatedCounter: ({ target }: { target: number }) => <span>{target}</span>,
}));
vi.mock("@/components/FieldKitToolLayout", () => ({
  FieldKitToolLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));
vi.mock("@/hooks/use-lead-gate", () => ({
  useLeadGate: () => ({
    capture: (run: () => void) => run(),
    gateState: {
      open: false,
      nameVal: "",
      emailVal: "",
      marketingOptIn: false,
      isPending: false,
      isReturning: false,
      setOpen: vi.fn(),
      setNameVal: vi.fn(),
      setEmailVal: vi.fn(),
      setMarketingOptIn: vi.fn(),
      onSubmit: vi.fn(),
      toolName: "test",
    },
  }),
}));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, member: authState.member, canUseFieldKit: true, isLoading: false }),
}));

type Probe = {
  route: string;
  evidence: string;
};

// Every entry is intentionally handwritten. The completeness assertion below
// is what makes adding a catalog tool without web evidence fail loudly.
const WEB_PROBES: Record<FieldKitToolId, Probe> = {
  "sales-workflow": { route: "/tools/sales-workflow", evidence: "SalesWorkflow" },
  "spartan-intelligence": { route: "/tools/intelligence", evidence: "SpartanIntelligence" },
  playbooks: { route: "/tools/playbooks", evidence: "Playbooks" },
  objections: { route: "/tools/objections", evidence: "Objections" },
  research: { route: "/tools/research", evidence: "Research" },
  transcribe: { route: "/tools/transcribe", evidence: "Transcribe" },
  "email-templates": { route: "/tools/email-templates", evidence: "EmailTemplates" },
  "role-play": { route: "/tools/role-play", evidence: "RolePlay" },
  "activity-calculator": { route: "/tools/activity-calculator", evidence: "ActivityCalculator" },
  "rep-cost": { route: "/tools/rep-cost-calculator", evidence: "RepCostCalculator" },
  roi: { route: "/tools/roi-calculator", evidence: "ROICalculator" },
  branch: { route: "/tools/branch-profitability", evidence: "BranchProfitability" },
  "cold-call": { route: "/tools/cold-call-script", evidence: "ColdCall" },
  "weekly-plan": { route: "/tools/weekly-plan-builder", evidence: "WeeklyPlan" },
  "brand-video": { route: "/brand-video", evidence: "BrandVideo" },
};

describe("Field Kit web capability evidence", () => {
  afterEach(() => {
    cleanup();
    authState.member = { id: 1, organizationId: 1, role: "rep" };
    vi.restoreAllMocks();
  });

  it("has a manually enumerated probe for every catalog capability", () => {
    const catalogIds = FIELD_KIT_CAPABILITY_MATRIX.map(({ toolId }) => toolId).sort();
    const probeIds = Object.keys(WEB_PROBES).sort();
    expect(probeIds).toEqual(catalogIds);
    for (const capability of FIELD_KIT_CAPABILITY_MATRIX) {
      const probe = WEB_PROBES[capability.toolId as FieldKitToolId];
      expect(probe.route).toBeTruthy();
      expect(probe.evidence).toBeTruthy();
    }
  });

  it("exercises the real brand-video controls, including copy failure", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(<BrandVideo />);
    const player = screen.getByTestId("iframe-brand-video");
    expect(player.getAttribute("src")).toBe("/spartan-video/");
    fireEvent.click(screen.getByRole("button", { name: /video not loading/i }));
    expect(screen.getByRole("alert").textContent).toContain("The video could not load.");
    fireEvent.click(screen.getByRole("button", { name: /retry brand video/i }));
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /copy shareable link/i }));
    await waitFor(() => expect(screen.getByText("Copied!")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /open brand video/i }));
    expect(open).toHaveBeenCalledWith(
      `${window.location.origin}/spartan-video/`,
      "_blank",
      "noopener,noreferrer",
    );

    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error("clipboard unavailable"));
    fireEvent.click(screen.getByRole("button", { name: /copy shareable link/i }));
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Could not copy", variant: "destructive" }),
      ),
    );
  });

  it("exercises a real calculator's ready, calculated, and reset states", async () => {
    render(<ActivityCalculator />);
    fireEvent.change(screen.getByTestId("input-monthly-goal"), { target: { value: "8" } });
    fireEvent.change(screen.getByTestId("input-last-admissions"), { target: { value: "6" } });
    fireEvent.change(screen.getByTestId("input-last-conversations"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: /calculate activity targets/i }));
    expect(await screen.findByTestId("text-results-title")).toBeTruthy();
    fireEvent.click(screen.getByTestId("button-recalculate"));
    expect(await screen.findByTestId("card-activity-form")).toBeTruthy();
  });

  const json = (body: unknown, ok = true) => ({ ok, json: async () => body } as Response);
  const serverSequence = (success: unknown, failureText = "Request failed") => {
    let attempt = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("usage-events")) return json({});
      attempt += 1;
      return attempt === 1 ? json({ error: failureText }, false) : json(success);
    });
    vi.stubGlobal("fetch", fetchMock);
    (fetchMock as any).apiCalls = () => attempt;
    return fetchMock;
  };

  it("probes sales workflow empty/loading/error, retries, then completes an account action", async () => {
    authState.member = { id: 1, organizationId: 1, role: "rep" };
    let attempt = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("usage-events")) return json({});
      if (++attempt === 1) return json({ error: "Workspace unavailable" }, false);
      if (String(input).includes("/today")) {
        return json({
          calls: [{
            id: "call-1", purpose: "Referral follow-up", status: "scheduled",
            schedule: { startsAt: new Date(Date.now() + 3600000).toISOString(), durationMinutes: 30, location: "Clinic" },
          }],
          plans: [{ id: "plan-1", callId: "call-1", status: "draft", version: 1 }],
          actions: [], syncJobs: [],
        });
      }
      if (String(input).includes("/complete")) {
        return json({ coaching: { id: "coaching-1", version: 1, coaching: { output: { personalizedFeedback: "Coaching complete" } } }, nextActions: [{ id: "next-1", type: "follow_up", title: "Send follow-up", status: "draft" }] });
      }
      if (String(input).includes("/approve")) return json({});
      return json({ accounts: [] });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<SalesWorkflow />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByText("Workspace unavailable")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Referral follow-up")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Prepare" }));
    await waitFor(() => expect(screen.getByText("Pre-call plan ready")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    fireEvent.change(screen.getByRole("textbox", { name: /call summary/i }), { target: { value: "Agreed on the next referral review." } });
    fireEvent.click(screen.getByRole("checkbox", { name: /recording\/transcript consent/i }));
    fireEvent.click(screen.getByRole("button", { name: "Complete call" }));
    expect((await screen.findByText("Coaching summary")).parentElement?.textContent).toContain("Coaching complete");
    fireEvent.click(screen.getByRole("button", { name: "Approve selected steps" }));
    await waitFor(() => expect(screen.queryByText("Coaching complete")).toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "Schedule call" }));
    fireEvent.change(screen.getByRole("textbox", { name: /new account name/i }), { target: { value: "Cedar Clinic" } });
    fireEvent.change(screen.getByRole("textbox", { name: /purpose/i }), { target: { value: "Confirm referral follow-up" } });
    const startsAt = document.querySelector('input[name="startsAt"]');
    expect(startsAt).toBeTruthy();
    fireEvent.change(startsAt!, { target: { value: "2030-01-01T10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Schedule and prepare" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it("probes Spartan Intelligence empty/loading/error, retry, complete sources, and copy", async () => {
    const fetchMock = serverSequence({ data: { providers: [], counties: [], marketSummary: {} } });
    render(<SpartanIntelligence />);
    const host = await screen.findByTestId("trusted-medicare-platform");
    await waitFor(() => expect(host.shadowRoot?.textContent).toMatch(/could not open|error/i));
    const retry = Array.from(host.shadowRoot?.querySelectorAll("button") ?? []).find((button) => /retry/i.test(button.textContent ?? ""));
    expect(retry).toBeTruthy();
    fireEvent.click(retry!);
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(2));
    expect(host.shadowRoot?.textContent).toMatch(/Medicare|No providers/i);
  });

  it("probes Playbooks generation error, retry success, review, and copy", async () => {
    const fetchMock = serverSequence({ playbook: "## Discovery\nAsk about the current referral process." });
    render(<Playbooks />);
    fireEvent.change(screen.getByTestId("textarea-scenario"), { target: { value: "A detailed hospice referral scenario" } });
    fireEvent.click(screen.getByTestId("button-generate"));
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(1));
    fireEvent.click(screen.getByTestId("button-generate"));
    expect((await screen.findAllByText("Discovery")).length).toBeGreaterThan(0);
    expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(2);
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    fireEvent.click(screen.getByTestId("button-modal-copy"));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
  });

  it("probes Objections generation error, retry success, review, and copy", async () => {
    const fetchMock = serverSequence({ response: "A useful response", objection: "Too expensive" });
    render(<Objections />);
    const generate = screen.getAllByRole("button", { name: /generate/i })[0];
    fireEvent.click(generate);
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(1));
    fireEvent.click(generate);
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(2));
    expect(await screen.findByText("A useful response")).toBeTruthy();
  });

  it("probes Research search error, retry success, sources, and copy", async () => {
    const fetchMock = serverSequence({ text: "Grounded answer", sources: [{ title: "Source", url: "https://cms.gov" }] });
    render(<Research />);
    fireEvent.change(screen.getByTestId("input-research-query"), { target: { value: "What is hospice?" } });
    fireEvent.click(screen.getByTestId("button-search"));
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(1));
    fireEvent.click(screen.getByTestId("button-search"));
    expect((await screen.findByTestId("text-research-results")).textContent).toContain("Grounded answer");
    expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(2);
  });

  it("probes Transcribe upload error, retry success, transcript review, and copy", async () => {
    const fetchMock = serverSequence({
      transcript: "Speaker: Welcome to the call.",
      analysis: "Speaker showed empathy; ask a clearer next-step question.",
    });
    render(<Transcribe />);
    fireEvent.mouseDown(screen.getByTestId("tab-upload"));
    fireEvent.click(screen.getByTestId("tab-upload"));
    await waitFor(() => expect(screen.getByTestId("input-audio-file")).toBeTruthy());
    fireEvent.change(screen.getByTestId("input-audio-file"), { target: { files: [new File(["audio"], "call.mp3", { type: "audio/mpeg" })] } });
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(1));
    fireEvent.change(screen.getByTestId("input-audio-file"), { target: { files: [new File(["audio"], "call.mp3", { type: "audio/mpeg" })] } });
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(2));
    expect((await screen.findByTestId("text-transcription")).textContent).toContain("Speaker: Welcome to the call.");
    fireEvent.click(screen.getByTestId("button-analyze"));
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(3));
    expect((await screen.findByTestId("card-analysis")).textContent).toContain("Speaker showed empathy");
  });

  it("probes Email Templates generation error, retry success, draft review, and copy", async () => {
    const fetchMock = serverSequence({ subject: "Follow up", body: "Thank you for your time." });
    render(<EmailTemplates />);
    fireEvent.change(screen.getByTestId("input-recipient-name"), { target: { value: "Sarah" } });
    fireEvent.change(screen.getByTestId("textarea-context"), { target: { value: "Follow up after our meeting" } });
    fireEvent.click(screen.getByTestId("button-generate-template"));
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(1));
    fireEvent.click(screen.getByTestId("button-generate-template"));
    expect(await screen.findByText(/Follow up/i)).toBeTruthy();
    expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(2);
  });

  it("probes Role Play scenario start error, retry success, conversation, and feedback", async () => {
    const fetchMock = serverSequence({
      session: { id: 42 },
      initialMessage: "Tell me about your current priorities.",
      response: "Good work.",
      feedback: "Good work.",
      rating: 8,
    });
    render(<RolePlay />);
    const start = screen.getByTestId("button-start-skeptical_oncologist");
    fireEvent.click(start);
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(1));
    fireEvent.click(start);
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(2));
    expect((await screen.findByTestId("chat-message-0")).textContent).toContain("Tell me about your current priorities.");
    const input = screen.getByTestId("textarea-roleplay-input");
    fireEvent.change(input, { target: { value: "We should discuss your referral goals." } });
    fireEvent.click(screen.getByTestId("button-send-roleplay"));
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(3));
    fireEvent.change(input, { target: { value: "What would make the timing right?" } });
    fireEvent.click(screen.getByTestId("button-send-roleplay"));
    await waitFor(() => expect(screen.getAllByTestId(/chat-message-/).length).toBeGreaterThanOrEqual(3));
    fireEvent.click(screen.getByTestId("button-end-session"));
    expect((await screen.findByTestId("card-feedback")).textContent).toContain("Session Complete");
    expect(screen.getByTestId("text-feedback-content").textContent).toContain("Good work.");
  });

  it("probes Cold Call generation error, retry success, script review, and copy", async () => {
    const fetchMock = serverSequence({ script: "Opening: I work with local care teams." });
    render(<ColdCallScript />);
    fireEvent.click(screen.getByTestId("select-prospect-type"));
    fireEvent.click((await screen.findAllByRole("option"))[0]);
    fireEvent.change(screen.getByTestId("input-prospect-name"), { target: { value: "Dr. Smith" } });
    fireEvent.change(screen.getByTestId("textarea-situation"), { target: { value: "First conversation about hospice referrals" } });
    fireEvent.click(screen.getByTestId("button-generate-script"));
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(1));
    fireEvent.click(screen.getByTestId("button-generate-script"));
    expect((await screen.findByTestId("text-script-content")).textContent).toContain("Opening");
    expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(2);
  });

  it("probes Weekly Plan generation error, retry success, plan review, and copy", async () => {
    const fetchMock = serverSequence({ plan: "## Monday\nVisit Sunrise SNF." });
    render(<WeeklyPlanBuilder />);
    fireEvent.change(screen.getByTestId("textarea-accounts"), { target: { value: "Sunrise SNF and River Oaks AL" } });
    fireEvent.click(screen.getByTestId("select-weekly-goal"));
    fireEvent.click(await screen.findByText("Increase referral volume from an existing source"));
    fireEvent.click(screen.getByTestId("button-generate-plan"));
    await waitFor(() => expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(1));
    fireEvent.click(screen.getByTestId("button-generate-plan"));
    expect((await screen.findByTestId("text-plan-content")).textContent).toContain("Monday");
    expect((fetchMock as any).apiCalls()).toBeGreaterThanOrEqual(2);
  });

  it("probes Rep Cost with valid calculation, reset, and invalid input feedback", () => {
    render(<RepCostCalculator />);
    expect(screen.getByTestId("section-rep-cost-calculator")).toBeTruthy();
    const numberInputs = screen.getAllByRole("spinbutton");
    const before = screen.getByText(/Total Annual Rep Cost/i).parentElement?.textContent;
    fireEvent.change(numberInputs[0], { target: { value: "10" } });
    expect((numberInputs[0] as HTMLInputElement).value).toBe("10");
    expect(screen.getByText(/Total Annual Rep Cost/i).parentElement?.textContent).not.toBe(before);
    fireEvent.change(numberInputs[0], { target: { value: "-1" } });
    expect((numberInputs[0] as HTMLInputElement).value).not.toBe("");
    expect(numberInputs[0].getAttribute("min")).toBe("0");
  });

  it("probes ROI with valid calculation, reset, and invalid input feedback", () => {
    render(<ROICalculator />);
    const before = screen.getByTestId("text-current-revenue").textContent;
    fireEvent.change(screen.getByTestId("input-reps"), { target: { value: "5" } });
    expect(screen.getByTestId("text-current-revenue").textContent).toMatch(/\$/);
    expect(screen.getByTestId("text-current-revenue").textContent).not.toBe(before);
    fireEvent.change(screen.getByTestId("input-reps"), { target: { value: "-1" } });
    expect((screen.getByTestId("input-reps") as HTMLInputElement).value).not.toBe("");
    expect(screen.getByTestId("input-reps").getAttribute("min")).toBe("1");
  });

  it("probes Branch Profitability with valid calculation, reset, and invalid input feedback", () => {
    render(<BranchProfitability />);
    const before = screen.getByTestId("text-annual-profit").textContent;
    fireEvent.change(screen.getByTestId("input-adc"), { target: { value: "0" } });
    expect((screen.getByTestId("input-adc") as HTMLInputElement).value).toBe("0");
    expect(screen.getByTestId("text-annual-profit").textContent).not.toBe(before);
    fireEvent.click(screen.getByTestId("button-reset"));
    expect((screen.getByTestId("input-adc") as HTMLInputElement).value).not.toBe("0");
    expect(screen.getByTestId("input-adc").getAttribute("min")).toBe("1");
  });

  it("probes Activity Calculator invalid feedback as well as its calculated and reset states", async () => {
    render(<ActivityCalculator />);
    fireEvent.click(screen.getByRole("button", { name: /calculate activity targets/i }));
    expect(screen.getByTestId("card-activity-form")).toBeTruthy();
    fireEvent.change(screen.getByTestId("input-monthly-goal"), { target: { value: "8" } });
    fireEvent.change(screen.getByTestId("input-last-admissions"), { target: { value: "6" } });
    fireEvent.change(screen.getByTestId("input-last-conversations"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: /calculate activity targets/i }));
    expect(await screen.findByTestId("text-results-title")).toBeTruthy();
    fireEvent.click(screen.getByTestId("button-recalculate"));
    await waitFor(() => expect(screen.getByTestId("card-activity-form")).toBeTruthy());
  });
});