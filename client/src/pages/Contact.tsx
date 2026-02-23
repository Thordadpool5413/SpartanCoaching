import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
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
import { CheckCircle, Loader2, Mail } from "lucide-react";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  company: z.string().optional(),
  serviceType: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      serviceType: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return apiRequest("POST", "/api/inquiries", data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
      setSubmitted(true);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <BackButton />
      <div className="max-w-3xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-16">
            <h1 className="text-h1 text-foreground mb-6" data-testid="text-contact-title">
              Contact Us
            </h1>
            <p className="text-body-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto" data-testid="text-contact-intro">
              Have a question about Spartan Coaching? Want to learn more about how we work with hospice growth professionals? Reach out and we will get back to you.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          {submitted ? (
            <Card className="spacing-card text-center" data-testid="card-contact-success">
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-h2 text-foreground">Thank You</h2>
                <p className="text-body-lg text-muted-foreground max-w-md">
                  We received your message and will get back to you soon. Thank you for reaching out.
                </p>
                <Button variant="outline" onClick={() => { setSubmitted(false); form.reset(); }} className="mt-4 font-bold" data-testid="button-send-another">
                  Send Another Message
                </Button>
              </div>
            </Card>
          ) : (
          <Card className="spacing-card" data-testid="card-contact-form">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            {...field}
                            data-testid="input-contact-name"
                          />
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
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                            data-testid="input-contact-email"
                          />
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
                          <Input
                            type="tel"
                            placeholder="(555) 123-4567"
                            {...field}
                            data-testid="input-contact-phone"
                          />
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
                        <FormLabel>Company / Organization</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Acme Hospice"
                            {...field}
                            data-testid="input-contact-company"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Interest</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="input-contact-service">
                            <SelectValue placeholder="Select a service..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Individual Coaching">Individual Coaching</SelectItem>
                          <SelectItem value="Team Training">Team Training</SelectItem>
                          <SelectItem value="Sales Leadership Development">Sales Leadership Development</SelectItem>
                          <SelectItem value="Corporate Consulting">Corporate Consulting</SelectItem>
                          <SelectItem value="Territory Strategy">Territory Strategy</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us how we can help..."
                          className="resize-none min-h-[120px]"
                          {...field}
                          data-testid="input-contact-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitMutation.isPending}
                  className="w-full font-bold"
                  data-testid="button-contact-submit"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
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
                href="mailto:nicholas.lynch@spartan-coaching-schools.org"
                className="text-sm hover:text-foreground transition-colors"
                data-testid="link-contact-email"
              >
                nicholas.lynch@spartan-coaching-schools.org
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
