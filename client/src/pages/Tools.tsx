import { Card } from "@/components/ui/card";
import { LightbulbIcon, SearchIcon as CustomSearchIcon, ChatIcon, MicrophoneIcon } from "@/components/icons";
import { Mail, Users, Search } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { SEO } from "@/components/SEO";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/animations";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Tools() {
  const [searchQuery, setSearchQuery] = useState("");

  const tools = [
    {
      title: "Playbook Generator",
      description: "Create customized, strategic playbooks for any sales scenario. Describe your situation and desired outcomes, and AI will generate a complete action plan with talking points and key takeaways.",
      icon: <LightbulbIcon className="w-8 h-8" />,
      path: "/tools/playbooks",
      category: "Strategy",
    },
    {
      title: "Objection Handler",
      description: "Practice and refine your responses to common hospice objections. Generate expert alternative responses and hear them read aloud to perfect your delivery.",
      icon: <ChatIcon className="w-8 h-8" />,
      path: "/tools/objections",
      category: "Communication",
    },
    {
      title: "Grounded Research",
      description: "Get expert insights with real web sources. Ask questions about hospice trends, regulations, or competitive intelligence, and receive answers backed by credible citations.",
      icon: <CustomSearchIcon className="w-8 h-8" />,
      path: "/tools/research",
      category: "Intelligence",
    },
    {
      title: "Audio Transcriber",
      description: "Record and transcribe sales calls, practice sessions, or coaching conversations. Review transcripts to identify improvement opportunities and track your progress.",
      icon: <MicrophoneIcon className="w-8 h-8" />,
      path: "/tools/transcribe",
      category: "Analytics",
    },
    {
      title: "Email Templates",
      description: "Generate professional follow-up emails, thank you notes, and value-add messages. Expert templates help you build relationships and stay top-of-mind with your referral sources.",
      icon: <Mail className="w-8 h-8" />,
      path: "/tools/email-templates",
      category: "Outreach",
    },
    {
      title: "Role-Play Practice",
      description: "Practice real sales conversations in simulated scenarios. Simulate cold calls, handle physician objections, guide family consultations, and get detailed coaching feedback on your performance.",
      icon: <Users className="w-8 h-8" />,
      path: "/tools/role-play",
      category: "Training",
    },
  ];

  // Filter tools based on search query
  const filteredTools = tools.filter((tool) => {
    const query = searchQuery.toLowerCase();
    return (
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <SEO />
      <BackButton />
      <SlideUp>
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <h1 className="text-h1 font-black text-foreground mb-6" data-testid="text-tools-title">
            AI Field Kit
          </h1>
          <p className="text-body-lg text-muted-foreground leading-relaxed">
            Your digital toolkit powered by AI. Generate playbooks, practice objections, conduct research, and transcribe calls—all designed to make you a more effective hospice sales professional.
          </p>
        </div>
      </SlideUp>

      {/* Search/Filter Bar */}
      <SlideUp delay={0.1}>
        <div className="mb-10 sm:mb-12 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search tools by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-tools-search"
                className="pl-10"
              />
            </div>
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              Showing {filteredTools.length} of {tools.length} tools
            </p>
          </div>
        </div>
      </SlideUp>

      <StaggerContainer className="grid md:grid-cols-2 gap-cards">
        {filteredTools.map((tool, idx) => (
          <StaggerItem key={idx}>
            <Card className={cn("flex flex-col border-2 group relative card-lift spacing-card shadow-lg", filteredTools.length === 0 ? "hidden" : "")} data-testid={`card-tool-${idx}`}>
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                      {tool.icon}
                    </div>
                    <h3 className="text-h3 font-bold text-foreground">{tool.title}</h3>
                  </div>
                </div>
                <div className="mb-4">
                  <Badge variant="secondary">{tool.category}</Badge>
                </div>
                <p className="text-body text-muted-foreground leading-relaxed flex-1 mb-6">
                  {tool.description}
                </p>
                <Button asChild className="w-full font-bold touch-manipulation py-3" size="lg">
                  <Link href={tool.path} data-testid={`button-tool-${idx}`}>
                    Launch Tool
                  </Link>
                </Button>
              </div>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Show empty state when no tools match */}
      {filteredTools.length === 0 && (
        <SlideUp delay={0.1}>
          <div className="text-center py-12 mt-10">
            <p className="text-body-lg text-muted-foreground">
              No tools found matching "{searchQuery}". Try a different search term.
            </p>
          </div>
        </SlideUp>
      )}

      <SlideUp delay={0.2}>
        <div className="mt-10 sm:mt-16 bg-gradient-to-br from-accent/50 to-accent/30 rounded-2xl p-8 md:p-12 text-center border-2 border-accent/50 shadow-lg">
          <h2 className="text-h2 font-bold text-foreground mb-4">
            Expert Coaching, On Demand
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            These tools are designed to give you instant access to expert coaching whenever you need it. Practice, prepare, and perform at your best.
          </p>
        </div>
      </SlideUp>
    </div>
  );
}
