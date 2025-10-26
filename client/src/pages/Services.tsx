import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";

export default function Services() {
  const services = [
    {
      title: "One-on-One Virtual Coaching (30 min)",
      price: 40,
      duration: "30 minutes",
      description: "A focused tune-up when you need quick progress on a real situation.",
      features: [
        "Prep form",
        "Live Zoom session",
        "Short recap with next steps & recording",
      ],
    },
    {
      title: "One-on-One Virtual Coaching (60 min)",
      price: 70,
      duration: "60 minutes",
      description: "A deeper working session for territory moves, referral strategy, complex cases, or pipeline structure.",
      features: [
        "Prep form",
        "60-minute live session with role-play",
        "One-page action plan",
        "Recording by request",
      ],
    },
    {
      title: "Live Field Coaching for Hospice Providers",
      price: null,
      duration: "Full day",
      description: "Ride-along coaching that changes behavior and proves it in the field.",
      features: [
        "Pre-call to set goals",
        "On-site ride-along",
        "Live coaching & debriefs",
        "One-page action summary with talk tracks",
      ],
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4" data-testid="text-services-title">
          Coaching Services
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          From focused one-on-one sessions to comprehensive team programs, every service is built to be simple, measurable, and patient-first.
        </p>
      </div>

      <div className="mb-20">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Coaching That Works in the Field
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <Card key={idx} className="flex flex-col h-full hover-elevate transition-all" data-testid={`card-service-${idx}`}>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">{service.title}</h3>
                {service.price && (
                  <p className="text-4xl font-black text-primary mb-4" data-testid={`text-price-${idx}`}>${service.price}</p>
                )}
                {!service.price && (
                  <p className="text-lg font-semibold text-muted-foreground mb-4">Custom Pricing</p>
                )}
                <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-3 mb-6">
                  {service.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button className="w-full font-bold" data-testid={`button-book-${idx}`}>
                Book Session
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-accent/50 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Ready to Elevate Your Performance?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Every session is customized to your specific challenges. Let's build a plan that delivers measurable results.
        </p>
        <Button size="lg" className="font-bold" data-testid="button-contact-us">
          Contact Us to Get Started
        </Button>
      </div>
    </div>
  );
}
