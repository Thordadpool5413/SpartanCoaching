import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Phone,
  Building,
  Calendar,
  Users,
  Lock,
  LogOut,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Star,
  FileText as FileSignature,
  PlayCircle,
  Target,
  Quote,
  Award,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle,
  Circle,
  Send,
  Loader2,
  ClipboardList,
  Copy,
  Link as LinkIcon,
  Printer,
  KeyRound,
} from "lucide-react";
import { AccessDesk } from "@/components/AccessDesk";
import type {
  SelectInquiry,
  SelectNewsletterSubscriber,
  SelectArticle,
  InsertArticle,
  VisitorAnalytics,
  SelectResource,
  InsertResource,
  SelectPodcast,
  InsertPodcast,
  SelectSignedAgreement,
  SelectRoleplaySession,
  SelectDrillCompletion,
  SelectTestimonial,
  SelectCaseStudy,
  InsertTestimonial,
  InsertCaseStudy,
  SelectResourceLead,
  SelectAssessment,
  SelectAssessmentQuestion,
  SelectAssessmentSubmission,
  SelectAgreementRequest,
  SelectAssessmentInvite,
} from "@shared/schema";
import type { SelectUsageEvent } from "@shared/schema";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { FileText } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";

import {
  adminGet,
  adminFetch,
  markAdminSession,
  clearAdminSessionFlag,
  hasAdminSessionFlag,
} from "@/lib/adminApi";

const downloadCSV = (rows: string[][], filename: string) => {
  const csv = rows
    .map((r) =>
      r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Session platform admin OR validated admin flag
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include" }).then(
          async (r) => (r.ok ? r.json() : null),
        );
        if (me?.member?.role === "platform_admin") {
          if (!cancelled) {
            setIsAuthenticated(true);
          }
          return;
        }
      } catch {
        /* ignore */
      }

      if (hasAdminSessionFlag() && !cancelled) {
        try {
          await adminGet("/api/admin/access-metrics");
          if (!cancelled) {
            setIsAuthenticated(true);
          }
        } catch {
          clearAdminSessionFlag();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
    setIsAuthenticated(false);
    clearAdminSessionFlag();
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin dashboard",
    });
  };

  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery<{
    inquiries: SelectInquiry[];
  }>({
    queryKey: ["/api/inquiries"],
    queryFn: () => adminGet("/api/inquiries"),
    enabled: isAuthenticated,
  });

  const { data: subscribersData, isLoading: subscribersLoading } = useQuery<{
    subscribers: SelectNewsletterSubscriber[];
  }>({
    queryKey: ["/api/newsletter/subscribers"],
    queryFn: () => adminGet("/api/newsletter/subscribers"),
    enabled: isAuthenticated,
  });

  const markReadMutation = useMutation({
    mutationFn: async ({ id, isRead }: { id: number; isRead: boolean }) => {
      const res = await fetch(`/api/inquiries/${id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isRead }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
    },
  });

  const { data: articlesData, isLoading: articlesLoading } = useQuery<{
    articles: SelectArticle[];
  }>({
    queryKey: ["/api/articles"],
    enabled: isAuthenticated,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<{
    analytics: VisitorAnalytics;
  }>({
    queryKey: ["/api/analytics/visitors"],
    queryFn: () => adminGet("/api/analytics/visitors"),
    enabled: isAuthenticated,
  });

  const { data: resourcesData, isLoading: resourcesLoading } = useQuery<{
    resources: SelectResource[];
  }>({
    queryKey: ["/api/resources"],
    enabled: isAuthenticated,
  });

  const { data: podcastsData, isLoading: podcastsLoading } = useQuery<{
    podcasts: SelectPodcast[];
  }>({
    queryKey: ["/api/podcasts"],
    enabled: isAuthenticated,
  });

  const { data: agreementsData, isLoading: agreementsLoading } = useQuery<{
    agreements: (SelectSignedAgreement & { hasPdf?: boolean })[];
  }>({
    queryKey: ["/api/signed-agreements"],
    queryFn: () => adminGet("/api/signed-agreements"),
    enabled: isAuthenticated,
  });

  const { data: agreementRequestsData, isLoading: agreementRequestsLoading } =
    useQuery<{ requests: SelectAgreementRequest[] }>({
      queryKey: ["/api/agreement-requests"],
      queryFn: () => adminGet("/api/agreement-requests"),
      enabled: isAuthenticated,
    });

  const { data: roleplaySessionsData, isLoading: roleplaySessionsLoading } =
    useQuery<SelectRoleplaySession[]>({
      queryKey: ["/api/roleplay/sessions"],
      enabled: isAuthenticated,
    });

  const { data: drillCompletionsData, isLoading: drillCompletionsLoading } =
    useQuery<{ completions: SelectDrillCompletion[] }>({
      queryKey: ["/api/drills/completions"],
      enabled: isAuthenticated,
    });

  const { data: testimonialsData, isLoading: testimonialsLoading } = useQuery<{
    testimonials: SelectTestimonial[];
  }>({
    queryKey: ["/api/testimonials"],
    enabled: isAuthenticated,
  });

  const { data: caseStudiesData, isLoading: caseStudiesLoading } = useQuery<{
    caseStudies: SelectCaseStudy[];
  }>({
    queryKey: ["/api/case-studies"],
    enabled: isAuthenticated,
  });

  const { data: eventAnalyticsData, isLoading: eventAnalyticsLoading } =
    useQuery<{
      analytics: {
        aiToolUsage: Array<{ eventName: string; count: number }>;
        resourceDownloads: Array<{ eventName: string; count: number }>;
        contactSubmissions: number;
        mobileAiToolUsage: Array<{ eventName: string; count: number }>;
        mobileToolViews: Array<{ eventName: string; count: number }>;
        mobileAppOpens: { day: number; week: number; month: number };
      };
    }>({
      queryKey: ["/api/analytics/events"],
      queryFn: () => adminGet("/api/analytics/events"),
      enabled: isAuthenticated,
      refetchInterval: 60000,
    });

  const { data: aiUsageData } = useQuery<{
    count: number;
    cap: number;
    date: string;
  }>({
    queryKey: ["/api/admin/ai-usage"],
    queryFn: () => adminGet("/api/admin/ai-usage"),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: resourceLeadsData, isLoading: resourceLeadsLoading } =
    useQuery<{ leads: SelectResourceLead[] }>({
      queryKey: ["/api/resource-leads"],
      queryFn: () => adminGet("/api/resource-leads"),
      enabled: isAuthenticated,
    });

  const { data: usageEventsData } = useQuery<{ events: SelectUsageEvent[] }>({
    queryKey: ["/api/usage-events"],
    queryFn: () => adminGet("/api/usage-events"),
    enabled: isAuthenticated,
  });

  const { data: assessmentsData, isLoading: assessmentsLoading } = useQuery<{
    assessments: SelectAssessment[];
  }>({
    queryKey: ["/api/assessments"],
    queryFn: () => adminGet("/api/assessments"),
    enabled: isAuthenticated,
  });

  const inquiries = inquiriesData?.inquiries || [];
  const subscribers = subscribersData?.subscribers || [];
  const articles = articlesData?.articles || [];
  const analytics = analyticsData?.analytics;
  const resources = resourcesData?.resources || [];
  const podcasts = podcastsData?.podcasts || [];
  const agreements = agreementsData?.agreements || [];
  const agreementRequests = agreementRequestsData?.requests || [];
  const roleplaySessions: SelectRoleplaySession[] = Array.isArray(roleplaySessionsData)
    ? roleplaySessionsData
    : [];
  const drillCompletions = drillCompletionsData?.completions || [];
  const testimonialsList = testimonialsData?.testimonials || [];
  const caseStudiesList = caseStudiesData?.caseStudies || [];
  const resourceLeads = resourceLeadsData?.leads || [];
  const usageEvents = usageEventsData?.events || [];
  const assessmentsList = assessmentsData?.assessments || [];

  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [assessmentName, setAssessmentName] = useState("");
  const [assessmentDescription, setAssessmentDescription] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<
    number | null
  >(null);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [questionType, setQuestionType] = useState<"quiz" | "scenario">("quiz");
  const [questionText, setQuestionText] = useState("");
  const [questionOptions, setQuestionOptions] = useState(["", "", "", ""]);
  const [questionCorrectAnswer, setQuestionCorrectAnswer] = useState("");
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<
    number | null
  >(null);
  const [submissionClientFilter, setSubmissionClientFilter] =
    useState<string>("all");

  const { data: assessmentQuestionsData } = useQuery<{
    questions: SelectAssessmentQuestion[];
  }>({
    queryKey: ["/api/assessments", selectedAssessmentId, "questions"],
    queryFn: () =>
      adminGet(`/api/assessments/${selectedAssessmentId}/questions`),
    enabled: isAuthenticated && selectedAssessmentId !== null,
  });

  const { data: assessmentSubmissionsData } = useQuery<{
    submissions: SelectAssessmentSubmission[];
  }>({
    queryKey: ["/api/assessments", selectedAssessmentId, "submissions"],
    queryFn: () =>
      adminGet(`/api/assessments/${selectedAssessmentId}/submissions`),
    enabled: isAuthenticated && selectedAssessmentId !== null,
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description: string;
    }) => {
      const res = await fetch("/api/assessments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      setAssessmentDialogOpen(false);
      setAssessmentName("");
      setAssessmentDescription("");
      toast({ title: "Assessment Created" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/assessments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      if (selectedAssessmentId) setSelectedAssessmentId(null);
      toast({ title: "Assessment Deleted" });
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(
        `/api/assessments/${selectedAssessmentId}/questions`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/assessments", selectedAssessmentId, "questions"],
      });
      setQuestionDialogOpen(false);
      setQuestionText("");
      setQuestionOptions(["", "", "", ""]);
      setQuestionCorrectAnswer("");
      toast({ title: "Question Added" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/assessments/questions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/assessments", selectedAssessmentId, "questions"],
      });
      toast({ title: "Question Removed" });
    },
  });

  const assessmentQuestions = assessmentQuestionsData?.questions || [];
  const assessmentSubmissions = assessmentSubmissionsData?.submissions || [];

  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientSlug, setClientSlug] = useState("");
  const [clientCompanyName, setClientCompanyName] = useState("");
  const [clientLogoUrl, setClientLogoUrl] = useState("");
  const [clientAccentColor, setClientAccentColor] = useState("");
  const [clientAssessmentId, setClientAssessmentId] = useState("");

  const { data: assessmentClientsData } = useQuery<{
    clients: Array<{
      id: number;
      slug: string;
      companyName: string;
      logoUrl: string | null;
      accentColor: string | null;
      assessmentId: number;
      createdAt: string;
      submissionCount: number;
    }>;
  }>({
    queryKey: ["/api/admin/assessment-clients"],
    queryFn: () => adminGet("/api/admin/assessment-clients"),
    enabled: isAuthenticated,
  });

  const assessmentClientsList = assessmentClientsData?.clients || [];

  const createClientMutation = useMutation({
    mutationFn: async (data: {
      slug: string;
      companyName: string;
      logoUrl: string;
      accentColor: string;
      assessmentId: string;
    }) => {
      const res = await fetch("/api/admin/assessment-clients", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/assessment-clients"],
      });
      setClientDialogOpen(false);
      setClientSlug("");
      setClientCompanyName("");
      setClientLogoUrl("");
      setClientAccentColor("");
      setClientAssessmentId("");
      toast({
        title: "Client Created",
        description: "Branded assessment URL is now active",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/assessment-clients/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/assessment-clients"],
      });
      toast({ title: "Client Removed" });
    },
  });

  const [linkedinFollowers, setLinkedinFollowers] = useState("");
  const [linkedinHeadline, setLinkedinHeadline] = useState("");
  const [linkedinProfileUrl, setLinkedinProfileUrl] = useState("");
  const [linkedinPost1, setLinkedinPost1] = useState("");
  const [linkedinPost2, setLinkedinPost2] = useState("");
  const [linkedinPost3, setLinkedinPost3] = useState("");
  const [linkedinSettingsLoaded, setLinkedinSettingsLoaded] = useState(false);

  const { data: siteSettingsData } = useQuery<{
    settings: Record<string, string>;
  }>({
    queryKey: ["/api/site-settings"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (siteSettingsData?.settings && !linkedinSettingsLoaded) {
      const s = siteSettingsData.settings;
      setLinkedinFollowers(s["linkedin_followers"] || "");
      setLinkedinHeadline(s["linkedin_headline"] || "");
      setLinkedinProfileUrl(s["linkedin_profile_url"] || "");
      setLinkedinPost1(s["linkedin_post_1"] || "");
      setLinkedinPost2(s["linkedin_post_2"] || "");
      setLinkedinPost3(s["linkedin_post_3"] || "");
      setLinkedinSettingsLoaded(true);
    }
  }, [siteSettingsData, linkedinSettingsLoaded]);

  const saveLinkedinMutation = useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({ title: "LinkedIn Settings Saved" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: invitesData } = useQuery<{
    invites: Array<{
      id: number;
      token: string;
      candidateName: string;
      candidateEmail: string;
      sentAt: string | null;
      usedAt: string | null;
    }>;
  }>({
    queryKey: ["/api/assessments", selectedAssessmentId, "invites"],
    queryFn: () => adminGet(`/api/assessments/${selectedAssessmentId}/invites`),
    enabled: isAuthenticated && selectedAssessmentId !== null,
  });

  const assessmentInvites = invitesData?.invites || [];

  const sendInviteMutation = useMutation({
    mutationFn: async ({
      assessmentId,
      candidateName,
      candidateEmail,
    }: {
      assessmentId: number;
      candidateName: string;
      candidateEmail: string;
    }) => {
      const res = await fetch(`/api/assessments/${assessmentId}/invites`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateName, candidateEmail }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send invite");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/assessments", selectedAssessmentId, "invites"],
      });
      setInviteDialogOpen(false);
      setInviteName("");
      setInviteEmail("");
      toast({
        title: "Invite Sent",
        description: "Assessment invite email sent to candidate",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyAssessmentLink = (assessmentId: number) => {
    const link = `${window.location.origin}/assessment/${assessmentId}`;
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "Link Copied",
        description: "Assessment link copied to clipboard",
      });
    });
  };

  const handleAddQuestion = () => {
    const data: any = {
      type: questionType,
      text: questionText,
      displayOrder: assessmentQuestions.length,
    };
    if (questionType === "quiz") {
      data.options = questionOptions.filter((o) => o.trim());
      data.correctAnswer = questionCorrectAnswer;
    }
    addQuestionMutation.mutate(data);
  };

  const [sendRequestDialogOpen, setSendRequestDialogOpen] = useState(false);
  const [requestEmail, setRequestEmail] = useState("");
  const [requestName, setRequestName] = useState("");
  const [requestDocTypes, setRequestDocTypes] = useState<string[]>([]);

  const AVAILABLE_DOC_TYPES = [
    "HIPAA Business Associate Agreement",
    "Services Contract Agreement",
    "Non-Disclosure Agreement (NDA)",
    "EMR/Data Access Agreement",
    "Conflict of Interest Disclosure",
    "Liability Waiver / Hold Harmless Agreement",
    "Testimonial / Case Study Release",
  ];

  const sendRequestMutation = useMutation({
    mutationFn: async (data: {
      recipientEmail: string;
      recipientName: string;
      documentTypes: string[];
    }) => {
      const res = await fetch("/api/agreement-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agreement-requests"] });
      setSendRequestDialogOpen(false);
      setRequestEmail("");
      setRequestName("");
      setRequestDocTypes([]);
      toast({
        title: "Request Sent",
        description: "Signing request email sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send request",
        variant: "destructive",
      });
    },
  });

  const resendRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/agreement-requests/${id}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to resend");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Resent", description: "Signing request email resent." });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resend request.",
        variant: "destructive",
      });
    },
  });

  const handleDownloadPdf = async (
    agreementId: number,
    agreementType: string,
  ) => {
    try {
      const res = await fetch(`/api/signed-agreements/${agreementId}/pdf`, {
        headers: {},
        credentials: "include",
      });
      if (!res.ok) throw new Error("PDF not available");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${agreementType.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-signed.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Error",
        description: "PDF not available for download.",
        variant: "destructive",
      });
    }
  };

  // Leads email dialog state
  const [leadEmailDialogOpen, setLeadEmailDialogOpen] = useState(false);
  const [leadEmailTarget, setLeadEmailTarget] = useState<{
    email: string;
    name: string;
  } | null>(null);
  const [leadEmailSubject, setLeadEmailSubject] = useState("");
  const [leadEmailBody, setLeadEmailBody] = useState("");

  const sendLeadEmailMutation = useMutation({
    mutationFn: async ({
      to,
      name,
      subject,
      body,
    }: {
      to: string;
      name: string;
      subject: string;
      body: string;
    }) => {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to, name, subject, body }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send email");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: `Message sent to ${leadEmailTarget?.email}`,
      });
      setLeadEmailDialogOpen(false);
      setLeadEmailSubject("");
      setLeadEmailBody("");
    },
    onError: (error: any) => {
      toast({
        title: "Send failed",
        description: error.message || "Could not send email.",
        variant: "destructive",
      });
    },
  });

  // Group leads by email for the Leads tab
  const groupedLeads = (() => {
    const map = new Map<
      string,
      {
        name: string;
        email: string;
        firstSeen: number;
        tools: string[];
        interactions: number;
      }
    >();
    resourceLeads.forEach((lead) => {
      const key = lead.email.toLowerCase();
      const existing = map.get(key);
      const ts = lead.capturedAt
        ? new Date(lead.capturedAt).getTime()
        : Date.now();
      if (!existing) {
        map.set(key, {
          name: lead.name,
          email: lead.email,
          firstSeen: ts,
          tools: [lead.resourceTitle],
          interactions: 1,
        });
      } else {
        if (ts < existing.firstSeen) existing.firstSeen = ts;
        if (!existing.tools.includes(lead.resourceTitle))
          existing.tools.push(lead.resourceTitle);
        existing.interactions += 1;
      }
    });
    usageEvents.forEach((ev) => {
      const key = ev.email.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        if (!existing.tools.includes(ev.toolName))
          existing.tools.push(ev.toolName);
        existing.interactions += 1;
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => b.interactions - a.interactions,
    );
  })();

  // Newsletter broadcast state
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");

  const broadcastMutation = useMutation({
    mutationFn: async ({
      subject,
      body,
    }: {
      subject: string;
      body: string;
    }) => {
      const res = await fetch("/api/newsletter/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, body }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send broadcast");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Newsletter sent",
        description: `Delivered to ${data.sent} subscriber${data.sent !== 1 ? "s" : ""}${data.failed > 0 ? ` (${data.failed} failed)` : ""}.`,
      });
      setBroadcastSubject("");
      setBroadcastBody("");
    },
    onError: (error: any) => {
      toast({
        title: "Send failed",
        description: error.message || "Could not send newsletter",
        variant: "destructive",
      });
    },
  });

  // Article form state
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<SelectArticle | null>(
    null,
  );
  const [articleForm, setArticleForm] = useState({
    title: "",
    description: "",
    linkedinUrl: "",
    publishDate: new Date().toISOString().split("T")[0],
    featured: false,
    pdfUrl: "",
  });

  // Create article mutation
  const createArticleMutation = useMutation({
    mutationFn: async (data: InsertArticle) => {
      return await apiRequest("POST", "/api/articles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      setArticleDialogOpen(false);
      resetArticleForm();
      toast({
        title: "Article Created",
        description: "The article has been successfully published",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create article",
        variant: "destructive",
      });
    },
  });

  // Update article mutation
  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertArticle }) => {
      return await apiRequest("PUT", `/api/articles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      setArticleDialogOpen(false);
      setEditingArticle(null);
      resetArticleForm();
      toast({
        title: "Article Updated",
        description: "The article has been successfully updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update article",
        variant: "destructive",
      });
    },
  });

  // Delete article mutation
  const deleteArticleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Article Deleted",
        description: "The article has been successfully removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete article",
        variant: "destructive",
      });
    },
  });

  const resetArticleForm = () => {
    setArticleForm({
      title: "",
      description: "",
      linkedinUrl: "",
      publishDate: new Date().toISOString().split("T")[0],
      featured: false,
      pdfUrl: "",
    });
  };

  const handleEditArticle = (article: SelectArticle) => {
    setEditingArticle(article);
    // Convert timestamp to date string - handle both number and Date types
    const date = new Date(
      typeof article.publishDate === "number"
        ? article.publishDate
        : parseInt(String(article.publishDate)),
    );
    setArticleForm({
      title: article.title,
      description: article.description,
      linkedinUrl: article.linkedinUrl,
      publishDate: date.toISOString().split("T")[0],
      featured: article.featured,
      pdfUrl: article.pdfUrl || "",
    });
    setArticleDialogOpen(true);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();

    const data: InsertArticle = {
      title: articleForm.title,
      description: articleForm.description,
      linkedinUrl: articleForm.linkedinUrl,
      publishDate: new Date(articleForm.publishDate).getTime(),
      featured: articleForm.featured,
      pdfUrl: articleForm.pdfUrl || undefined,
    };

    if (editingArticle) {
      updateArticleMutation.mutate({ id: editingArticle.id, data });
    } else {
      createArticleMutation.mutate(data);
    }
  };

  // PDF Upload handlers
  const handleGetPDFUploadParams = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handlePDFUploadComplete = async (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
  ) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      if (uploadURL) {
        try {
          const response = await fetch("/api/articles/normalize-pdf", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uploadURL }),
          });

          if (!response.ok) {
            throw new Error("Failed to normalize PDF path");
          }

          const data = await response.json();
          const normalizedPath = data.normalizedPath;

          setArticleForm({ ...articleForm, pdfUrl: normalizedPath });
          toast({
            title: "PDF Uploaded",
            description:
              "PDF has been successfully uploaded and is ready to use",
          });
        } catch (error) {
          console.error("Error normalizing PDF path:", error);
          toast({
            title: "Error",
            description: "Failed to process uploaded PDF",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleDeleteArticle = (id: number) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      deleteArticleMutation.mutate(id);
    }
  };

  // Resource form state (HSP-25 architecture fields optional)
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    category: "",
    fileUrl: "",
    whenToUse: "",
    whyItMatters: "",
    expectedOutcome: "",
    experienceLevel: "all",
    clinicalSensitivity: "none",
    premiumRule: "public",
    jobToAccomplish: "",
    author: "",
    contentOwner: "",
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (data: InsertResource) => {
      const response = await fetch("/api/resources", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to create resource");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      resetResourceForm();
      toast({
        title: "Resource Created",
        description: "The resource has been successfully added",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create resource",
        variant: "destructive",
      });
    },
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertResource }) => {
      const response = await fetch(`/api/resources/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to update resource");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Resource Updated",
        description: "The resource has been successfully updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update resource",
        variant: "destructive",
      });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/resources/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to delete resource");
      }

      // Handle successful deletion - parse JSON if present
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Resource Deleted",
        description: "The resource has been successfully removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  // State to track editing resource
  const [editingResource, setEditingResource] = useState<SelectResource | null>(
    null,
  );

  const resetResourceForm = () => {
    setResourceForm({
      title: "",
      description: "",
      category: "",
      fileUrl: "",
      whenToUse: "",
      whyItMatters: "",
      expectedOutcome: "",
      experienceLevel: "all",
      clinicalSensitivity: "none",
      premiumRule: "public",
      jobToAccomplish: "",
      author: "",
      contentOwner: "",
    });
    setEditingResource(null);
  };

  const handleEditResource = (resource: SelectResource) => {
    setEditingResource(resource);
    const arch =
      (resource as SelectResource & {
        architecture?: Record<string, unknown>;
        contentArchitecture?: Record<string, unknown> | null;
      }).architecture ||
      resource.contentArchitecture ||
      {};
    setResourceForm({
      title: resource.title,
      description: resource.description || "",
      category: resource.category,
      fileUrl: resource.fileUrl,
      whenToUse: String(arch.whenToUse || ""),
      whyItMatters: String(arch.whyItMatters || ""),
      expectedOutcome: String(arch.expectedOutcome || ""),
      experienceLevel: String(arch.experienceLevel || "all"),
      clinicalSensitivity: String(arch.clinicalSensitivity || "none"),
      premiumRule: String(arch.premiumRule || "public"),
      jobToAccomplish: String(arch.jobToAccomplish || ""),
      author: String(arch.author || ""),
      contentOwner: String(arch.contentOwner || ""),
    });
  };

  const handleSaveResource = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !resourceForm.title ||
      !resourceForm.category ||
      !resourceForm.fileUrl
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and upload a file",
        variant: "destructive",
      });
      return;
    }

    const data: InsertResource = {
      title: resourceForm.title,
      description: resourceForm.description || undefined,
      category: resourceForm.category,
      fileUrl: resourceForm.fileUrl,
      contentArchitecture: {
        whenToUse: resourceForm.whenToUse || undefined,
        whyItMatters: resourceForm.whyItMatters || undefined,
        expectedOutcome: resourceForm.expectedOutcome || undefined,
        experienceLevel: resourceForm.experienceLevel || undefined,
        clinicalSensitivity: resourceForm.clinicalSensitivity as
          | "none"
          | "educational"
          | "clinical_adjacent"
          | "restricted",
        premiumRule: resourceForm.premiumRule as
          | "public"
          | "field_kit"
          | "premium"
          | "org_only",
        jobToAccomplish: resourceForm.jobToAccomplish || undefined,
        author: resourceForm.author || undefined,
        contentOwner: resourceForm.contentOwner || undefined,
        status: "published",
        organizationVisibility: "all",
      },
    };

    if (editingResource) {
      updateResourceMutation.mutate({ id: editingResource.id, data });
    } else {
      createResourceMutation.mutate(data);
    }
  };

  // Resource PDF Upload handlers
  const handleGetResourceUploadParams = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleResourceUploadComplete = async (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;

      const response = await fetch("/api/articles/normalize-pdf", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadURL }),
      });

      if (!response.ok) {
        throw new Error("Failed to normalize PDF path");
      }

      const data = await response.json();
      setResourceForm((prev) => ({ ...prev, fileUrl: data.normalizedPath }));

      toast({
        title: "Upload Complete",
        description: "Resource file has been successfully uploaded",
      });
    }
  };

  const handleDeleteResource = (id: number) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      deleteResourceMutation.mutate(id);
    }
  };

  // Podcast form state
  const [podcastForm, setPodcastForm] = useState({
    title: "",
    description: "",
    episodeNumber: "",
    duration: "",
    publishDate: new Date().toISOString().split("T")[0],
    audioUrl: "",
  });

  // Create podcast mutation
  const createPodcastMutation = useMutation({
    mutationFn: async (data: InsertPodcast) => {
      const response = await fetch("/api/podcasts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to create podcast");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] });
      resetPodcastForm();
      toast({
        title: "Podcast Created",
        description: "The podcast episode has been successfully added",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create podcast",
        variant: "destructive",
      });
    },
  });

  // Update podcast mutation
  const updatePodcastMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertPodcast }) => {
      const response = await fetch(`/api/podcasts/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to update podcast");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] });
      toast({
        title: "Podcast Updated",
        description: "The podcast episode has been successfully updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update podcast",
        variant: "destructive",
      });
    },
  });

  // Delete podcast mutation
  const deletePodcastMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/podcasts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to delete podcast");
      }

      // Handle successful deletion - parse JSON if present
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] });
      toast({
        title: "Podcast Deleted",
        description: "The podcast episode has been successfully removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete podcast",
        variant: "destructive",
      });
    },
  });

  // State to track editing podcast
  const [editingPodcast, setEditingPodcast] = useState<SelectPodcast | null>(
    null,
  );

  const resetPodcastForm = () => {
    setPodcastForm({
      title: "",
      description: "",
      episodeNumber: "",
      duration: "",
      publishDate: new Date().toISOString().split("T")[0],
      audioUrl: "",
    });
    setEditingPodcast(null);
  };

  const handleEditPodcast = (podcast: SelectPodcast) => {
    setEditingPodcast(podcast);
    // Convert timestamp to date string - handle both number and Date types
    const date = new Date(
      typeof podcast.publishDate === "string" ||
        podcast.publishDate instanceof Date
        ? podcast.publishDate
        : parseInt(String(podcast.publishDate)),
    );
    setPodcastForm({
      title: podcast.title,
      description: podcast.description || "",
      episodeNumber: podcast.episodeNumber ? String(podcast.episodeNumber) : "",
      duration: podcast.duration || "",
      publishDate: date.toISOString().split("T")[0],
      audioUrl: podcast.audioUrl ?? "",
    });
  };

  const handleSavePodcast = (e: React.FormEvent) => {
    e.preventDefault();

    if (!podcastForm.title || !podcastForm.audioUrl) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and upload an audio file",
        variant: "destructive",
      });
      return;
    }

    const data: InsertPodcast = {
      title: podcastForm.title,
      description: podcastForm.description || undefined,
      episodeNumber: podcastForm.episodeNumber
        ? parseInt(podcastForm.episodeNumber)
        : undefined,
      duration: podcastForm.duration || undefined,
      audioUrl: podcastForm.audioUrl,
    };

    if (editingPodcast) {
      updatePodcastMutation.mutate({ id: editingPodcast.id, data });
    } else {
      createPodcastMutation.mutate(data);
    }
  };

  // Podcast audio upload handlers
  const handleGetAudioUploadParams = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleAudioUploadComplete = async (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;

      const response = await fetch("/api/articles/normalize-pdf", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadURL }),
      });

      if (!response.ok) {
        throw new Error("Failed to normalize audio path");
      }

      const data = await response.json();
      setPodcastForm((prev) => ({ ...prev, audioUrl: data.normalizedPath }));

      toast({
        title: "Upload Complete",
        description: "Audio file has been successfully uploaded",
      });
    }
  };

  const handleDeletePodcast = (id: number) => {
    if (
      window.confirm("Are you sure you want to delete this podcast episode?")
    ) {
      deletePodcastMutation.mutate(id);
    }
  };

  // Testimonial state
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<SelectTestimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    name: "",
    title: "",
    company: "",
    quote: "",
    outcome: "",
    category: "individual",
    featured: false,
    displayOrder: 0,
  });
  const [expandedAgreement, setExpandedAgreement] = useState<number | null>(
    null,
  );

  const adminMutate = async (method: string, url: string, data?: unknown) => {
    const res = await fetch(url, {
      credentials: "include",
      method,
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const createTestimonialMutation = useMutation({
    mutationFn: async (data: InsertTestimonial) =>
      adminMutate("POST", "/api/testimonials", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      setTestimonialDialogOpen(false);
      setEditingTestimonial(null);
      setTestimonialForm({
        name: "",
        title: "",
        company: "",
        quote: "",
        outcome: "",
        category: "individual",
        featured: false,
        displayOrder: 0,
      });
      toast({ title: "Testimonial saved" });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to save testimonial",
        variant: "destructive",
      }),
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertTestimonial>;
    }) => adminMutate("PUT", `/api/testimonials/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      setTestimonialDialogOpen(false);
      setEditingTestimonial(null);
      toast({ title: "Testimonial updated" });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to update testimonial",
        variant: "destructive",
      }),
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (id: number) =>
      adminMutate("DELETE", `/api/testimonials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      toast({ title: "Testimonial deleted" });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to delete testimonial",
        variant: "destructive",
      }),
  });

  const handleEditTestimonial = (t: SelectTestimonial) => {
    setEditingTestimonial(t);
    setTestimonialForm({
      name: t.name,
      title: t.title,
      company: t.company,
      quote: t.quote,
      outcome: t.outcome,
      category: t.category,
      featured: t.featured,
      displayOrder: t.displayOrder,
    });
    setTestimonialDialogOpen(true);
  };

  const handleSaveTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTestimonial) {
      updateTestimonialMutation.mutate({
        id: editingTestimonial.id,
        data: testimonialForm,
      });
    } else {
      createTestimonialMutation.mutate(testimonialForm);
    }
  };

  // Case study state
  const [caseStudyDialogOpen, setCaseStudyDialogOpen] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] =
    useState<SelectCaseStudy | null>(null);
  const [caseStudyForm, setCaseStudyForm] = useState({
    title: "",
    clientLabel: "",
    challenge: "",
    solution: "",
    results: "",
    category: "individual",
    displayOrder: 0,
  });

  const createCaseStudyMutation = useMutation({
    mutationFn: async (data: InsertCaseStudy) =>
      adminMutate("POST", "/api/case-studies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/case-studies"] });
      setCaseStudyDialogOpen(false);
      setEditingCaseStudy(null);
      setCaseStudyForm({
        title: "",
        clientLabel: "",
        challenge: "",
        solution: "",
        results: "",
        category: "individual",
        displayOrder: 0,
      });
      toast({ title: "Case study saved" });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to save case study",
        variant: "destructive",
      }),
  });

  const updateCaseStudyMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertCaseStudy>;
    }) => adminMutate("PUT", `/api/case-studies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/case-studies"] });
      setCaseStudyDialogOpen(false);
      setEditingCaseStudy(null);
      toast({ title: "Case study updated" });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to update case study",
        variant: "destructive",
      }),
  });

  const deleteCaseStudyMutation = useMutation({
    mutationFn: async (id: number) =>
      adminMutate("DELETE", `/api/case-studies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/case-studies"] });
      toast({ title: "Case study deleted" });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to delete case study",
        variant: "destructive",
      }),
  });

  const handleEditCaseStudy = (s: SelectCaseStudy) => {
    setEditingCaseStudy(s);
    setCaseStudyForm({
      title: s.title,
      clientLabel: s.clientLabel,
      challenge: s.challenge,
      solution: s.solution,
      results: s.results.join("\n"),
      category: s.category,
      displayOrder: s.displayOrder,
    });
    setCaseStudyDialogOpen(true);
  };

  const handleSaveCaseStudy = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...caseStudyForm,
      results: caseStudyForm.results
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
    };
    if (editingCaseStudy) {
      updateCaseStudyMutation.mutate({ id: editingCaseStudy.id, data });
    } else {
      createCaseStudyMutation.mutate(data);
    }
  };

  // Platform administration requires a normal authenticated session.
  if (!isAuthenticated) {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              Administrator sign-in required
            </DialogTitle>
            <DialogDescription className="text-center">
              Sign in with an active platform administrator account to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Button asChild className="w-full bg-spartan-gradient hover:glow-primary">
              <Link href="/login">Go to secure sign-in</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Shared passcode access has been retired.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <SEO />
      <div className="flex items-center justify-between mb-8">
        <BackButton />
        <Button
          variant="outline"
          onClick={handleLogout}
          className="gap-2"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-5xl font-black mb-4" data-testid="text-admin-title">
          Admin Dashboard
        </h1>
        <p className="text-xl text-muted-foreground">
          Manage inquiries, subscribers, articles, resources, podcasts,
          testimonials, and more
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Visitor Statistics</h2>
        {analyticsLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Loading visitor statistics...
            </p>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card data-testid="card-visitors-day">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-3xl font-bold"
                  data-testid="text-visitors-day"
                >
                  {analytics.day}
                </div>
                <p className="text-xs text-muted-foreground mt-1">visitors</p>
              </CardContent>
            </Card>

            <Card data-testid="card-visitors-week">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-3xl font-bold"
                  data-testid="text-visitors-week"
                >
                  {analytics.week}
                </div>
                <p className="text-xs text-muted-foreground mt-1">visitors</p>
              </CardContent>
            </Card>

            <Card data-testid="card-visitors-month">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-3xl font-bold"
                  data-testid="text-visitors-month"
                >
                  {analytics.month}
                </div>
                <p className="text-xs text-muted-foreground mt-1">visitors</p>
              </CardContent>
            </Card>

            <Card data-testid="card-visitors-quarter">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Quarter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-3xl font-bold"
                  data-testid="text-visitors-quarter"
                >
                  {analytics.quarter}
                </div>
                <p className="text-xs text-muted-foreground mt-1">visitors</p>
              </CardContent>
            </Card>

            <Card data-testid="card-visitors-year">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Year
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-3xl font-bold"
                  data-testid="text-visitors-year"
                >
                  {analytics.year}
                </div>
                <p className="text-xs text-muted-foreground mt-1">visitors</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No visitor data available</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Event Analytics</h2>

        {aiUsageData && (
          <div className="mb-4">
            <Card data-testid="card-ai-daily-usage">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  AI Calls Today (Rate-Limited)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span
                    className="text-3xl font-bold"
                    data-testid="text-ai-calls-today"
                  >
                    {aiUsageData.count}
                  </span>
                  <span className="text-muted-foreground mb-0.5">
                    / {aiUsageData.cap}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((aiUsageData.count / aiUsageData.cap) * 100, 100)}%`,
                      backgroundColor:
                        aiUsageData.count / aiUsageData.cap > 0.8
                          ? "hsl(var(--destructive))"
                          : "hsl(var(--primary))",
                    }}
                    data-testid="progress-ai-usage"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Resets at midnight · Refreshes every 30s
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {eventAnalyticsLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading event analytics...</p>
          </div>
        ) : eventAnalyticsData?.analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-ai-tool-usage">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  AI Tool Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventAnalyticsData.analytics.aiToolUsage.length > 0 ? (
                  <div className="space-y-2">
                    {eventAnalyticsData.analytics.aiToolUsage.map((item) => (
                      <div
                        key={item.eventName}
                        className="flex items-center justify-between"
                        data-testid={`ai-tool-${item.eventName}`}
                      >
                        <span className="text-sm capitalize">
                          {item.eventName.replace(/_/g, " ")}
                        </span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No AI tool usage recorded yet
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-resource-downloads">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Resource Downloads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventAnalyticsData.analytics.resourceDownloads.length > 0 ? (
                  <div className="space-y-2">
                    {eventAnalyticsData.analytics.resourceDownloads.map(
                      (item) => (
                        <div
                          key={item.eventName}
                          className="flex items-center justify-between gap-2"
                          data-testid={`resource-download-${item.eventName}`}
                        >
                          <span className="text-sm truncate">
                            {item.eventName}
                          </span>
                          <Badge variant="secondary" className="shrink-0">
                            {item.count}
                          </Badge>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No resource downloads recorded yet
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-contact-submissions">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Contact Form Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-3xl font-bold"
                  data-testid="text-contact-submissions"
                >
                  {eventAnalyticsData.analytics.contactSubmissions}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  total submissions tracked
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-mobile-ai-tool-usage">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mobile AI Tool Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventAnalyticsData.analytics.mobileAiToolUsage.length > 0 ? (
                  <div className="space-y-2">
                    {eventAnalyticsData.analytics.mobileAiToolUsage.map((item) => (
                      <div
                        key={item.eventName}
                        className="flex items-center justify-between"
                        data-testid={`mobile-ai-tool-${item.eventName}`}
                      >
                        <span className="text-sm capitalize">
                          {item.eventName.replace(/_/g, " ")}
                        </span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No mobile AI tool usage recorded yet
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-mobile-tool-views">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mobile Browse Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventAnalyticsData.analytics.mobileToolViews.length > 0 ? (
                  <div className="space-y-2">
                    {eventAnalyticsData.analytics.mobileToolViews.map((item) => (
                      <div
                        key={item.eventName}
                        className="flex items-center justify-between"
                        data-testid={`mobile-tool-view-${item.eventName}`}
                      >
                        <span className="text-sm capitalize">
                          {item.eventName.replace(/_/g, " ")}
                        </span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No mobile browse views recorded yet
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-mobile-app-opens">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mobile App Opens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-mobile-app-opens-day"
                    >
                      {eventAnalyticsData.analytics.mobileAppOpens.day}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Today</p>
                  </div>
                  <div>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-mobile-app-opens-week"
                    >
                      {eventAnalyticsData.analytics.mobileAppOpens.week}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">7 days</p>
                  </div>
                  <div>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-mobile-app-opens-month"
                    >
                      {eventAnalyticsData.analytics.mobileAppOpens.month}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">30 days</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  device launches by time window
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No event data available</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild size="sm" className="font-bold gap-1.5" data-testid="link-open-access-desk">
          <a href="/admin/access-desk">
            <KeyRound className="w-3.5 h-3.5" />
            Open Access Desk (fast)
          </a>
        </Button>
        <p className="text-xs text-muted-foreground self-center">
          Prefer the dedicated ops page — loads without the full CMS.
        </p>
      </div>

      <Tabs defaultValue="access" className="space-y-6">
        <TabsList className="flex w-full max-w-6xl overflow-x-auto">
          <TabsTrigger
            value="access"
            data-testid="tab-access"
            className="gap-2"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Access Desk
          </TabsTrigger>
          <TabsTrigger
            value="inquiries"
            data-testid="tab-inquiries"
            className="gap-2"
          >
            Inquiries ({inquiries.length})
            {inquiries.filter((i) => !i.isRead).length > 0 && (
              <Badge
                variant="destructive"
                className="text-xs px-1.5 py-0 h-5 min-w-[1.25rem]"
              >
                {inquiries.filter((i) => !i.isRead).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="subscribers" data-testid="tab-subscribers">
            Subscribers ({subscribers.length})
          </TabsTrigger>
          <TabsTrigger value="articles" data-testid="tab-articles">
            Articles ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="resources" data-testid="tab-resources">
            Resources ({resources.length})
          </TabsTrigger>
          <TabsTrigger value="podcasts" data-testid="tab-podcasts">
            Podcasts ({podcasts.length})
          </TabsTrigger>
          <TabsTrigger value="testimonials" data-testid="tab-testimonials">
            Testimonials ({testimonialsList.length})
          </TabsTrigger>
          <TabsTrigger value="agreements" data-testid="tab-agreements">
            Agreements ({agreements.length})
          </TabsTrigger>
          <TabsTrigger value="roleplay" data-testid="tab-roleplay">
            Role-Play ({roleplaySessions.length})
          </TabsTrigger>
          <TabsTrigger value="drills" data-testid="tab-drills">
            Drills ({drillCompletions.length})
          </TabsTrigger>
          <TabsTrigger value="leads" data-testid="tab-leads" className="gap-2">
            Leads ({groupedLeads.length})
            {groupedLeads.filter((l) => l.interactions >= 3).length > 0 && (
              <Badge
                variant="destructive"
                className="text-xs px-1.5 py-0 h-5 min-w-[1.25rem]"
              >
                {groupedLeads.filter((l) => l.interactions >= 3).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assessments" data-testid="tab-assessments">
            Assessments ({assessmentsList.length})
          </TabsTrigger>
          <TabsTrigger value="linkedin" data-testid="tab-linkedin">
            LinkedIn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-4">
          <AccessDesk />
        </TabsContent>

        <TabsContent value="inquiries" className="space-y-4">
          {inquiriesLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading inquiries...</p>
            </div>
          ) : inquiries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No inquiries yet</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  data-testid="button-export-inquiries"
                  onClick={() =>
                    downloadCSV(
                      [
                        [
                          "Date",
                          "Name",
                          "Email",
                          "Phone",
                          "Company",
                          "Service",
                          "Message",
                        ],
                        ...inquiries.map((i) => [
                          new Date(i.submittedAt).toLocaleDateString(),
                          i.name,
                          i.email,
                          i.phone,
                          i.company || "",
                          i.serviceType || "",
                          i.message,
                        ]),
                      ],
                      `inquiries-${new Date().toISOString().slice(0, 10)}.csv`,
                    )
                  }
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
              {inquiries.map((inquiry) => (
                <Card
                  key={inquiry.id}
                  data-testid={`inquiry-${inquiry.id}`}
                  className={inquiry.isRead ? "" : "border-primary/50"}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-start gap-3 min-w-0">
                        {!inquiry.isRead && (
                          <div
                            className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0"
                            data-testid={`dot-unread-${inquiry.id}`}
                          />
                        )}
                        <div className="min-w-0">
                          <CardTitle className="text-2xl">
                            {inquiry.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(inquiry.submittedAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {inquiry.serviceType && (
                          <Badge variant="secondary">
                            {inquiry.serviceType}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs"
                          data-testid={`button-mark-read-${inquiry.id}`}
                          disabled={markReadMutation.isPending}
                          onClick={() =>
                            markReadMutation.mutate({
                              id: inquiry.id,
                              isRead: !inquiry.isRead,
                            })
                          }
                        >
                          {inquiry.isRead ? (
                            <>
                              <Circle className="w-3.5 h-3.5" />
                              Mark Unread
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-primary" />
                              Mark Read
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={`mailto:${inquiry.email}`}
                        className="hover:underline"
                      >
                        {inquiry.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={`tel:${inquiry.phone}`}
                        className="hover:underline"
                      >
                        {inquiry.phone}
                      </a>
                    </div>
                    {inquiry.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        {inquiry.company}
                      </div>
                    )}
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {inquiry.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          {/* Newsletter Broadcast */}
          <Card data-testid="card-newsletter-broadcast">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send Newsletter
              </CardTitle>
              <CardDescription>
                Compose and send an email to all {subscribers.length} subscriber
                {subscribers.length !== 1 ? "s" : ""}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="broadcast-subject">Subject</Label>
                <Input
                  id="broadcast-subject"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Weekly Coaching Tip: Territory Planning"
                  data-testid="input-broadcast-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="broadcast-body">Message</Label>
                <Textarea
                  id="broadcast-body"
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Write your newsletter content here. Each line break becomes a new paragraph."
                  rows={6}
                  data-testid="textarea-broadcast-body"
                />
              </div>
              <Button
                onClick={() =>
                  broadcastMutation.mutate({
                    subject: broadcastSubject,
                    body: broadcastBody,
                  })
                }
                disabled={
                  broadcastMutation.isPending ||
                  subscribers.length === 0 ||
                  broadcastSubject.trim().length < 3 ||
                  broadcastBody.trim().length < 10
                }
                data-testid="button-send-broadcast"
              >
                {broadcastMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to {subscribers.length} Subscriber
                    {subscribers.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {subscribersLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading subscribers...</p>
            </div>
          ) : subscribers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No subscribers yet</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  data-testid="button-export-subscribers"
                  onClick={() =>
                    downloadCSV(
                      [
                        ["Date", "Email"],
                        ...subscribers.map((s) => [
                          new Date(s.subscribedAt).toLocaleDateString(),
                          s.email,
                        ]),
                      ],
                      `subscribers-${new Date().toISOString().slice(0, 10)}.csv`,
                    )
                  }
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Newsletter Subscribers
                  </CardTitle>
                  <CardDescription>
                    {subscribers.length} active subscribers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subscribers.map((subscriber) => (
                      <div
                        key={subscriber.id}
                        className="flex items-center justify-between p-3 rounded-lg hover-elevate"
                        data-testid={`subscriber-${subscriber.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{subscriber.email}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(
                            subscriber.subscribedAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Manage Articles</h2>
            <Button
              onClick={() => {
                setEditingArticle(null);
                resetArticleForm();
                setArticleDialogOpen(true);
              }}
              className="gap-2"
              data-testid="button-add-article"
            >
              <Plus className="w-4 h-4" />
              Add Article
            </Button>
          </div>

          {articlesLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No articles yet. Click "Add Article" to create your first
                  article.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <Card key={article.id} data-testid={`article-${article.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">
                            {article.title}
                          </CardTitle>
                          {article.featured && (
                            <Badge variant="default" className="gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(article.publishDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditArticle(article)}
                          data-testid={`button-edit-article-${article.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteArticle(article.id)}
                          disabled={deleteArticleMutation.isPending}
                          data-testid={`button-delete-article-${article.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={article.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View on LinkedIn
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Manage Resources</h2>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Resource</CardTitle>
              <CardDescription>
                Upload training materials, templates, scripts, and checklists
                for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveResource} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resource-title">Title *</Label>
                  <Input
                    id="resource-title"
                    value={resourceForm.title}
                    onChange={(e) =>
                      setResourceForm({
                        ...resourceForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Cold Call Script Template"
                    required
                    data-testid="input-resource-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resource-description">Description</Label>
                  <Textarea
                    id="resource-description"
                    value={resourceForm.description}
                    onChange={(e) =>
                      setResourceForm({
                        ...resourceForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description of this resource"
                    rows={3}
                    data-testid="input-resource-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resource-category">Category *</Label>
                  <Select
                    value={resourceForm.category}
                    onValueChange={(value) =>
                      setResourceForm({ ...resourceForm, category: value })
                    }
                  >
                    <SelectTrigger
                      id="resource-category"
                      data-testid="select-resource-category"
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="script">Script</SelectItem>
                      <SelectItem value="checklist">Checklist</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resource-when">When to use</Label>
                    <Textarea
                      id="resource-when"
                      value={resourceForm.whenToUse}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          whenToUse: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="When a rep should open this"
                      data-testid="input-resource-when-to-use"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resource-outcome">Expected outcome</Label>
                    <Textarea
                      id="resource-outcome"
                      value={resourceForm.expectedOutcome}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          expectedOutcome: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="What success looks like"
                      data-testid="input-resource-expected-outcome"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resource-why">Why it matters</Label>
                  <Textarea
                    id="resource-why"
                    value={resourceForm.whyItMatters}
                    onChange={(e) =>
                      setResourceForm({
                        ...resourceForm,
                        whyItMatters: e.target.value,
                      })
                    }
                    rows={2}
                    data-testid="input-resource-why-it-matters"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Experience level</Label>
                    <Select
                      value={resourceForm.experienceLevel}
                      onValueChange={(value) =>
                        setResourceForm({
                          ...resourceForm,
                          experienceLevel: value,
                        })
                      }
                    >
                      <SelectTrigger data-testid="select-resource-experience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All levels</SelectItem>
                        <SelectItem value="new_hire">New hire</SelectItem>
                        <SelectItem value="experienced">Experienced</SelectItem>
                        <SelectItem value="leader">Leader</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Clinical sensitivity</Label>
                    <Select
                      value={resourceForm.clinicalSensitivity}
                      onValueChange={(value) =>
                        setResourceForm({
                          ...resourceForm,
                          clinicalSensitivity: value,
                        })
                      }
                    >
                      <SelectTrigger data-testid="select-resource-clinical">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="clinical_adjacent">
                          Clinical adjacent
                        </SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Premium rule</Label>
                    <Select
                      value={resourceForm.premiumRule}
                      onValueChange={(value) =>
                        setResourceForm({
                          ...resourceForm,
                          premiumRule: value,
                        })
                      }
                    >
                      <SelectTrigger data-testid="select-resource-premium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="field_kit">Field Kit</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="org_only">Org only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resource-author">Author</Label>
                    <Input
                      id="resource-author"
                      value={resourceForm.author}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          author: e.target.value,
                        })
                      }
                      data-testid="input-resource-author"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resource-owner">Content owner</Label>
                    <Input
                      id="resource-owner"
                      value={resourceForm.contentOwner}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          contentOwner: e.target.value,
                        })
                      }
                      data-testid="input-resource-content-owner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Resource File (PDF) *</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a PDF file that users can download
                  </p>
                  <div className="flex items-center gap-3">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={handleGetResourceUploadParams}
                      onComplete={handleResourceUploadComplete}
                      buttonClassName="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      {resourceForm.fileUrl ? "Change File" : "Upload File"}
                    </ObjectUploader>
                    {resourceForm.fileUrl && (
                      <Badge
                        variant="secondary"
                        className="gap-1"
                        data-testid="badge-file-uploaded"
                      >
                        <FileText className="w-3 h-3" />
                        File Uploaded
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createResourceMutation.isPending}
                  data-testid="button-add-resource"
                >
                  {createResourceMutation.isPending
                    ? "Adding..."
                    : "Add Resource"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <h3 className="text-xl font-bold mb-4">Existing Resources</h3>

          {resourcesLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No resources yet. Add your first resource above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {resources.map((resource) => (
                <Card key={resource.id} data-testid={`resource-${resource.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">
                            {resource.title}
                          </CardTitle>
                          <Badge variant="outline">{resource.category}</Badge>
                        </div>
                        {resource.description && (
                          <CardDescription>
                            {resource.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            window.open(resource.fileUrl, "_blank")
                          }
                          data-testid={`button-download-resource-${resource.id}`}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteResource(resource.id)}
                          disabled={deleteResourceMutation.isPending}
                          data-testid={`button-delete-resource-${resource.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="podcasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Podcast Episode</CardTitle>
              <CardDescription>
                Upload and publish podcast episodes for your coaching content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePodcast} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="podcast-title">Episode Title *</Label>
                  <Input
                    id="podcast-title"
                    value={podcastForm.title}
                    onChange={(e) =>
                      setPodcastForm({ ...podcastForm, title: e.target.value })
                    }
                    placeholder="Enter podcast episode title"
                    required
                    data-testid="input-podcast-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="podcast-description">Description</Label>
                  <Textarea
                    id="podcast-description"
                    value={podcastForm.description}
                    onChange={(e) =>
                      setPodcastForm({
                        ...podcastForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description of the episode"
                    rows={3}
                    data-testid="input-podcast-description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="podcast-episode-number">
                      Episode Number
                    </Label>
                    <Input
                      id="podcast-episode-number"
                      type="number"
                      value={podcastForm.episodeNumber}
                      onChange={(e) =>
                        setPodcastForm({
                          ...podcastForm,
                          episodeNumber: e.target.value,
                        })
                      }
                      placeholder="e.g., 1"
                      data-testid="input-podcast-episode-number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="podcast-duration">Duration</Label>
                    <Input
                      id="podcast-duration"
                      value={podcastForm.duration}
                      onChange={(e) =>
                        setPodcastForm({
                          ...podcastForm,
                          duration: e.target.value,
                        })
                      }
                      placeholder="MM:SS or HH:MM:SS"
                      data-testid="input-podcast-duration"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="podcast-publish-date">Publish Date *</Label>
                    <Input
                      id="podcast-publish-date"
                      type="date"
                      value={podcastForm.publishDate}
                      onChange={(e) =>
                        setPodcastForm({
                          ...podcastForm,
                          publishDate: e.target.value,
                        })
                      }
                      required
                      data-testid="input-podcast-publish-date"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Audio File *</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload the podcast audio file (MP3, M4A, or other audio
                    formats)
                  </p>
                  <div className="flex items-center gap-3">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={104857600}
                      onGetUploadParameters={handleGetAudioUploadParams}
                      onComplete={handleAudioUploadComplete}
                      buttonClassName="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span data-testid="button-upload-podcast">
                        {podcastForm.audioUrl ? "Change Audio" : "Upload Audio"}
                      </span>
                    </ObjectUploader>
                    {podcastForm.audioUrl && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="w-3 h-3" />
                          Audio Uploaded
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPodcastForm({ ...podcastForm, audioUrl: "" })
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createPodcastMutation.isPending}
                  data-testid="button-add-podcast"
                >
                  {createPodcastMutation.isPending
                    ? "Adding..."
                    : "Add Podcast"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <h3 className="text-xl font-bold mb-4">Existing Podcasts</h3>

          {podcastsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading podcasts...</p>
            </div>
          ) : podcasts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No podcast episodes yet. Add your first episode above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {podcasts.map((podcast) => (
                <Card key={podcast.id} data-testid={`podcast-${podcast.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {podcast.episodeNumber && (
                            <Badge variant="outline">
                              Episode {podcast.episodeNumber}
                            </Badge>
                          )}
                          <CardTitle className="text-xl">
                            {podcast.title}
                          </CardTitle>
                        </div>
                        {podcast.description && (
                          <CardDescription>
                            {podcast.description}
                          </CardDescription>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            {new Date(podcast.publishDate).toLocaleDateString()}
                          </span>
                          {podcast.duration && <span>{podcast.duration}</span>}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeletePodcast(podcast.id)}
                        disabled={deletePodcastMutation.isPending}
                        data-testid={`button-delete-podcast-${podcast.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold">Testimonials</h2>
              <p className="text-sm text-muted-foreground">
                {testimonialsList.length} quotes and {caseStudiesList.length}{" "}
                case studies
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditingTestimonial(null);
                  setTestimonialForm({
                    name: "",
                    title: "",
                    company: "",
                    quote: "",
                    outcome: "",
                    category: "individual",
                    featured: false,
                    displayOrder: 0,
                  });
                  setTestimonialDialogOpen(true);
                }}
                data-testid="button-add-testimonial"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Quote
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCaseStudy(null);
                  setCaseStudyForm({
                    title: "",
                    clientLabel: "",
                    challenge: "",
                    solution: "",
                    results: "",
                    category: "individual",
                    displayOrder: 0,
                  });
                  setCaseStudyDialogOpen(true);
                }}
                data-testid="button-add-case-study"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Case Study
              </Button>
            </div>
          </div>

          {testimonialsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading testimonials...
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Quotes</h3>
              {testimonialsList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No testimonials yet.
                </p>
              ) : (
                testimonialsList.map((t) => (
                  <Card key={t.id} data-testid={`card-testimonial-${t.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{t.name}</CardTitle>
                          {t.featured && (
                            <Badge variant="secondary">Featured</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {t.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.title}, {t.company}
                        </p>
                        <p className="text-sm mt-2 italic line-clamp-2">
                          "{t.quote}"
                        </p>
                        {t.outcome && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Outcome: {t.outcome}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleEditTestimonial(t)}
                          data-testid={`button-edit-testimonial-${t.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm("Delete this testimonial?"))
                              deleteTestimonialMutation.mutate(t.id);
                          }}
                          data-testid={`button-delete-testimonial-${t.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          )}

          {caseStudiesLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading case studies...
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              <h3 className="font-semibold text-lg">Case Studies</h3>
              {caseStudiesList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No case studies yet.
                </p>
              ) : (
                caseStudiesList.map((s) => (
                  <Card key={s.id} data-testid={`card-case-study-${s.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{s.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {s.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {s.clientLabel}
                        </p>
                        <p className="text-sm mt-2 line-clamp-2">
                          {s.challenge}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleEditCaseStudy(s)}
                          data-testid={`button-edit-case-study-${s.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm("Delete this case study?"))
                              deleteCaseStudyMutation.mutate(s.id);
                          }}
                          data-testid={`button-delete-case-study-${s.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Agreements Tab */}
        <TabsContent value="agreements" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold">Agreements</h2>
              <p className="text-sm text-muted-foreground">
                {agreements.length} signed,{" "}
                {agreementRequests.filter((r) => r.status === "pending").length}{" "}
                pending requests
              </p>
            </div>
            <Button
              onClick={() => setSendRequestDialogOpen(true)}
              data-testid="button-send-signing-request"
            >
              <Send className="w-4 h-4 mr-2" /> Send Signing Request
            </Button>
          </div>

          <Dialog
            open={sendRequestDialogOpen}
            onOpenChange={setSendRequestDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Signing Request</DialogTitle>
                <DialogDescription>
                  Send agreement documents to a lead for digital signing.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    !requestEmail ||
                    !requestName ||
                    requestDocTypes.length === 0
                  )
                    return;
                  sendRequestMutation.mutate({
                    recipientEmail: requestEmail,
                    recipientName: requestName,
                    documentTypes: requestDocTypes,
                  });
                }}
                className="space-y-4"
              >
                {inquiries.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select from Inquiries</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 min-h-9 text-sm"
                      value=""
                      onChange={(e) => {
                        const inq = inquiries.find(
                          (i) => i.id.toString() === e.target.value,
                        );
                        if (inq) {
                          setRequestName(inq.name);
                          setRequestEmail(inq.email);
                        }
                      }}
                      data-testid="select-inquiry-lead"
                    >
                      <option value="">Choose a lead to autofill...</option>
                      {inquiries.map((inq) => (
                        <option key={inq.id} value={inq.id.toString()}>
                          {inq.name} ({inq.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="req-name">Recipient Name</Label>
                  <Input
                    id="req-name"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    placeholder="Full name"
                    required
                    data-testid="input-request-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-email">Recipient Email</Label>
                  <Input
                    id="req-email"
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    placeholder="email@company.com"
                    required
                    data-testid="input-request-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Documents to Sign</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {AVAILABLE_DOC_TYPES.map((dt) => (
                      <label
                        key={dt}
                        className="flex items-center gap-2 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={requestDocTypes.includes(dt)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setRequestDocTypes([...requestDocTypes, dt]);
                            else
                              setRequestDocTypes(
                                requestDocTypes.filter((d) => d !== dt),
                              );
                          }}
                          className="rounded"
                          data-testid={`checkbox-doc-${dt.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                        />
                        {dt}
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    sendRequestMutation.isPending ||
                    !requestEmail ||
                    !requestName ||
                    requestDocTypes.length === 0
                  }
                  data-testid="button-submit-request"
                >
                  {sendRequestMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Sending...
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {agreementRequestsLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading requests...
            </div>
          ) : (
            agreementRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Signing Requests</h3>
                {agreementRequests.map((req) => {
                  const reqSignedAgs = agreements.filter(
                    (a) => a.requestId === req.id,
                  );
                  const signedTypes = reqSignedAgs.map((a) => a.agreementType);
                  return (
                    <Card key={req.id} data-testid={`card-request-${req.id}`}>
                      <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base">
                              {req.recipientName}
                            </CardTitle>
                            <Badge
                              variant={
                                req.status === "completed"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {req.status === "completed"
                                ? "Completed"
                                : "Pending"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {req.recipientEmail}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sent{" "}
                            {req.sentAt
                              ? new Date(req.sentAt).toLocaleDateString()
                              : "Unknown"}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {req.documentTypes.map((dt) => (
                              <Badge
                                key={dt}
                                variant={
                                  signedTypes.includes(dt)
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs gap-1"
                              >
                                {signedTypes.includes(dt) ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <Circle className="w-3 h-3" />
                                )}
                                {dt.length > 30
                                  ? dt.substring(0, 27) + "..."
                                  : dt}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {req.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendRequestMutation.mutate(req.id)}
                            disabled={resendRequestMutation.isPending}
                            data-testid={`button-resend-${req.id}`}
                          >
                            <Send className="w-3 h-3 mr-1" /> Resend
                          </Button>
                        )}
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">
              Signed Agreements ({agreements.length})
            </h3>
            {agreementsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading agreements...
              </div>
            ) : agreements.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-muted-foreground text-center py-4">
                    No signed agreements yet.
                  </CardTitle>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-3">
                {agreements.map((ag) => (
                  <Card key={ag.id} data-testid={`card-agreement-${ag.id}`}>
                    <CardHeader
                      className="flex flex-row items-start justify-between gap-4 cursor-pointer"
                      onClick={() =>
                        setExpandedAgreement(
                          expandedAgreement === ag.id ? null : ag.id,
                        )
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">
                            {ag.signerName}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {ag.agreementType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {ag.signerTitle} at {ag.signerOrganization}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ag.signerEmail} &bull; Signed{" "}
                          {ag.signedAt
                            ? new Date(ag.signedAt).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost">
                        {expandedAgreement === ag.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CardHeader>
                    {expandedAgreement === ag.id && (
                      <div className="px-6 pb-4 space-y-2 border-t pt-4">
                        <p className="text-sm">
                          <span className="font-medium">Agreement Type:</span>{" "}
                          {ag.agreementType}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Organization:</span>{" "}
                          {ag.signerOrganization}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Email:</span>{" "}
                          {ag.signerEmail}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Date Signed:</span>{" "}
                          {ag.signedAt
                            ? new Date(ag.signedAt).toLocaleString()
                            : "Unknown"}
                        </p>
                        {ag.signatureImage && (
                          <div>
                            <p className="text-sm font-medium mb-1">
                              Drawn Signature:
                            </p>
                            <img
                              src={ag.signatureImage}
                              alt="Drawn signature"
                              className="max-w-[250px] border rounded-md bg-white p-2"
                            />
                          </div>
                        )}
                        {ag.hasPdf && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPdf(ag.id, ag.agreementType);
                            }}
                            data-testid={`button-download-pdf-${ag.id}`}
                          >
                            <Download className="w-3 h-3 mr-1" /> Download
                            Signed PDF
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Role-Play Tab */}
        <TabsContent value="roleplay" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Role-Play Sessions</h2>
            <p className="text-sm text-muted-foreground">
              {roleplaySessions.length} sessions recorded
            </p>
          </div>

          {roleplaySessionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading sessions...
            </div>
          ) : (
            <>
              {roleplaySessions.length > 0 &&
                (() => {
                  const scoredSessions = roleplaySessions.filter(
                    (s) => s.rating !== null && s.rating !== undefined,
                  );
                  const avgScore =
                    scoredSessions.length > 0
                      ? Math.round(
                          scoredSessions.reduce(
                            (sum, s) => sum + (s.rating ?? 0),
                            0,
                          ) / scoredSessions.length,
                        )
                      : null;
                  const scenarioCounts: Record<string, number> = {};
                  roleplaySessions.forEach((s) => {
                    scenarioCounts[s.scenarioTitle] =
                      (scenarioCounts[s.scenarioTitle] || 0) + 1;
                  });
                  const topScenario = Object.entries(scenarioCounts).sort(
                    (a, b) => b[1] - a[1],
                  )[0]?.[0];
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                      <Card>
                        <CardHeader className="pb-2">
                          <p className="text-sm text-muted-foreground">
                            Total Sessions
                          </p>
                          <p className="text-3xl font-bold">
                            {roleplaySessions.length}
                          </p>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <p className="text-sm text-muted-foreground">
                            Average Score
                          </p>
                          <p className="text-3xl font-bold">
                            {avgScore !== null ? `${avgScore}%` : "N/A"}
                          </p>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <p className="text-sm text-muted-foreground">
                            Most Practiced
                          </p>
                          <p className="text-base font-semibold leading-snug">
                            {topScenario ?? "N/A"}
                          </p>
                        </CardHeader>
                      </Card>
                    </div>
                  );
                })()}

              {roleplaySessions.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-muted-foreground text-center py-4">
                      No role-play sessions yet.
                    </CardTitle>
                  </CardHeader>
                </Card>
              ) : (
                <div className="space-y-3">
                  {roleplaySessions.map((session) => {
                    const rating = session.rating;
                    const scoreBadgeVariant =
                      rating === null || rating === undefined
                        ? "outline"
                        : rating >= 80
                          ? "default"
                          : rating >= 60
                            ? "secondary"
                            : "destructive";
                    const scoreLabel =
                      rating !== null && rating !== undefined
                        ? `${rating}%`
                        : "Unscored";
                    return (
                      <Card
                        key={session.id}
                        data-testid={`card-roleplay-${session.id}`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">
                              {session.scenarioTitle}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(session.createdAt).toLocaleDateString()}{" "}
                              &bull; {session.status}
                            </p>
                          </div>
                          <Badge
                            variant={scoreBadgeVariant}
                            data-testid={`badge-score-${session.id}`}
                          >
                            {scoreLabel}
                          </Badge>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Drills Tab */}
        <TabsContent value="drills" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Drills Activity</h2>
            <p className="text-sm text-muted-foreground">
              {drillCompletions.length} total completions recorded
            </p>
          </div>

          {drillCompletionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading drills data...
            </div>
          ) : (
            <>
              {drillCompletions.length > 0 &&
                (() => {
                  const uniqueDrills = new Set(
                    drillCompletions.map((c) => c.drillIndex),
                  ).size;
                  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                  const recentCount = drillCompletions.filter(
                    (c) => c.completedAt >= sevenDaysAgo,
                  ).length;
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                      <Card>
                        <CardHeader className="pb-2">
                          <p className="text-sm text-muted-foreground">
                            Total Completions
                          </p>
                          <p className="text-3xl font-bold">
                            {drillCompletions.length}
                          </p>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <p className="text-sm text-muted-foreground">
                            Unique Drills Practiced
                          </p>
                          <p className="text-3xl font-bold">{uniqueDrills}</p>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <p className="text-sm text-muted-foreground">
                            Last 7 Days
                          </p>
                          <p className="text-3xl font-bold">{recentCount}</p>
                        </CardHeader>
                      </Card>
                    </div>
                  );
                })()}

              {drillCompletions.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-muted-foreground text-center py-4">
                      No drill completions yet.
                    </CardTitle>
                  </CardHeader>
                </Card>
              ) : (
                <div className="space-y-3">
                  {drillCompletions
                    .slice()
                    .sort((a, b) => b.completedAt - a.completedAt)
                    .slice(0, 50)
                    .map((completion) => (
                      <Card
                        key={completion.id}
                        data-testid={`card-drill-${completion.id}`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">
                              {completion.drillTitle}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Drill #{completion.drillIndex} &bull;{" "}
                              {new Date(
                                completion.completedAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            Completed
                          </Badge>
                        </CardHeader>
                      </Card>
                    ))}
                  {drillCompletions.length > 50 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Showing 50 most recent of {drillCompletions.length} total
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold">Leads</h2>
              <p className="text-sm text-muted-foreground">
                {groupedLeads.length} unique leads captured via tool gate
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rows = [
                  [
                    "Name",
                    "Email",
                    "First Seen",
                    "Tools Used",
                    "Interactions",
                    "Hot Lead",
                  ],
                  ...groupedLeads.map((l) => [
                    l.name,
                    l.email,
                    new Date(l.firstSeen).toLocaleDateString(),
                    l.tools.join("; "),
                    String(l.interactions),
                    l.interactions >= 3 ? "Yes" : "No",
                  ]),
                ];
                downloadCSV(rows, "spartan-leads.csv");
              }}
              data-testid="button-leads-export"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV
            </Button>
          </div>

          {resourceLeadsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading leads...
            </div>
          ) : groupedLeads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No leads captured yet. Leads are recorded when users submit
                  the tool gate form.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {groupedLeads.map((lead) => (
                <Card key={lead.email} data-testid={`card-lead-${lead.email}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <CardTitle className="text-base">{lead.name}</CardTitle>
                        {lead.interactions >= 3 && (
                          <Badge
                            variant="destructive"
                            className="text-xs"
                            data-testid={`badge-hot-${lead.email}`}
                          >
                            Hot
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lead.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        First seen{" "}
                        {new Date(lead.firstSeen).toLocaleDateString()} &bull;{" "}
                        {lead.interactions} interaction
                        {lead.interactions !== 1 ? "s" : ""}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {lead.tools.map((tool) => (
                          <Badge
                            key={tool}
                            variant="secondary"
                            className="text-xs"
                            data-testid={`badge-tool-${lead.email}`}
                          >
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLeadEmailTarget({
                          email: lead.email,
                          name: lead.name,
                        });
                        setLeadEmailSubject(`Following up — Spartan Coaching`);
                        setLeadEmailBody(
                          `Hi ${lead.name},\n\nI noticed you've been exploring the tools on Spartan Coaching. I wanted to reach out personally to see if there's anything I can help with.\n\nIf you're working on a specific challenge right now, I'd love to hear about it.\n\n— Nick\nSpartan Coaching`,
                        );
                        setLeadEmailDialogOpen(true);
                      }}
                      data-testid={`button-email-lead-${lead.email}`}
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      Email
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold">Candidate Assessments</h2>
              <p className="text-sm text-muted-foreground">
                Create assessments with quiz and scenario questions for
                candidate evaluation
              </p>
            </div>
            <Button
              onClick={() => setAssessmentDialogOpen(true)}
              data-testid="button-create-assessment"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Assessment
            </Button>
          </div>

          {assessmentsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading assessments...
            </div>
          ) : assessmentsList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No assessments created yet. Create your first assessment to
                  start evaluating candidates.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {assessmentsList.map((a) => (
                <Card
                  key={a.id}
                  className={
                    selectedAssessmentId === a.id ? "ring-2 ring-primary" : ""
                  }
                  data-testid={`card-assessment-${a.id}`}
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        setSelectedAssessmentId(
                          selectedAssessmentId === a.id ? null : a.id,
                        );
                        setSubmissionClientFilter("all");
                      }}
                    >
                      <CardTitle className="text-base">{a.name}</CardTitle>
                      {a.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {a.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Created{" "}
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(`/assessment/${a.id}/print`, "_blank")
                        }
                        data-testid={`button-print-assessment-${a.id}`}
                      >
                        <Printer className="w-4 h-4 mr-1.5" />
                        Print
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyAssessmentLink(a.id)}
                        data-testid={`button-copy-link-${a.id}`}
                      >
                        <LinkIcon className="w-4 h-4 mr-1.5" />
                        Copy Link
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Delete this assessment and all its questions and submissions?",
                            )
                          ) {
                            deleteAssessmentMutation.mutate(a.id);
                          }
                        }}
                        data-testid={`button-delete-assessment-${a.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {selectedAssessmentId === a.id && (
                    <CardContent className="border-t pt-4 space-y-6">
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                          <h3 className="font-semibold text-sm">
                            Questions ({assessmentQuestions.length})
                          </h3>
                          <Button
                            size="sm"
                            onClick={() => {
                              setQuestionType("quiz");
                              setQuestionDialogOpen(true);
                            }}
                            data-testid="button-add-question"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Question
                          </Button>
                        </div>
                        {assessmentQuestions.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            No questions added yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {assessmentQuestions.map((q, idx) => (
                              <div
                                key={q.id}
                                className="flex items-start justify-between gap-3 p-3 border rounded-md"
                                data-testid={`question-${q.id}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Q{idx + 1}
                                    </span>
                                    <Badge
                                      variant={
                                        q.type === "quiz"
                                          ? "secondary"
                                          : "default"
                                      }
                                      className="text-xs"
                                    >
                                      {q.type === "quiz" ? "Quiz" : "Scenario"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-foreground">
                                    {q.text}
                                  </p>
                                  {q.type === "quiz" && q.options && (
                                    <div className="mt-2 space-y-1">
                                      {q.options.map((opt, oi) => (
                                        <p
                                          key={oi}
                                          className={`text-xs ${opt === q.correctAnswer ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}`}
                                        >
                                          {opt === q.correctAnswer
                                            ? "* "
                                            : "  "}
                                          {opt}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    deleteQuestionMutation.mutate(q.id)
                                  }
                                  data-testid={`button-delete-question-${q.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        {(() => {
                          const clientSlugs = [
                            ...new Set(
                              assessmentSubmissions
                                .filter((s) => s.clientSlug)
                                .map((s) => s.clientSlug!),
                            ),
                          ];
                          const filteredSubmissions =
                            submissionClientFilter === "all"
                              ? assessmentSubmissions
                              : submissionClientFilter === "direct"
                                ? assessmentSubmissions.filter(
                                    (s) => !s.clientSlug,
                                  )
                                : assessmentSubmissions.filter(
                                    (s) =>
                                      s.clientSlug === submissionClientFilter,
                                  );
                          return (
                            <>
                              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                                <h3 className="font-semibold text-sm">
                                  Submissions ({filteredSubmissions.length}
                                  {submissionClientFilter !== "all"
                                    ? ` of ${assessmentSubmissions.length}`
                                    : ""}
                                  )
                                </h3>
                                {clientSlugs.length > 0 && (
                                  <Select
                                    value={submissionClientFilter}
                                    onValueChange={setSubmissionClientFilter}
                                  >
                                    <SelectTrigger
                                      className="w-[180px]"
                                      data-testid="select-submission-filter"
                                    >
                                      <SelectValue placeholder="Filter by source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">
                                        All Sources
                                      </SelectItem>
                                      <SelectItem value="direct">
                                        Direct (no client)
                                      </SelectItem>
                                      {clientSlugs.map((slug) => (
                                        <SelectItem key={slug} value={slug}>
                                          {slug}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                              {filteredSubmissions.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                  No submissions yet
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {filteredSubmissions.map((sub) => (
                                    <div
                                      key={sub.id}
                                      className="border rounded-md"
                                      data-testid={`submission-${sub.id}`}
                                    >
                                      <div className="flex items-center justify-between gap-3 p-3 flex-wrap">
                                        <div
                                          className="flex items-center gap-3 flex-wrap flex-1 cursor-pointer"
                                          onClick={() =>
                                            setExpandedSubmissionId(
                                              expandedSubmissionId === sub.id
                                                ? null
                                                : sub.id,
                                            )
                                          }
                                        >
                                          <div>
                                            <p className="text-sm font-medium text-foreground">
                                              {sub.candidateName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {sub.candidateEmail}
                                            </p>
                                          </div>
                                          <Badge
                                            variant={
                                              (sub.overallScore ?? 0) >= 80
                                                ? "default"
                                                : (sub.overallScore ?? 0) >= 60
                                                  ? "secondary"
                                                  : "destructive"
                                            }
                                            data-testid={`badge-score-${sub.id}`}
                                          >
                                            {sub.overallScore ?? 0}%
                                          </Badge>
                                          {sub.aiFeedback &&
                                            (() => {
                                              try {
                                                const d = JSON.parse(
                                                  sub.aiFeedback!,
                                                );
                                                return d.tier ? (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    {d.tier}
                                                  </Badge>
                                                ) : null;
                                              } catch {
                                                return null;
                                              }
                                            })()}
                                          {sub.clientSlug && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                              data-testid={`badge-client-${sub.id}`}
                                            >
                                              {sub.clientSlug}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {sub.quizScore !== null && (
                                            <span className="text-xs text-muted-foreground">
                                              Quiz: {sub.quizScore}%
                                            </span>
                                          )}
                                          {sub.aiScore !== null && (
                                            <span className="text-xs text-muted-foreground">
                                              Scenario: {sub.aiScore}%
                                            </span>
                                          )}
                                          <span className="text-xs text-muted-foreground">
                                            {sub.completedAt
                                              ? new Date(
                                                  sub.completedAt,
                                                ).toLocaleDateString()
                                              : ""}
                                          </span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(
                                                `/assessment-results/${sub.id}`,
                                                "_blank",
                                              );
                                            }}
                                            data-testid={`button-download-pdf-${sub.id}`}
                                          >
                                            <Printer className="w-3.5 h-3.5 mr-1" />
                                            PDF
                                          </Button>
                                          <button
                                            className="p-1 text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                              setExpandedSubmissionId(
                                                expandedSubmissionId === sub.id
                                                  ? null
                                                  : sub.id,
                                              )
                                            }
                                          >
                                            {expandedSubmissionId === sub.id ? (
                                              <ChevronUp className="w-4 h-4" />
                                            ) : (
                                              <ChevronDown className="w-4 h-4" />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                      {expandedSubmissionId === sub.id &&
                                        (() => {
                                          let aiData: any = null;
                                          try {
                                            aiData = sub.aiFeedback
                                              ? JSON.parse(sub.aiFeedback)
                                              : null;
                                          } catch {
                                            aiData = null;
                                          }
                                          const isStructured =
                                            aiData &&
                                            typeof aiData.overallScore ===
                                              "number";
                                          return (
                                            <div className="border-t p-4 space-y-5">
                                              {isStructured ? (
                                                <>
                                                  <div className="flex items-center gap-3 flex-wrap">
                                                    <Badge
                                                      variant={
                                                        aiData.overallScore >=
                                                        85
                                                          ? "default"
                                                          : aiData.overallScore >=
                                                              70
                                                            ? "secondary"
                                                            : "destructive"
                                                      }
                                                      className="text-sm px-3 py-1"
                                                    >
                                                      {aiData.tier}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                      {aiData.overallScore}/100
                                                      overall &bull; Field
                                                      Readiness:{" "}
                                                      {aiData.fieldReadinessScore ??
                                                        "—"}
                                                      /100
                                                    </span>
                                                  </div>

                                                  {aiData.quizAnalysis && (
                                                    <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-3">
                                                      {aiData.quizAnalysis}
                                                    </p>
                                                  )}

                                                  <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                      {
                                                        label:
                                                          "Hospice Knowledge",
                                                        val: aiData
                                                          .categoryScores
                                                          ?.hospiceKnowledge,
                                                        max: 25,
                                                      },
                                                      {
                                                        label:
                                                          "Relationship Selling",
                                                        val: aiData
                                                          .categoryScores
                                                          ?.relationshipSelling,
                                                        max: 25,
                                                      },
                                                      {
                                                        label:
                                                          "Empathy & Communication",
                                                        val: aiData
                                                          .categoryScores
                                                          ?.empathyCommunication,
                                                        max: 25,
                                                      },
                                                      {
                                                        label:
                                                          "Strategic Execution",
                                                        val: aiData
                                                          .categoryScores
                                                          ?.strategicExecution,
                                                        max: 25,
                                                      },
                                                    ].map((cat) => (
                                                      <div
                                                        key={cat.label}
                                                        className="bg-muted/40 rounded-md p-2.5"
                                                      >
                                                        <p className="text-xs text-muted-foreground mb-1">
                                                          {cat.label}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                              className="h-full bg-primary rounded-full"
                                                              style={{
                                                                width: `${Math.round(((cat.val ?? 0) / cat.max) * 100)}%`,
                                                              }}
                                                            />
                                                          </div>
                                                          <span className="text-xs font-semibold shrink-0">
                                                            {cat.val ?? "—"}/
                                                            {cat.max}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>

                                                  {aiData.standoutQualities
                                                    ?.length > 0 && (
                                                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                                                      <h4 className="text-xs font-bold uppercase tracking-wide text-green-700 dark:text-green-400 mb-2">
                                                        Standout Qualities
                                                      </h4>
                                                      {aiData.standoutQualities.map(
                                                        (
                                                          s: string,
                                                          i: number,
                                                        ) => (
                                                          <p
                                                            key={i}
                                                            className="text-sm text-foreground"
                                                          >
                                                            {s}
                                                          </p>
                                                        ),
                                                      )}
                                                    </div>
                                                  )}

                                                  {aiData.redFlags?.length >
                                                    0 && (
                                                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                                                      <h4 className="text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-400 mb-2">
                                                        Red Flags
                                                      </h4>
                                                      <ul className="space-y-1.5">
                                                        {aiData.redFlags.map(
                                                          (
                                                            f: string,
                                                            i: number,
                                                          ) => (
                                                            <li
                                                              key={i}
                                                              className="flex items-start gap-2 text-sm"
                                                            >
                                                              <span className="text-red-600 dark:text-red-400 shrink-0 font-bold">
                                                                !
                                                              </span>
                                                              <span>{f}</span>
                                                            </li>
                                                          ),
                                                        )}
                                                      </ul>
                                                    </div>
                                                  )}

                                                  <div className="grid grid-cols-2 gap-4">
                                                    {aiData.strengths?.length >
                                                      0 && (
                                                      <div>
                                                        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                                                          Strengths
                                                        </h4>
                                                        <ul className="space-y-1.5">
                                                          {aiData.strengths.map(
                                                            (
                                                              s: string,
                                                              i: number,
                                                            ) => (
                                                              <li
                                                                key={i}
                                                                className="flex items-start gap-2 text-sm"
                                                              >
                                                                <span className="text-green-600 dark:text-green-400 shrink-0 font-bold">
                                                                  +
                                                                </span>
                                                                <span>{s}</span>
                                                              </li>
                                                            ),
                                                          )}
                                                        </ul>
                                                      </div>
                                                    )}
                                                    {aiData.developmentAreas
                                                      ?.length > 0 && (
                                                      <div>
                                                        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                                                          Development Areas
                                                        </h4>
                                                        <ul className="space-y-1.5">
                                                          {aiData.developmentAreas.map(
                                                            (
                                                              s: string,
                                                              i: number,
                                                            ) => (
                                                              <li
                                                                key={i}
                                                                className="flex items-start gap-2 text-sm"
                                                              >
                                                                <span className="text-amber-500 shrink-0 font-bold">
                                                                  -
                                                                </span>
                                                                <span>{s}</span>
                                                              </li>
                                                            ),
                                                          )}
                                                        </ul>
                                                      </div>
                                                    )}
                                                  </div>

                                                  {aiData.coachabilitySignals
                                                    ?.length > 0 && (
                                                    <div>
                                                      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                                                        Coachability Signals
                                                      </h4>
                                                      <div className="flex flex-wrap gap-2">
                                                        {aiData.coachabilitySignals.map(
                                                          (
                                                            s: string,
                                                            i: number,
                                                          ) => (
                                                            <span
                                                              key={i}
                                                              className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded px-2 py-1 text-xs"
                                                            >
                                                              {s}
                                                            </span>
                                                          ),
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {aiData.scenarioFeedback
                                                    ?.length > 0 && (
                                                    <div>
                                                      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                                                        Scenario Evaluation
                                                      </h4>
                                                      <div className="space-y-2">
                                                        {aiData.scenarioFeedback.map(
                                                          (
                                                            sf: any,
                                                            i: number,
                                                          ) => (
                                                            <div
                                                              key={i}
                                                              className="bg-muted/40 rounded-md p-3"
                                                            >
                                                              <p className="text-xs font-semibold mb-1">
                                                                Scenario{" "}
                                                                {
                                                                  sf.scenarioNumber
                                                                }
                                                                : {sf.title}
                                                              </p>
                                                              <p className="text-sm text-muted-foreground mb-2">
                                                                {sf.feedback}
                                                              </p>
                                                              {sf.strongerAnswer && (
                                                                <p className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20 rounded px-2 py-1.5">
                                                                  Stronger
                                                                  answer:{" "}
                                                                  {
                                                                    sf.strongerAnswer
                                                                  }
                                                                </p>
                                                              )}
                                                            </div>
                                                          ),
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {aiData.candidatePotential && (
                                                    <div>
                                                      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                                                        Candidate Potential
                                                      </h4>
                                                      <p className="text-sm text-muted-foreground">
                                                        {
                                                          aiData.candidatePotential
                                                        }
                                                      </p>
                                                    </div>
                                                  )}

                                                  {aiData.interviewGuide
                                                    ?.length > 0 && (
                                                    <div>
                                                      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                                                        Interview Questions to
                                                        Ask
                                                      </h4>
                                                      <div className="space-y-2">
                                                        {aiData.interviewGuide.map(
                                                          (
                                                            item: any,
                                                            i: number,
                                                          ) => (
                                                            <div
                                                              key={i}
                                                              className="border rounded-md p-2.5"
                                                            >
                                                              <p className="text-sm font-medium mb-0.5">
                                                                {item.question}
                                                              </p>
                                                              <p className="text-xs text-muted-foreground">
                                                                Intent:{" "}
                                                                {item.intent}
                                                              </p>
                                                            </div>
                                                          ),
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {aiData.developmentPlan
                                                    ?.length > 0 && (
                                                    <div>
                                                      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                                                        Coaching Plan
                                                      </h4>
                                                      <div className="space-y-2">
                                                        {aiData.developmentPlan.map(
                                                          (
                                                            item: any,
                                                            i: number,
                                                          ) => (
                                                            <div
                                                              key={i}
                                                              className="flex items-start gap-2 border rounded-md p-2.5"
                                                            >
                                                              <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded px-1.5 py-0.5 text-xs font-bold shrink-0">
                                                                FOCUS
                                                              </span>
                                                              <div>
                                                                <p className="text-sm font-medium">
                                                                  {item.focus}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                  {item.action}
                                                                </p>
                                                              </div>
                                                            </div>
                                                          ),
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {aiData.hiringRecommendation && (
                                                    <div className="bg-muted/40 rounded-md p-3">
                                                      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                                                        Hiring Recommendation
                                                      </h4>
                                                      <p className="text-sm font-medium">
                                                        {
                                                          aiData.hiringRecommendation
                                                        }
                                                      </p>
                                                    </div>
                                                  )}
                                                </>
                                              ) : sub.aiFeedback ? (
                                                <div>
                                                  <h4 className="text-sm font-semibold mb-2">
                                                    AI Evaluation
                                                  </h4>
                                                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                                                    {sub.aiFeedback}
                                                  </div>
                                                </div>
                                              ) : null}

                                              {sub.answers != null &&
                                              typeof sub.answers === "object"
                                                ? (() => {
                                                    const answersObj =
                                                      sub.answers as Record<
                                                        string,
                                                        string
                                                      >;
                                                    return (
                                                      <div>
                                                        <h4 className="text-sm font-semibold mb-2">
                                                          Full Answer Record
                                                        </h4>
                                                        <div className="space-y-2">
                                                          {Object.entries(
                                                            answersObj,
                                                          ).map(
                                                            ([qId, answer]) => {
                                                              const q =
                                                                assessmentQuestions.find(
                                                                  (q) =>
                                                                    q.id ===
                                                                    parseInt(
                                                                      qId,
                                                                    ),
                                                                );
                                                              return (
                                                                <div
                                                                  key={qId}
                                                                  className="text-sm border-l-2 border-muted pl-3"
                                                                >
                                                                  <p className="font-medium text-foreground">
                                                                    {q?.text ||
                                                                      `Question ${qId}`}
                                                                  </p>
                                                                  <p className="text-muted-foreground mt-1">
                                                                    {String(
                                                                      answer,
                                                                    )}
                                                                  </p>
                                                                  {q?.type ===
                                                                    "quiz" &&
                                                                    q?.correctAnswer && (
                                                                      <p
                                                                        className={`text-xs mt-1 ${String(answer).trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                                                      >
                                                                        {String(
                                                                          answer,
                                                                        )
                                                                          .trim()
                                                                          .toLowerCase() ===
                                                                        q.correctAnswer
                                                                          .trim()
                                                                          .toLowerCase()
                                                                          ? "Correct"
                                                                          : `Incorrect — correct answer: ${q.correctAnswer}`}
                                                                      </p>
                                                                    )}
                                                                </div>
                                                              );
                                                            },
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })()
                                                : null}
                                            </div>
                                          );
                                        })()}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                          <h3 className="font-semibold text-sm">
                            Invites ({assessmentInvites.length})
                          </h3>
                          <Button
                            size="sm"
                            onClick={() => setInviteDialogOpen(true)}
                            data-testid="button-send-invite"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send Invite
                          </Button>
                        </div>
                        {assessmentInvites.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            No invites sent yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {assessmentInvites.map((inv) => (
                              <div
                                key={inv.id}
                                className="flex items-center justify-between gap-3 p-3 border rounded-md flex-wrap"
                                data-testid={`invite-${inv.id}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">
                                    {inv.candidateName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {inv.candidateEmail}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {inv.usedAt ? (
                                    <Badge
                                      variant="default"
                                      className="text-xs"
                                      data-testid={`badge-invite-used-${inv.id}`}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Completed
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                      data-testid={`badge-invite-pending-${inv.id}`}
                                    >
                                      Pending
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {inv.sentAt
                                      ? new Date(
                                          inv.sentAt,
                                        ).toLocaleDateString()
                                      : ""}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      const link = `${window.location.origin}/assessment/${a.id}?token=${inv.token}`;
                                      navigator.clipboard
                                        .writeText(link)
                                        .then(() => {
                                          toast({
                                            title: "Copied",
                                            description:
                                              "Invite link copied to clipboard",
                                          });
                                        });
                                    }}
                                    data-testid={`button-copy-invite-${inv.id}`}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          <div className="border-t pt-6 mt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div>
                <h3 className="text-lg font-bold">Branded Assessment URLs</h3>
                <p className="text-sm text-muted-foreground">
                  Create custom branded URLs for client organizations (e.g.,
                  /assess/acme-hospice)
                </p>
              </div>
              <Button
                onClick={() => setClientDialogOpen(true)}
                data-testid="button-create-client"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Client
              </Button>
            </div>

            {assessmentClientsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No branded clients configured yet.
              </p>
            ) : (
              <div className="space-y-3">
                {assessmentClientsList.map((c) => {
                  const matchedAssessment = assessmentsList.find(
                    (a) => a.id === c.assessmentId,
                  );
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 p-3 border rounded-md flex-wrap"
                      data-testid={`client-row-${c.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-foreground">
                            {c.companyName}
                          </p>
                          {c.accentColor && (
                            <span
                              className="w-4 h-4 rounded-full border inline-block"
                              style={{ backgroundColor: c.accentColor }}
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          /assess/{c.slug}{" "}
                          {matchedAssessment
                            ? `\u2192 ${matchedAssessment.name}`
                            : ""}
                          {c.submissionCount > 0 && (
                            <span className="ml-2">
                              ({c.submissionCount} submission
                              {c.submissionCount !== 1 ? "s" : ""})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = `${window.location.origin}/assess/${c.slug}`;
                            navigator.clipboard.writeText(link).then(() => {
                              toast({
                                title: "Link Copied",
                                description: link,
                              });
                            });
                          }}
                          data-testid={`button-copy-client-link-${c.id}`}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy URL
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove branded URL for ${c.companyName}?`,
                              )
                            ) {
                              deleteClientMutation.mutate(c.id);
                            }
                          }}
                          data-testid={`button-delete-client-${c.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Branded Assessment URL</DialogTitle>
                <DialogDescription>
                  Set up a custom branded assessment page for a client
                  organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="clientCompanyName">Company Name</Label>
                  <Input
                    id="clientCompanyName"
                    value={clientCompanyName}
                    onChange={(e) => setClientCompanyName(e.target.value)}
                    placeholder="Acme Hospice"
                    data-testid="input-client-company-name"
                  />
                </div>
                <div>
                  <Label htmlFor="clientSlug">URL Slug</Label>
                  <Input
                    id="clientSlug"
                    value={clientSlug}
                    onChange={(e) =>
                      setClientSlug(
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      )
                    }
                    placeholder="acme-hospice"
                    data-testid="input-client-slug"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL will be: /assess/{clientSlug || "your-slug"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="clientAssessmentId">Assessment</Label>
                  <Select
                    value={clientAssessmentId}
                    onValueChange={setClientAssessmentId}
                  >
                    <SelectTrigger data-testid="select-client-assessment">
                      <SelectValue placeholder="Select assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      {assessmentsList.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="clientLogoUrl">Logo URL (optional)</Label>
                  <Input
                    id="clientLogoUrl"
                    value={clientLogoUrl}
                    onChange={(e) => setClientLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    data-testid="input-client-logo-url"
                  />
                </div>
                <div>
                  <Label htmlFor="clientAccentColor">
                    Accent Color (optional)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="clientAccentColor"
                      value={clientAccentColor}
                      onChange={(e) => setClientAccentColor(e.target.value)}
                      placeholder="#1e40af"
                      data-testid="input-client-accent-color"
                    />
                    {clientAccentColor && (
                      <span
                        className="w-9 h-9 rounded-md border shrink-0"
                        style={{ backgroundColor: clientAccentColor }}
                      />
                    )}
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={
                    !clientSlug ||
                    !clientCompanyName ||
                    !clientAssessmentId ||
                    createClientMutation.isPending
                  }
                  onClick={() =>
                    createClientMutation.mutate({
                      slug: clientSlug,
                      companyName: clientCompanyName,
                      logoUrl: clientLogoUrl,
                      accentColor: clientAccentColor,
                      assessmentId: clientAssessmentId,
                    })
                  }
                  data-testid="button-save-client"
                >
                  {createClientMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Create Branded URL
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="linkedin" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">LinkedIn Social Proof</h2>
            <p className="text-sm text-muted-foreground">
              Configure the LinkedIn widget shown on the homepage. Leave fields
              empty to hide them.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="linkedin-followers">Follower Count</Label>
                  <Input
                    id="linkedin-followers"
                    placeholder="e.g. 5,200+"
                    value={linkedinFollowers}
                    onChange={(e) => setLinkedinFollowers(e.target.value)}
                    data-testid="input-linkedin-followers"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="linkedin-profile-url">Profile URL</Label>
                  <Input
                    id="linkedin-profile-url"
                    placeholder="https://linkedin.com/in/nicklynch"
                    value={linkedinProfileUrl}
                    onChange={(e) => setLinkedinProfileUrl(e.target.value)}
                    data-testid="input-linkedin-profile-url"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="linkedin-headline">Headline</Label>
                <Input
                  id="linkedin-headline"
                  placeholder="e.g. Hospice Growth Strategist | Spartan Coaching Founder"
                  value={linkedinHeadline}
                  onChange={(e) => setLinkedinHeadline(e.target.value)}
                  data-testid="input-linkedin-headline"
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Embedded Post URLs (paste the embed URL from LinkedIn "Embed
                  this post")
                </Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Post embed URL #1"
                    value={linkedinPost1}
                    onChange={(e) => setLinkedinPost1(e.target.value)}
                    data-testid="input-linkedin-post-1"
                  />
                  <Input
                    placeholder="Post embed URL #2"
                    value={linkedinPost2}
                    onChange={(e) => setLinkedinPost2(e.target.value)}
                    data-testid="input-linkedin-post-2"
                  />
                  <Input
                    placeholder="Post embed URL #3"
                    value={linkedinPost3}
                    onChange={(e) => setLinkedinPost3(e.target.value)}
                    data-testid="input-linkedin-post-3"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  To get the embed URL: open a LinkedIn post, click the three
                  dots menu, choose "Embed this post", and copy the src URL from
                  the iframe code.
                </p>
              </div>
              <Button
                onClick={() => {
                  saveLinkedinMutation.mutate({
                    linkedin_followers: linkedinFollowers,
                    linkedin_headline: linkedinHeadline,
                    linkedin_profile_url: linkedinProfileUrl,
                    linkedin_post_1: linkedinPost1,
                    linkedin_post_2: linkedinPost2,
                    linkedin_post_3: linkedinPost3,
                  });
                }}
                disabled={saveLinkedinMutation.isPending}
                data-testid="button-save-linkedin"
              >
                {saveLinkedinMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save LinkedIn Settings"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Assessment Invite</DialogTitle>
            <DialogDescription>
              Send a personalized assessment link to a candidate via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Candidate Name</Label>
              <Input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full name"
                data-testid="input-invite-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="candidate@email.com"
                data-testid="input-invite-email"
              />
            </div>
            <Button
              className="w-full"
              disabled={
                !inviteName.trim() ||
                !inviteEmail.trim() ||
                sendInviteMutation.isPending
              }
              onClick={() => {
                if (selectedAssessmentId) {
                  sendInviteMutation.mutate({
                    assessmentId: selectedAssessmentId,
                    candidateName: inviteName,
                    candidateEmail: inviteEmail,
                  });
                }
              }}
              data-testid="button-confirm-send-invite"
            >
              {sendInviteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1.5" />
              )}
              Send Invite Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Assessment Dialog */}
      <Dialog
        open={assessmentDialogOpen}
        onOpenChange={setAssessmentDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Assessment</DialogTitle>
            <DialogDescription>
              Create a new candidate assessment with a name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="assessment-name">Assessment Name</Label>
              <Input
                id="assessment-name"
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                placeholder="e.g. Q1 Sales Rep Assessment"
                data-testid="input-assessment-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment-desc">Description (optional)</Label>
              <Textarea
                id="assessment-desc"
                value={assessmentDescription}
                onChange={(e) => setAssessmentDescription(e.target.value)}
                placeholder="Describe what this assessment evaluates"
                data-testid="textarea-assessment-description"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAssessmentDialogOpen(false)}
                data-testid="button-cancel-assessment"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={
                  !assessmentName.trim() || createAssessmentMutation.isPending
                }
                onClick={() =>
                  createAssessmentMutation.mutate({
                    name: assessmentName,
                    description: assessmentDescription,
                  })
                }
                data-testid="button-save-assessment"
              >
                {createAssessmentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : null}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
            <DialogDescription>
              Add a quiz or scenario question to this assessment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={questionType}
                onValueChange={(v) => setQuestionType(v as "quiz" | "scenario")}
              >
                <SelectTrigger data-testid="select-question-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz (Multiple Choice)</SelectItem>
                  <SelectItem value="scenario">
                    Scenario (Written Response)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-text">Question Text</Label>
              <Textarea
                id="question-text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder={
                  questionType === "quiz"
                    ? "Enter the question..."
                    : "Describe the scenario the candidate should respond to..."
                }
                data-testid="textarea-question-text"
              />
            </div>
            {questionType === "quiz" && (
              <>
                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  {questionOptions.map((opt, idx) => (
                    <Input
                      key={idx}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...questionOptions];
                        updated[idx] = e.target.value;
                        setQuestionOptions(updated);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      data-testid={`input-option-${idx}`}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestionOptions([...questionOptions, ""])}
                    data-testid="button-add-option"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select
                    value={questionCorrectAnswer}
                    onValueChange={setQuestionCorrectAnswer}
                  >
                    <SelectTrigger data-testid="select-correct-answer">
                      <SelectValue placeholder="Select the correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionOptions
                        .filter((o) => o.trim())
                        .map((opt, idx) => (
                          <SelectItem key={idx} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setQuestionDialogOpen(false)}
                data-testid="button-cancel-question"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={
                  !questionText.trim() ||
                  (questionType === "quiz" &&
                    (!questionCorrectAnswer ||
                      questionOptions.filter((o) => o.trim()).length < 2)) ||
                  addQuestionMutation.isPending
                }
                onClick={handleAddQuestion}
                data-testid="button-save-question"
              >
                {addQuestionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : null}
                Add Question
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Email Dialog */}
      <Dialog
        open={leadEmailDialogOpen}
        onOpenChange={(open) => {
          setLeadEmailDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Email {leadEmailTarget?.name}</DialogTitle>
            <DialogDescription>
              Send a personal follow-up to {leadEmailTarget?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="lead-email-subject">Subject</Label>
              <Input
                id="lead-email-subject"
                value={leadEmailSubject}
                onChange={(e) => setLeadEmailSubject(e.target.value)}
                data-testid="input-lead-email-subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-email-body">Message</Label>
              <Textarea
                id="lead-email-body"
                value={leadEmailBody}
                onChange={(e) => setLeadEmailBody(e.target.value)}
                className="min-h-[180px]"
                data-testid="textarea-lead-email-body"
              />
            </div>
            <Button
              onClick={() => {
                if (!leadEmailTarget) return;
                sendLeadEmailMutation.mutate({
                  to: leadEmailTarget.email,
                  name: leadEmailTarget.name,
                  subject: leadEmailSubject,
                  body: leadEmailBody,
                });
              }}
              disabled={
                sendLeadEmailMutation.isPending ||
                !leadEmailSubject ||
                !leadEmailBody
              }
              className="w-full font-bold"
              data-testid="button-send-lead-email"
            >
              {sendLeadEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Article Dialog */}
      <Dialog
        open={articleDialogOpen}
        onOpenChange={(open) => {
          setArticleDialogOpen(open);
          if (!open) {
            setEditingArticle(null);
            resetArticleForm();
          }
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          data-testid="dialog-article-form"
        >
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? "Edit Article" : "Add New Article"}
            </DialogTitle>
            <DialogDescription>
              {editingArticle
                ? "Update the article details below"
                : "Fill in the article information to publish it to the Articles page"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveArticle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Article Title *</Label>
              <Input
                id="title"
                value={articleForm.title}
                onChange={(e) =>
                  setArticleForm({ ...articleForm, title: e.target.value })
                }
                placeholder="Enter article title"
                required
                data-testid="input-article-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={articleForm.description}
                onChange={(e) =>
                  setArticleForm({
                    ...articleForm,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description or summary of the article"
                rows={3}
                required
                data-testid="input-article-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn Article URL *</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={articleForm.linkedinUrl}
                onChange={(e) =>
                  setArticleForm({
                    ...articleForm,
                    linkedinUrl: e.target.value,
                  })
                }
                placeholder="https://www.linkedin.com/pulse/..."
                required
                data-testid="input-article-url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publishDate">Publish Date *</Label>
              <Input
                id="publishDate"
                type="date"
                value={articleForm.publishDate}
                onChange={(e) =>
                  setArticleForm({
                    ...articleForm,
                    publishDate: e.target.value,
                  })
                }
                required
                data-testid="input-article-date"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="featured" className="text-base">
                  Featured Article
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display this article prominently on the Articles page
                </p>
              </div>
              <Switch
                id="featured"
                checked={articleForm.featured}
                onCheckedChange={(checked) =>
                  setArticleForm({ ...articleForm, featured: checked })
                }
                data-testid="switch-article-featured"
              />
            </div>

            <div className="space-y-2">
              <Label>Article PDF (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a PDF version of the article that readers can view or
                download
              </p>
              <div className="flex items-center gap-3">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleGetPDFUploadParams}
                  onComplete={handlePDFUploadComplete}
                  buttonClassName="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {articleForm.pdfUrl ? "Change PDF" : "Upload PDF"}
                </ObjectUploader>
                {articleForm.pdfUrl && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="gap-1"
                      data-testid="badge-pdf-uploaded"
                    >
                      <FileText className="w-3 h-3" />
                      PDF Uploaded
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setArticleForm({ ...articleForm, pdfUrl: "" })
                      }
                      data-testid="button-remove-pdf"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setArticleDialogOpen(false)}
                className="flex-1"
                data-testid="button-cancel-article"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  createArticleMutation.isPending ||
                  updateArticleMutation.isPending
                }
                data-testid="button-save-article"
              >
                {editingArticle ? "Update Article" : "Create Article"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <Dialog
        open={testimonialDialogOpen}
        onOpenChange={(open) => {
          setTestimonialDialogOpen(open);
          if (!open) setEditingTestimonial(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTestimonial} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="t-name">Name</Label>
                <Input
                  id="t-name"
                  value={testimonialForm.name}
                  onChange={(e) =>
                    setTestimonialForm({
                      ...testimonialForm,
                      name: e.target.value,
                    })
                  }
                  required
                  data-testid="input-testimonial-name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-title">Title</Label>
                <Input
                  id="t-title"
                  value={testimonialForm.title}
                  onChange={(e) =>
                    setTestimonialForm({
                      ...testimonialForm,
                      title: e.target.value,
                    })
                  }
                  required
                  data-testid="input-testimonial-title"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-company">Company</Label>
              <Input
                id="t-company"
                value={testimonialForm.company}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    company: e.target.value,
                  })
                }
                required
                data-testid="input-testimonial-company"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-quote">Quote</Label>
              <Textarea
                id="t-quote"
                value={testimonialForm.quote}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    quote: e.target.value,
                  })
                }
                required
                rows={3}
                data-testid="input-testimonial-quote"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-outcome">Outcome (optional)</Label>
              <Input
                id="t-outcome"
                value={testimonialForm.outcome}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    outcome: e.target.value,
                  })
                }
                data-testid="input-testimonial-outcome"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="t-category">Category</Label>
                <Select
                  value={testimonialForm.category}
                  onValueChange={(v) =>
                    setTestimonialForm({ ...testimonialForm, category: v })
                  }
                >
                  <SelectTrigger data-testid="select-testimonial-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-order">Display Order</Label>
                <Input
                  id="t-order"
                  type="number"
                  value={testimonialForm.displayOrder}
                  onChange={(e) =>
                    setTestimonialForm({
                      ...testimonialForm,
                      displayOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  data-testid="input-testimonial-order"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="t-featured">Featured</Label>
              <Switch
                id="t-featured"
                checked={testimonialForm.featured}
                onCheckedChange={(checked) =>
                  setTestimonialForm({ ...testimonialForm, featured: checked })
                }
                data-testid="switch-testimonial-featured"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setTestimonialDialogOpen(false)}
                data-testid="button-cancel-testimonial"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  createTestimonialMutation.isPending ||
                  updateTestimonialMutation.isPending
                }
                data-testid="button-save-testimonial"
              >
                {editingTestimonial ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Case Study Dialog */}
      <Dialog
        open={caseStudyDialogOpen}
        onOpenChange={(open) => {
          setCaseStudyDialogOpen(open);
          if (!open) setEditingCaseStudy(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCaseStudy ? "Edit Case Study" : "Add Case Study"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCaseStudy} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="cs-title">Title</Label>
              <Input
                id="cs-title"
                value={caseStudyForm.title}
                onChange={(e) =>
                  setCaseStudyForm({ ...caseStudyForm, title: e.target.value })
                }
                required
                data-testid="input-casestudy-title"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cs-client">Client Label</Label>
              <Input
                id="cs-client"
                value={caseStudyForm.clientLabel}
                onChange={(e) =>
                  setCaseStudyForm({
                    ...caseStudyForm,
                    clientLabel: e.target.value,
                  })
                }
                required
                placeholder="e.g. Regional Hospice Provider"
                data-testid="input-casestudy-client"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cs-challenge">Challenge</Label>
              <Textarea
                id="cs-challenge"
                value={caseStudyForm.challenge}
                onChange={(e) =>
                  setCaseStudyForm({
                    ...caseStudyForm,
                    challenge: e.target.value,
                  })
                }
                required
                rows={2}
                data-testid="input-casestudy-challenge"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cs-solution">Solution</Label>
              <Textarea
                id="cs-solution"
                value={caseStudyForm.solution}
                onChange={(e) =>
                  setCaseStudyForm({
                    ...caseStudyForm,
                    solution: e.target.value,
                  })
                }
                required
                rows={2}
                data-testid="input-casestudy-solution"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cs-results">Results (one per line)</Label>
              <Textarea
                id="cs-results"
                value={caseStudyForm.results}
                onChange={(e) =>
                  setCaseStudyForm({
                    ...caseStudyForm,
                    results: e.target.value,
                  })
                }
                required
                rows={3}
                placeholder={
                  "Referrals up 40%\nAverage census grew by 12 patients"
                }
                data-testid="input-casestudy-results"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cs-category">Category</Label>
                <Select
                  value={caseStudyForm.category}
                  onValueChange={(v) =>
                    setCaseStudyForm({ ...caseStudyForm, category: v })
                  }
                >
                  <SelectTrigger data-testid="select-casestudy-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cs-order">Display Order</Label>
                <Input
                  id="cs-order"
                  type="number"
                  value={caseStudyForm.displayOrder}
                  onChange={(e) =>
                    setCaseStudyForm({
                      ...caseStudyForm,
                      displayOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  data-testid="input-casestudy-order"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCaseStudyDialogOpen(false)}
                data-testid="button-cancel-casestudy"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  createCaseStudyMutation.isPending ||
                  updateCaseStudyMutation.isPending
                }
                data-testid="button-save-casestudy"
              >
                {editingCaseStudy ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
