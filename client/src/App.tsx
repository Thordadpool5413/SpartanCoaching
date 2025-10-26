import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header, Footer } from "@/components/Layout";
import { ChatWidget } from "@/components/ChatWidget";
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

function Router() {
  return (
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
      <Route path="/resources" component={Resources} />
      <Route path="/resources/weekly-plan" component={WeeklyPlan} />
      <Route path="/resources/quick-start-guide" component={QuickStartGuide} />
      <Route path="/resources/objection-cards" component={ObjectionCards} />
      <Route path="/resources/territory-template" component={TerritoryTemplate} />
      <Route path="/resources/metrics-dashboard" component={MetricsDashboard} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
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
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
