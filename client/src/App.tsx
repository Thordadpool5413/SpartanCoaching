import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header, Footer } from "@/components/Layout";
import { ChatWidget } from "@/components/ChatWidget";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Programs from "@/pages/Programs";
import Method from "@/pages/Method";
import Tools from "@/pages/Tools";
import Resources from "@/pages/Resources";
import About from "@/pages/About";
import Playbooks from "@/pages/Playbooks";
import Objections from "@/pages/Objections";
import Research from "@/pages/Research";
import Transcribe from "@/pages/Transcribe";
import WeeklyPlan from "@/pages/resources/WeeklyPlan";
import QuickStartGuide from "@/pages/resources/QuickStartGuide";
import ObjectionCards from "@/pages/resources/ObjectionCards";
import TerritoryTemplate from "@/pages/resources/TerritoryTemplate";
import MetricsDashboard from "@/pages/resources/MetricsDashboard";
import Admin from "@/pages/Admin";
import EmailTemplates from "@/pages/EmailTemplates";
import Testimonials from "@/pages/Testimonials";
import Articles from "@/pages/Articles";
import Podcasts from "@/pages/Podcasts";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function VisitorTracker() {
  const [location] = useLocation();
  
  useEffect(() => {
    const SESSION_KEY = 'visitor-tracked';
    
    if (sessionStorage.getItem(SESSION_KEY)) {
      return;
    }
    
    sessionStorage.setItem(SESSION_KEY, 'true');
    
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePath: location
      })
    })
      .then((response) => {
        if (!response.ok) {
          sessionStorage.removeItem(SESSION_KEY);
          console.error('Visitor tracking failed:', response.status, response.statusText);
        }
      })
      .catch((error) => {
        sessionStorage.removeItem(SESSION_KEY);
        console.error('Visitor tracking error:', error);
      });
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <VisitorTracker />
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
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
          </div>
          <ChatWidget />
          <PWAInstallPrompt />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
