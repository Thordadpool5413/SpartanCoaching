import { Card } from "@/components/ui/card";
import { LightbulbIcon, SearchIcon, ChatIcon, MicrophoneIcon } from "@/components/icons";
import { Mail } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { SEO } from "@/components/SEO";

export default function Tools() {
  const tools = [
    {
      title: "Playbook Generator",
      description: "Create customized, strategic playbooks for any sales scenario. Describe your situation and desired outcomes, and AI will generate a complete action plan with talking points and key takeaways.",
      icon: <LightbulbIcon className="w-8 h-8" />,
      path: "/tools/playbooks",
    },
    {
      title: "Objection Handler",
      description: "Practice and refine your responses to common hospice objections. Generate AI-powered alternative responses and hear them read aloud to perfect your delivery.",
      icon: <ChatIcon className="w-8 h-8" />,
      path: "/tools/objections",
    },
    {
      title: "Grounded Research",
      description: "Get AI-powered insights with real web sources. Ask questions about hospice trends, regulations, or competitive intelligence, and receive answers backed by credible citations.",
      icon: <SearchIcon className="w-8 h-8" />,
      path: "/tools/research",
    },
    {
      title: "Audio Transcriber",
      description: "Record and transcribe sales calls, practice sessions, or coaching conversations. Review transcripts to identify improvement opportunities and track your progress.",
      icon: <MicrophoneIcon className="w-8 h-8" />,
      path: "/tools/transcribe",
    },
    {
      title: "Email Templates",
      description: "Generate professional follow-up emails, thank you notes, and value-add messages. AI-powered templates help you build relationships and stay top-of-mind with your referral sources.",
      icon: <Mail className="w-8 h-8" />,
      path: "/tools/email-templates",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <SEO />
      <BackButton />
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <h1 className="text-h1 font-black text-foreground mb-6" data-testid="text-tools-title">
          AI Field Kit
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">
          Your digital toolkit powered by AI. Generate playbooks, practice objections, conduct research, and transcribe calls—all designed to make you a more effective hospice sales professional.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-cards">
        {tools.map((tool, idx) => (
          <Card key={idx} className="flex flex-col border-2 group relative card-lift spacing-card shadow-lg" data-testid={`card-tool-${idx}`}>
            <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  {tool.icon}
                </div>
                <h3 className="text-h3 font-bold text-foreground">{tool.title}</h3>
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
        ))}
      </div>

      <div className="mt-10 sm:mt-16 bg-gradient-to-br from-accent/50 to-accent/30 rounded-2xl p-8 md:p-12 text-center border-2 border-accent/50 shadow-lg">
        <h2 className="text-h2 font-bold text-foreground mb-4">
          AI-Powered Coaching, On Demand
        </h2>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          These tools are designed to give you instant access to expert coaching whenever you need it. Practice, prepare, and perform at your best.
        </p>
      </div>
    </div>
  );
}
