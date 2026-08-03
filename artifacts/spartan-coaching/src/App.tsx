import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { useEffect, useRef, lazy, Suspense, useState, type ComponentType, type ReactNode } from "react";
import { pageView } from "./lib/ga";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header, Footer } from "@/components/Layout";
import { CommandPalette } from "@/components/CommandPalette";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RequireFieldKit } from "@/components/RequireFieldKit";
import { TrialBanner } from "@/components/TrialBanner";
import { FieldKitChecklistToast } from "@/components/FieldKitChecklistToast";
import { hasSeenIntro, shouldSkipIntro } from "@/lib/intro";

const ChatWidget = lazy(() => import("@/components/ChatWidget").then(m => ({ default: m.ChatWidget })));
const StickyBookCall = lazy(() => import("@/components/StickyBookCall").then(m => ({ default: m.StickyBookCall })));

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const Welcome = lazy(() => import("@/pages/Welcome"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const RequestAccess = lazy(() => import("@/pages/RequestAccess"));
const SetPassword = lazy(() => import("@/pages/SetPassword"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Portal = lazy(() => import("@/pages/Portal"));
const PortalLearn = lazy(() => import("@/pages/PortalLearn"));
const Account = lazy(() => import("@/pages/Account"));
const MagicLogin = lazy(() => import("@/pages/MagicLogin"));
const FieldKitMembership = lazy(() => import("@/pages/FieldKitMembership"));
const RedirectToMembership = lazy(() =>
  import("@/pages/Redirect").then((m) => ({ default: m.RedirectToMembership })),
);
const Services = lazy(() => import("@/pages/Services"));
const Programs = lazy(() => import("@/pages/Programs"));
const Method = lazy(() => import("@/pages/Method"));
const Tools = lazy(() => import("@/pages/Tools"));
const Resources = lazy(() => import("@/pages/Resources"));
const About = lazy(() => import("@/pages/About"));
const Playbooks = lazy(() => import("@/pages/Playbooks"));
const Objections = lazy(() => import("@/pages/Objections"));
const Research = lazy(() => import("@/pages/Research"));
const Transcribe = lazy(() => import("@/pages/Transcribe"));
const WeeklyPlan = lazy(() => import("@/pages/resources/WeeklyPlan"));
const QuickStartGuide = lazy(() => import("@/pages/resources/QuickStartGuide"));
const ObjectionCards = lazy(() => import("@/pages/resources/ObjectionCards"));
const TerritoryTemplate = lazy(() => import("@/pages/resources/TerritoryTemplate"));
const MetricsDashboard = lazy(() => import("@/pages/resources/MetricsDashboard"));
const ActivityTracker = lazy(() => import("@/pages/resources/ActivityTracker"));
const Quiz = lazy(() => import("@/pages/Quiz"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminAccessDesk = lazy(() => import("@/pages/AdminAccessDesk"));
const EmailTemplates = lazy(() => import("@/pages/EmailTemplates"));
const Testimonials = lazy(() => import("@/pages/Testimonials"));
const Articles = lazy(() => import("@/pages/Articles"));
const Podcasts = lazy(() => import("@/pages/Podcasts"));
const RolePlay = lazy(() => import("@/pages/RolePlay"));
const Drills = lazy(() => import("@/pages/Drills"));
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const ROICalculator = lazy(() => import("@/pages/ROICalculator"));
const ActivityCalculator = lazy(() => import("@/pages/ActivityCalculator"));
const RepCostCalculator = lazy(() => import("@/pages/RepCostCalculator"));
const BranchProfitability = lazy(() => import("@/pages/BranchProfitability"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const Disclaimer = lazy(() => import("@/pages/Disclaimer"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const HipaaBAA = lazy(() => import("@/pages/HipaaBAA"));
const ServicesContract = lazy(() => import("@/pages/ServicesContract"));
const NDA = lazy(() => import("@/pages/NDA"));
const EmrAccess = lazy(() => import("@/pages/EmrAccess"));
const ConflictOfInterest = lazy(() => import("@/pages/ConflictOfInterest"));
const LiabilityWaiver = lazy(() => import("@/pages/LiabilityWaiver"));
const TestimonialRelease = lazy(() => import("@/pages/TestimonialRelease"));
const LegalAgreements = lazy(() => import("@/pages/LegalAgreements"));
const ColdCallScript = lazy(() => import("@/pages/ColdCallScript"));
const WeeklyPlanBuilder = lazy(() => import("@/pages/WeeklyPlanBuilder"));
const SalesWorkflow = lazy(() => import("@/pages/SalesWorkflow"));
const ComplianceEthics = lazy(() => import("@/pages/ComplianceEthics"));
const Contact = lazy(() => import("@/pages/Contact"));
const Manifesto = lazy(() => import("@/pages/Manifesto"));
const Assessment = lazy(() => import("@/pages/Assessment"));
const BrandedAssessment = lazy(() => import("@/pages/BrandedAssessment"));
const AssessmentPrint = lazy(() => import("@/pages/AssessmentPrint"));
const AssessmentResultsPDF = lazy(() => import("@/pages/AssessmentResultsPDF"));
const SignAgreements = lazy(() => import("@/pages/SignAgreements"));
const BrandVideo = lazy(() => import("@/pages/BrandVideo"));
const AiToolsHub = lazy(() => import("@/pages/AiToolsHub"));
const AiTool = lazy(() => import("@/pages/AiTool"));

function withFieldKit(Page: ComponentType): ComponentType {
  return function GatedPage() {
    return (
      <RequireFieldKit>
        <Page />
      </RequireFieldKit>
    );
  };
}

const GatedPlaybooks = withFieldKit(Playbooks);
const GatedObjections = withFieldKit(Objections);
const GatedResearch = withFieldKit(Research);
const GatedTranscribe = withFieldKit(Transcribe);
const GatedEmailTemplates = withFieldKit(EmailTemplates);
const GatedRolePlay = withFieldKit(RolePlay);
const GatedROI = withFieldKit(ROICalculator);
const GatedActivity = withFieldKit(ActivityCalculator);
const GatedRepCost = withFieldKit(RepCostCalculator);
const GatedBranch = withFieldKit(BranchProfitability);
const GatedColdCall = withFieldKit(ColdCallScript);
const GatedWeeklyPlan = withFieldKit(WeeklyPlanBuilder);
const GatedSalesWorkflow = withFieldKit(SalesWorkflow);
const GatedDrills = withFieldKit(Drills);
const GatedQuiz = withFieldKit(Quiz);
const GatedKnowledgeBase = withFieldKit(KnowledgeBase);
const GatedAiToolsHub = withFieldKit(AiToolsHub);
const GatedAiTool = withFieldKit(AiTool);

function AssessmentRoute() {
  return <Assessment />;
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function VisitorTracker() {
  const [location] = useLocation();
  const lastTrackedRef = useRef<string>("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (lastTrackedRef.current === location) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      lastTrackedRef.current = location;
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagePath: location }),
      }).catch(() => {});
      pageView(location);
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [location]);

  return null;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function IntroGate({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for auth so logged-in clients never hit the splash
    if (isLoading) return;

    if (shouldSkipIntro(location) || isAuthenticated) {
      setReady(true);
      return;
    }
    if (!hasSeenIntro() && location === "/") {
      setLocation("/welcome");
    }
    setReady(true);
  }, [location, setLocation, isAuthenticated, isLoading]);

  if (!ready || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  return <>{children}</>;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <VisitorTracker />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/welcome" component={Welcome} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/request-access" component={RequestAccess} />
          <Route path="/set-password" component={SetPassword} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/portal" component={Portal} />
          <Route path="/portal/learn" component={PortalLearn} />
          <Route path="/account" component={Account} />
          <Route path="/magic-login" component={MagicLogin} />
          <Route path="/hospice-sales-pro" component={FieldKitMembership} />
          {/* Legacy URLs → Hospice Sales Pro lander */}
          <Route path="/membership" component={RedirectToMembership} />
          <Route path="/field-kit" component={RedirectToMembership} />
          <Route path="/field-kit-membership" component={RedirectToMembership} />
          <Route path="/pricing/field-kit" component={RedirectToMembership} />
          <Route path="/services" component={Services} />
          <Route path="/programs" component={Programs} />
          <Route path="/method" component={Method} />
          <Route path="/tools" component={Tools} />
          <Route path="/tools/playbooks" component={GatedPlaybooks} />
          <Route path="/tools/objections" component={GatedObjections} />
          <Route path="/tools/research" component={GatedResearch} />
          <Route path="/tools/transcribe" component={GatedTranscribe} />
          <Route path="/tools/email-templates" component={GatedEmailTemplates} />
          <Route path="/tools/role-play" component={GatedRolePlay} />
          <Route path="/tools/roi-calculator" component={GatedROI} />
          <Route path="/tools/activity-calculator" component={GatedActivity} />
          <Route path="/tools/rep-cost-calculator" component={GatedRepCost} />
          <Route path="/tools/branch-profitability" component={GatedBranch} />
          <Route path="/tools/cold-call-script" component={GatedColdCall} />
          <Route path="/tools/weekly-plan-builder" component={GatedWeeklyPlan} />
          <Route path="/tools/sales-workflow" component={GatedSalesWorkflow} />
          <Route path="/tools/ai" component={GatedAiToolsHub} />
          <Route path="/tools/ai/:toolId" component={GatedAiTool} />
          <Route path="/drills" component={GatedDrills} />

          <Route path="/resources" component={Resources} />
          <Route path="/admin/access-desk" component={AdminAccessDesk} />
          <Route path="/admin" component={Admin} />
          <Route path="/resources/weekly-plan" component={WeeklyPlan} />
          <Route path="/resources/activity-tracker" component={ActivityTracker} />
          <Route path="/quiz" component={GatedQuiz} />
          <Route path="/resources/quick-start-guide" component={QuickStartGuide} />
          <Route path="/resources/objection-cards" component={ObjectionCards} />
          <Route path="/resources/territory-template" component={TerritoryTemplate} />
          <Route path="/resources/metrics-dashboard" component={MetricsDashboard} />
          <Route path="/testimonials" component={Testimonials} />
          <Route path="/articles" component={Articles} />
          <Route path="/podcasts" component={Podcasts} />
          <Route path="/faq" component={FAQ} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/disclaimer" component={Disclaimer} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/baa" component={HipaaBAA} />
          <Route path="/contract" component={ServicesContract} />
          <Route path="/nda" component={NDA} />
          <Route path="/emr-access" component={EmrAccess} />
          <Route path="/conflict-of-interest" component={ConflictOfInterest} />
          <Route path="/liability-waiver" component={LiabilityWaiver} />
          <Route path="/testimonial-release" component={TestimonialRelease} />
          <Route path="/legal" component={LegalAgreements} />
          <Route path="/compliance" component={ComplianceEthics} />
          <Route path="/learn/knowledge-base" component={GatedKnowledgeBase} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/manifesto" component={Manifesto} />
          <Route path="/assess/:slug" component={BrandedAssessment} />
          <Route path="/assessment/:id/print" component={AssessmentPrint} />
          <Route path="/assessment/:id" component={AssessmentRoute} />
          <Route path="/assessment-results/:submissionId" component={AssessmentResultsPDF} />
          <Route path="/sign/:token" component={SignAgreements} />
          <Route path="/brand-video" component={BrandVideo} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function AppLayout() {
  const [location] = useLocation();
  const isBrandedAssessment = location.startsWith("/assess/");
  const isWelcome = location === "/welcome";
  const isAuthShell =
    isWelcome ||
    location === "/login" ||
    location === "/set-password" ||
    location === "/forgot-password" ||
    location === "/reset-password" ||
    location === "/magic-login";

  if (isBrandedAssessment) {
    return (
      <div className="flex flex-col min-h-screen safe-area-x">
        <main className="flex-1">
          <Router />
        </main>
      </div>
    );
  }

  if (isWelcome) {
    return (
      <main className="min-h-screen">
        <Router />
      </main>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="flex flex-col min-h-screen bg-background text-foreground safe-area-x">
        <Header />
        <TrialBanner />
        <main id="main-content" className="flex-1 bg-background" tabIndex={-1}>
          <Router />
        </main>
        {!isAuthShell && <Footer />}
      </div>
      <Suspense fallback={null}>
        <ChatWidget />
        <StickyBookCall />
        <CommandPalette />
      </Suspense>
    </>
  );
}

function App() {
  // ThemeProvider wraps <App /> in main.tsx so Header/Footer appearance
  // controls always sit under a single provider root (avoids HMR desync).
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <IntroGate>
                <AppLayout />
                <FieldKitChecklistToast />
                <Toaster />
              </IntroGate>
            </WouterRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
