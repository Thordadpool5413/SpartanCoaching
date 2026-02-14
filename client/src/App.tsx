import { Switch, Route, useLocation } from "wouter";
import { useEffect, useRef, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header, Footer } from "@/components/Layout";
import { CommandPalette } from "@/components/CommandPalette";

const ChatWidget = lazy(() => import("@/components/ChatWidget").then(m => ({ default: m.ChatWidget })));
const StickyBookCall = lazy(() => import("@/components/StickyBookCall").then(m => ({ default: m.StickyBookCall })));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
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
const Admin = lazy(() => import("@/pages/Admin"));
const EmailTemplates = lazy(() => import("@/pages/EmailTemplates"));
const Testimonials = lazy(() => import("@/pages/Testimonials"));
const Articles = lazy(() => import("@/pages/Articles"));
const Podcasts = lazy(() => import("@/pages/Podcasts"));
const RolePlay = lazy(() => import("@/pages/RolePlay"));
const Drills = lazy(() => import("@/pages/Drills"));
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const ROICalculator = lazy(() => import("@/pages/ROICalculator"));
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  useEffect(() => {
    if (lastTrackedRef.current === location) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      lastTrackedRef.current = location;
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagePath: location })
      }).catch(() => {});
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

function Router() {
  return (
    <>
      <ScrollToTop />
      <VisitorTracker />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/services" component={Services} />
          <Route path="/programs" component={Programs} />
          <Route path="/method" component={Method} />
          <Route path="/tools" component={Tools} />
          <Route path="/tools/playbooks" component={Playbooks} />
          <Route path="/tools/objections" component={Objections} />
          <Route path="/tools/research" component={Research} />
          <Route path="/tools/transcribe" component={Transcribe} />
          <Route path="/tools/email-templates" component={EmailTemplates} />
          <Route path="/tools/role-play" component={RolePlay} />
          <Route path="/tools/roi-calculator" component={ROICalculator} />
          <Route path="/drills" component={Drills} />

          <Route path="/resources" component={Resources} />
          <Route path="/admin" component={Admin} />
          <Route path="/resources/weekly-plan" component={WeeklyPlan} />
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
          <Route path="/learn/knowledge-base" component={KnowledgeBase} />
          <Route path="/about" component={About} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen safe-area-x">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
          </div>
          <Suspense fallback={null}>
            <ChatWidget />
            <StickyBookCall />
            <PWAInstallPrompt />
            <CommandPalette />
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
