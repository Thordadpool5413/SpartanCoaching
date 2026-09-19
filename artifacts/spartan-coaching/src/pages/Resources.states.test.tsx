import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Resources from "./Resources";

const { useQuery } = vi.hoisted(() => ({ useQuery: vi.fn() }));
const auth = vi.fn();
const refetchResources = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  QueryClient: class QueryClient {},
  useQuery,
  useMutation: () => ({ isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth() }));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/ContentNotice", () => ({ ContentNotice: () => null }));
vi.mock("@/components/PublicConversionPanel", () => ({ PublicConversionPanel: () => null }));
vi.mock("@/components/ToolResultActions", () => ({ ToolResultActions: () => null }));
vi.mock("@/components/StateBlock", () => ({ StateBlock: ({ title, action }: { title: string; action?: { label: string; onClick?: () => void } }) => <div><span>{title}</span>{action?.onClick ? <button onClick={action.onClick}>{action.label}</button> : null}</div> }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn(), trackProductOutcome: vi.fn() }));
vi.mock("@/lib/aiToolHandoff", () => ({ stageAiToolHandoff: vi.fn() }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useLocation: () => ["/resources", vi.fn()] }));

const resource = {
  id: 1,
  title: "Visit checklist",
  description: "A useful checklist",
  fileUrl: "/resources/visit.pdf",
  category: "checklist",
} as never;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Resources loading and download states", () => {
  it("renders loading skeletons while the core library is pending", () => {
    auth.mockReturnValue({ member: null, canUseFieldKit: false });
    useQuery.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<Resources />);
    expect(document.querySelectorAll("[data-slot='skeleton'], .animate-pulse").length).toBeGreaterThan(0);
  });

  it("offers a retry action when the core library fails", () => {
    auth.mockReturnValue({ member: null, canUseFieldKit: false });
    useQuery.mockReturnValue({ isLoading: false, isError: true, refetch: refetchResources });
    render(<Resources />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetchResources).toHaveBeenCalled();
  });

  it("does not attempt a popup for a blocked member download without a window", () => {
    auth.mockReturnValue({ member: { id: 1, role: "member" }, canUseFieldKit: true });
    useQuery
      .mockReturnValueOnce({ isLoading: false, isError: false, data: { resources: [resource] } })
      .mockReturnValueOnce({ isLoading: false, isError: false, data: { items: [] } });
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(<Resources />);
    fireEvent.click(screen.getByTestId("button-open-resource-1"));
    expect(open).toHaveBeenCalledWith("/resources/files/visit.pdf", "_blank");
    open.mockRestore();
  });
});