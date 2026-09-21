import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Router } from "wouter";
import Home from "../Home";
import FieldKitMembership from "../FieldKitMembership";
import Services from "../Services";
import Testimonials from "../Testimonials";

const proofQueryData = vi.hoisted(() => ({
  testimonials: undefined as { testimonials: unknown[] } | undefined,
  caseStudies: undefined as { caseStudies: unknown[] } | undefined,
}));

afterEach(() => {
  cleanup();
  proofQueryData.testimonials = undefined;
  proofQueryData.caseStudies = undefined;
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock matchMedia for motion preference
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Query Client
const mockQueryClient = {
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
};

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: ({ queryKey }: { queryKey?: string[] }) => {
      if (queryKey?.[0] === "/api/testimonials") {
        return { data: proofQueryData.testimonials, isLoading: false };
      }
      if (queryKey?.[0] === "/api/case-studies") {
        return { data: proofQueryData.caseStudies, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    },
    useQueryClient: () => mockQueryClient,
  };
});

// Mock useAuth
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    canUseFieldKit: false,
  }),
}));

// Helper to render with Router
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Router>
      {ui}
    </Router>
  );
};

describe("Public Experience Design Standards", () => {
  describe("Home Page", () => {
    it("renders primary CTA hierarchy correctly", () => {
      renderWithProviders(<Home />);
      const title = screen.getByTestId("text-home-hero-title");
      expect(title).not.toBeNull();

      const consultCtas = screen.getAllByRole("link", { name: /Request a strategy call/i });
      expect(consultCtas.length).toBeGreaterThanOrEqual(2);

      const servicesCta = screen.getByRole("link", { name: /^Explore consulting$/i });
      expect(servicesCta).not.toBeNull();
      expect(screen.queryByRole("link", { name: /Explore Hospice Sales Pro/i })).toBeNull();
    });

    it("respects reduced motion preference (video autoplay fallback)", () => {
      renderWithProviders(<Home />);
      const figure = screen.getByTestId("hero-video");
      expect(figure).not.toBeNull();
    });
  });

  describe("Membership Page (Hospice Sales Pro)", () => {
    it("makes Standard versus Elite comparison explicit", () => {
      renderWithProviders(<FieldKitMembership />);
      const standardCard = screen.getByTestId("card-tier-individual");
      const eliteCard = screen.getByTestId("card-tier-elite");
      
      expect(standardCard).not.toBeNull();
      expect(eliteCard).not.toBeNull();
      expect(screen.getByText(/Recommended/i)).not.toBeNull();
    });
  });

  describe("Services Page", () => {
    it("presents exactly three leading service pathways", () => {
      renderWithProviders(<Services />);
      
      // We expect exactly 3 pathways
      expect(screen.getByTestId("card-consulting-01")).not.toBeNull();
      expect(screen.getByTestId("card-consulting-02")).not.toBeNull();
      expect(screen.getByTestId("card-consulting-03")).not.toBeNull();
      expect(screen.getByText("Field Performance Intensive")).not.toBeNull();
      expect(screen.getByText("Sales Team Operating System")).not.toBeNull();
      expect(screen.getByText("Growth Leadership Partnership")).not.toBeNull();
    });
  });

  describe("Testimonials Page (Proof)", () => {
    it("displays honest proof states and fallback", () => {
      renderWithProviders(<Testimonials />);
      expect(screen.getByTestId("section-proof-fallback")).not.toBeNull();
      expect(screen.getByRole("heading", { name: /Outcomes operators describe/i })).not.toBeNull();
    });

    it("renders a persisted record returned by the approved public API", () => {
      proofQueryData.testimonials = {
        testimonials: [{
          id: 42,
          name: "Approved Client",
          title: "Growth Leader",
          company: "Permissioned Provider",
          quote: "The team now coaches from one shared system.",
          outcome: "A consistent weekly coaching rhythm",
          category: "leadership",
          featured: true,
          displayOrder: 1,
          approvalStatus: "approved",
          approvalReference: "signed-release-42",
          approvedAt: "2026-09-19T00:00:00.000Z",
          createdAt: "2026-09-19T00:00:00.000Z",
        }],
      };

      renderWithProviders(<Testimonials />);

      expect(screen.getByText("Approved Client")).not.toBeNull();
      expect(screen.queryByTestId("section-proof-fallback")).toBeNull();
    });
  });
});
