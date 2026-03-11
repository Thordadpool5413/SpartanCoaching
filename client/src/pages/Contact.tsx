import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { FadeIn } from "@/components/animations";
import { SEO } from "@/components/SEO";
import { CheckCircle, Loader2, Mail, ChevronLeft, ChevronRight, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  company: z.string().min(1, "Organization is required"),
  role: z.string().min(1, "Please select your role"),
  census: z.string().min(1, "Please select your current census"),
  challenge: z.string().min(1, "Please select your biggest challenge"),
  teamSize: z.string().min(1, "Please select your team size"),
  timeline: z.string().min(1, "Please select a timeline"),
  serviceType: z.string().min(1, "Please select a service of interest"),
  additionalContext: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const STEP_FIELDS: Record<number, (keyof ContactFormData)[]> = {
  1: ["name", "email", "phone", "company", "role"],
  2: ["census", "challenge", "teamSize", "timeline"],
  3: ["serviceType"],
};

const STEP_LABELS = ["About You", "Your Situation", "What You Need"];

export default function Contact() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [serviceParam, setServiceParam] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    if (service) {
      const decoded = decodeURIComponent(service);
      setServiceParam(decoded);
      if (decoded === "HIPAA BAA Request") {
        form.setValue("serviceType", "HIPAA BAA Request");
      }
    }
  }, []);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      role: "",
      census: "",
      challenge: "",
      teamSize: "",
      timeline: "",
      serviceType: "",
      additionalContext: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const parts = [
        `Role: ${data.role}`,
        `Current Monthly Census: ${data.census}`,
        `Biggest Challenge: ${data.challenge}`,
        `Team Size: ${data.teamSize}`,
        `Timeline: ${data.timeline}`,
      ];
      if (data.additionalContext?.trim()) {
        parts.push(`\nAdditional Context:\n${data.additionalContext.trim()}`);
      }
      if (serviceParam) {
        parts.unshift(`Inquiring About: ${serviceParam}`);
      }
      return apiRequest("POST", "/api/inquiries", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        serviceType: data.serviceType,
        message: parts.join("\n"),
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
      setStep(1);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <BackButton />
      <div className="max-w-2xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-h1 text-foreground mb-6" data-testid="text-contact-title">
              Book a Discovery Call
            </h1>
            <p className="text-body-lg text-muted-foreground leading-relaxed max-w-xl mx-auto" data-testid="text-contact-intro">
              Answer a few quick questions so Nick can come prepared. Takes about 90 seconds.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground" data-testid="section-contact-compliance">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>HIPAA-aware practices. No PHI collected. <Link href="/compliance" className="text-primary font-semibold hover:underline">Compliance details</Link></span>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          {submitted ? (
            <Card className="spacing-card text-center" data-testid="card-contact-success">
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-h2 text-foreground">You're In</h2>
                <p className="text-body-lg text-muted-foreground max-w-md">
                  Nick will review your submission and reach out within one business day to schedule a 30-minute discovery call.
                </p>
                <Button
                  variant="outline"
                  onClick={() => { setSubmitted(false); form.reset(); setStep(1); }}
                  className="mt-4 font-bold"
                  data-testid="button-send-another"
                >
                  Submit Another Request
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="spacing-card" data-testid="card-contact-form">
              {/* Service context chip */}
              {serviceParam && (
                <div className="flex items-center justify-between gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-6" data-testid="chip-service-context">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide flex-shrink-0">Inquiring about:</span>
                    <span className="text-sm font-semibold text-foreground truncate">{serviceParam}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setServiceParam(null)}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0 ml-2"
                    aria-label="Clear service selection"
                    data-testid="button-clear-service"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {/* Step progress */}
              <div className="mb-8" data-testid="section-step-progress">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide" data-testid="text-step-label">
                    Step {step} of 3 — {STEP_LABELS[step - 1]}
                  </span>
                  <span className="text-xs text-muted-foreground">{step === 1 ? "30 sec" : step === 2 ? "45 sec" : "15 sec"}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                    data-testid="progress-bar-step"
                  />
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                  {/* ── STEP 1: About You ── */}
                  {step === 1 && (
                    <div className="space-y-5" data-testid="section-step-1">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Smith" {...field} data-testid="input-contact-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="jane@hospice.com" {...field} data-testid="input-contact-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone *</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="(555) 123-4567" {...field} data-testid="input-contact-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization *</FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Hospice" {...field} data-testid="input-contact-company" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Role *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-contact-role">
                                  <SelectValue placeholder="Select your role..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Sales Representative">Sales Representative</SelectItem>
                                <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                                <SelectItem value="Director of Business Development">Director of Business Development</SelectItem>
                                <SelectItem value="Agency Owner / Executive">Agency Owner / Executive</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* ── STEP 2: Your Situation ── */}
                  {step === 2 && (
                    <div className="space-y-5" data-testid="section-step-2">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="census"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Monthly Census *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-contact-census">
                                    <SelectValue placeholder="Select range..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Under 20">Under 20</SelectItem>
                                  <SelectItem value="20–50">20–50</SelectItem>
                                  <SelectItem value="51–100">51–100</SelectItem>
                                  <SelectItem value="101–200">101–200</SelectItem>
                                  <SelectItem value="201+">201+</SelectItem>
                                  <SelectItem value="Not applicable">Not applicable</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="teamSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sales Team Size *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-contact-team-size">
                                    <SelectValue placeholder="Select size..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Just me">Just me</SelectItem>
                                  <SelectItem value="2–5 reps">2–5 reps</SelectItem>
                                  <SelectItem value="6–15 reps">6–15 reps</SelectItem>
                                  <SelectItem value="16+ reps">16+ reps</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="challenge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biggest Challenge Right Now *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-contact-challenge">
                                  <SelectValue placeholder="Select your biggest challenge..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Objection Handling">Objection Handling</SelectItem>
                                <SelectItem value="Territory Development">Territory Development</SelectItem>
                                <SelectItem value="Physician Engagement">Physician Engagement</SelectItem>
                                <SelectItem value="Team Management & Accountability">Team Management &amp; Accountability</SelectItem>
                                <SelectItem value="Compliance & Clinical Knowledge">Compliance &amp; Clinical Knowledge</SelectItem>
                                <SelectItem value="Activity Planning & Metrics">Activity Planning &amp; Metrics</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timeline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>When Are You Looking to Start? *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-contact-timeline">
                                  <SelectValue placeholder="Select timeline..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Ready to start now">Ready to start now</SelectItem>
                                <SelectItem value="Within 30–90 days">Within 30–90 days</SelectItem>
                                <SelectItem value="Just exploring options">Just exploring options</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* ── STEP 3: What You Need ── */}
                  {step === 3 && (
                    <div className="space-y-5" data-testid="section-step-3">
                      <FormField
                        control={form.control}
                        name="serviceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service of Interest *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-contact-service">
                                  <SelectValue placeholder="What are you looking for?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Individual Coaching">Individual Coaching</SelectItem>
                                <SelectItem value="Team Training">Team Training</SelectItem>
                                <SelectItem value="Sales Leadership Development">Sales Leadership Development</SelectItem>
                                <SelectItem value="Corporate Consulting">Corporate Consulting</SelectItem>
                                <SelectItem value="Territory Strategy">Territory Strategy</SelectItem>
                                <SelectItem value="HIPAA BAA Request">HIPAA BAA Request</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="additionalContext"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Anything else Nick should know? <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., specific markets, team challenges, goals for the next quarter..."
                                className="resize-none min-h-[100px]"
                                {...field}
                                data-testid="textarea-contact-context"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Navigation */}
                  <div className={cn("flex gap-3 pt-2", step > 1 ? "justify-between" : "justify-end")}>
                    {step > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        data-testid="button-contact-back"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                      </Button>
                    )}

                    {step < 3 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="font-bold"
                        data-testid="button-contact-next"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={submitMutation.isPending}
                        className="font-bold"
                        data-testid="button-contact-submit"
                      >
                        {submitMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Request Discovery Call"
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </Card>
          )}
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-10 text-center" data-testid="section-contact-info">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a
                href="mailto:nick@spartanhospicecoaching.com"
                className="text-sm hover:text-foreground transition-colors"
                data-testid="link-contact-email"
              >
                nick@spartanhospicecoaching.com
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
