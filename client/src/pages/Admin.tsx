import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Phone, Building, Calendar, Users, Lock, LogOut, Plus, Edit, Trash2, ExternalLink, Star, FileText as FileSignature, PlayCircle, Target, Quote, Award, ChevronDown, ChevronUp } from "lucide-react";
import type { SelectInquiry, SelectNewsletterSubscriber, SelectArticle, InsertArticle, VisitorAnalytics, SelectResource, InsertResource, SelectPodcast, InsertPodcast, SelectSignedAgreement, SelectRoleplaySession, SelectDrillCompletion, SelectTestimonial, SelectCaseStudy, InsertTestimonial, InsertCaseStudy } from "@shared/schema";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { FileText } from "lucide-react";
import { SEO } from "@/components/SEO";

const ADMIN_CODE = import.meta.env.VITE_ADMIN_PASSWORD || "5413";
const ADMIN_AUTH_KEY = "spartan-admin-auth";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  const { toast } = useToast();

  // Check localStorage on mount
  useEffect(() => {
    const authStatus = localStorage.getItem(ADMIN_AUTH_KEY);
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordInput === ADMIN_CODE) {
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
      localStorage.setItem(ADMIN_AUTH_KEY, "true");
      toast({
        title: "Access Granted",
        description: "Welcome to the admin dashboard",
      });
      setPasswordInput("");
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowPasswordDialog(true);
    localStorage.removeItem(ADMIN_AUTH_KEY);
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin dashboard",
    });
  };

  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery<{ inquiries: SelectInquiry[] }>({
    queryKey: ["/api/inquiries"],
    enabled: isAuthenticated,
  });

  const { data: subscribersData, isLoading: subscribersLoading } = useQuery<{ subscribers: SelectNewsletterSubscriber[] }>({
    queryKey: ["/api/newsletter/subscribers"],
    enabled: isAuthenticated,
  });

  const { data: articlesData, isLoading: articlesLoading } = useQuery<{ articles: SelectArticle[] }>({
    queryKey: ["/api/articles"],
    enabled: isAuthenticated,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<{ analytics: VisitorAnalytics }>({
    queryKey: ["/api/analytics/visitors"],
    enabled: isAuthenticated,
  });

  const { data: resourcesData, isLoading: resourcesLoading } = useQuery<{ resources: SelectResource[] }>({
    queryKey: ["/api/resources"],
    enabled: isAuthenticated,
  });

  const { data: podcastsData, isLoading: podcastsLoading } = useQuery<{ podcasts: SelectPodcast[] }>({
    queryKey: ["/api/podcasts"],
    enabled: isAuthenticated,
  });

  const { data: agreementsData, isLoading: agreementsLoading } = useQuery<{ agreements: SelectSignedAgreement[] }>({
    queryKey: ["/api/signed-agreements"],
    enabled: isAuthenticated,
  });

  const { data: roleplaySessionsData, isLoading: roleplaySessionsLoading } = useQuery<{ sessions: SelectRoleplaySession[] }>({
    queryKey: ["/api/roleplay/sessions"],
    enabled: isAuthenticated,
  });

  const { data: drillCompletionsData, isLoading: drillCompletionsLoading } = useQuery<{ completions: SelectDrillCompletion[] }>({
    queryKey: ["/api/drills/completions"],
    enabled: isAuthenticated,
  });

  const { data: testimonialsData, isLoading: testimonialsLoading } = useQuery<{ testimonials: SelectTestimonial[] }>({
    queryKey: ["/api/testimonials"],
    enabled: isAuthenticated,
  });

  const { data: caseStudiesData, isLoading: caseStudiesLoading } = useQuery<{ caseStudies: SelectCaseStudy[] }>({
    queryKey: ["/api/case-studies"],
    enabled: isAuthenticated,
  });

  const { data: eventAnalyticsData, isLoading: eventAnalyticsLoading } = useQuery<{ analytics: { aiToolUsage: Array<{ eventName: string; count: number }>; resourceDownloads: Array<{ eventName: string; count: number }>; contactSubmissions: number } }>({
    queryKey: ["/api/analytics/events"],
    enabled: isAuthenticated,
  });

  const inquiries = inquiriesData?.inquiries || [];
  const subscribers = subscribersData?.subscribers || [];
  const articles = articlesData?.articles || [];
  const analytics = analyticsData?.analytics;
  const resources = resourcesData?.resources || [];
  const podcasts = podcastsData?.podcasts || [];
  const agreements = agreementsData?.agreements || [];
  const roleplaySessions = roleplaySessionsData?.sessions || [];
  const drillCompletions = drillCompletionsData?.completions || [];
  const testimonialsList = testimonialsData?.testimonials || [];
  const caseStudiesList = caseStudiesData?.caseStudies || [];

  // Article form state
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<SelectArticle | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: "",
    description: "",
    linkedinUrl: "",
    publishDate: new Date().toISOString().split('T')[0],
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
      publishDate: new Date().toISOString().split('T')[0],
      featured: false,
      pdfUrl: "",
    });
  };

  const handleEditArticle = (article: SelectArticle) => {
    setEditingArticle(article);
    // Convert timestamp to date string - handle both number and Date types
    const date = new Date(typeof article.publishDate === 'number' ? article.publishDate : parseInt(String(article.publishDate)));
    setArticleForm({
      title: article.title,
      description: article.description,
      linkedinUrl: article.linkedinUrl,
      publishDate: date.toISOString().split('T')[0],
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
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Auth": ADMIN_CODE,
      },
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

  const handlePDFUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      if (uploadURL) {
        try {
          const response = await fetch("/api/articles/normalize-pdf", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Admin-Auth": ADMIN_CODE,
            },
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
            description: "PDF has been successfully uploaded and is ready to use",
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

  // Resource form state
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    category: "",
    fileUrl: "",
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (data: InsertResource) => {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": ADMIN_CODE,
        },
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
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": ADMIN_CODE,
        },
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
        headers: {
          "X-Admin-Auth": ADMIN_CODE,
        },
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
  const [editingResource, setEditingResource] = useState<SelectResource | null>(null);

  const resetResourceForm = () => {
    setResourceForm({
      title: "",
      description: "",
      category: "",
      fileUrl: "",
    });
    setEditingResource(null);
  };

  const handleEditResource = (resource: SelectResource) => {
    setEditingResource(resource);
    setResourceForm({
      title: resource.title,
      description: resource.description || "",
      category: resource.category,
      fileUrl: resource.fileUrl,
    });
  };

  const handleSaveResource = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resourceForm.title || !resourceForm.category || !resourceForm.fileUrl) {
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
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Auth": ADMIN_CODE,
      },
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

  const handleResourceUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      
      const response = await fetch("/api/articles/normalize-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": ADMIN_CODE,
        },
        body: JSON.stringify({ uploadURL }),
      });

      if (!response.ok) {
        throw new Error("Failed to normalize PDF path");
      }

      const data = await response.json();
      setResourceForm(prev => ({ ...prev, fileUrl: data.normalizedPath }));
      
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
    publishDate: new Date().toISOString().split('T')[0],
    audioUrl: "",
  });

  // Create podcast mutation
  const createPodcastMutation = useMutation({
    mutationFn: async (data: InsertPodcast) => {
      const response = await fetch("/api/podcasts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": ADMIN_CODE,
        },
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
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": ADMIN_CODE,
        },
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
        headers: {
          "X-Admin-Auth": ADMIN_CODE,
        },
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
  const [editingPodcast, setEditingPodcast] = useState<SelectPodcast | null>(null);

  const resetPodcastForm = () => {
    setPodcastForm({
      title: "",
      description: "",
      episodeNumber: "",
      duration: "",
      publishDate: new Date().toISOString().split('T')[0],
      audioUrl: "",
    });
    setEditingPodcast(null);
  };

  const handleEditPodcast = (podcast: SelectPodcast) => {
    setEditingPodcast(podcast);
    // Convert timestamp to date string - handle both number and Date types
    const date = new Date(typeof podcast.publishDate === 'string' || podcast.publishDate instanceof Date ? podcast.publishDate : parseInt(String(podcast.publishDate)));
    setPodcastForm({
      title: podcast.title,
      description: podcast.description || "",
      episodeNumber: podcast.episodeNumber ? String(podcast.episodeNumber) : "",
      duration: podcast.duration || "",
      publishDate: date.toISOString().split('T')[0],
      audioUrl: podcast.audioUrl,
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
      episodeNumber: podcastForm.episodeNumber ? parseInt(podcastForm.episodeNumber) : undefined,
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
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Auth": ADMIN_CODE,
      },
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

  const handleAudioUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      
      const response = await fetch("/api/articles/normalize-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": ADMIN_CODE,
        },
        body: JSON.stringify({ uploadURL }),
      });

      if (!response.ok) {
        throw new Error("Failed to normalize audio path");
      }

      const data = await response.json();
      setPodcastForm(prev => ({ ...prev, audioUrl: data.normalizedPath }));
      
      toast({
        title: "Upload Complete",
        description: "Audio file has been successfully uploaded",
      });
    }
  };

  const handleDeletePodcast = (id: number) => {
    if (window.confirm("Are you sure you want to delete this podcast episode?")) {
      deletePodcastMutation.mutate(id);
    }
  };

  // Testimonial state
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<SelectTestimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({ name: "", title: "", company: "", quote: "", outcome: "", category: "individual", featured: false, displayOrder: 0 });
  const [expandedAgreement, setExpandedAgreement] = useState<number | null>(null);

  const adminFetch = async (method: string, url: string, data?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "X-Admin-Auth": ADMIN_CODE },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const createTestimonialMutation = useMutation({
    mutationFn: async (data: InsertTestimonial) => adminFetch("POST", "/api/testimonials", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] }); setTestimonialDialogOpen(false); setEditingTestimonial(null); setTestimonialForm({ name: "", title: "", company: "", quote: "", outcome: "", category: "individual", featured: false, displayOrder: 0 }); toast({ title: "Testimonial saved" }); },
    onError: () => toast({ title: "Error", description: "Failed to save testimonial", variant: "destructive" }),
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTestimonial> }) => adminFetch("PUT", `/api/testimonials/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] }); setTestimonialDialogOpen(false); setEditingTestimonial(null); toast({ title: "Testimonial updated" }); },
    onError: () => toast({ title: "Error", description: "Failed to update testimonial", variant: "destructive" }),
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (id: number) => adminFetch("DELETE", `/api/testimonials/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] }); toast({ title: "Testimonial deleted" }); },
    onError: () => toast({ title: "Error", description: "Failed to delete testimonial", variant: "destructive" }),
  });

  const handleEditTestimonial = (t: SelectTestimonial) => {
    setEditingTestimonial(t);
    setTestimonialForm({ name: t.name, title: t.title, company: t.company, quote: t.quote, outcome: t.outcome, category: t.category, featured: t.featured, displayOrder: t.displayOrder });
    setTestimonialDialogOpen(true);
  };

  const handleSaveTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTestimonial) {
      updateTestimonialMutation.mutate({ id: editingTestimonial.id, data: testimonialForm });
    } else {
      createTestimonialMutation.mutate(testimonialForm);
    }
  };

  // Case study state
  const [caseStudyDialogOpen, setCaseStudyDialogOpen] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState<SelectCaseStudy | null>(null);
  const [caseStudyForm, setCaseStudyForm] = useState({ title: "", clientLabel: "", challenge: "", solution: "", results: "", category: "individual", displayOrder: 0 });

  const createCaseStudyMutation = useMutation({
    mutationFn: async (data: InsertCaseStudy) => adminFetch("POST", "/api/case-studies", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/case-studies"] }); setCaseStudyDialogOpen(false); setEditingCaseStudy(null); setCaseStudyForm({ title: "", clientLabel: "", challenge: "", solution: "", results: "", category: "individual", displayOrder: 0 }); toast({ title: "Case study saved" }); },
    onError: () => toast({ title: "Error", description: "Failed to save case study", variant: "destructive" }),
  });

  const updateCaseStudyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCaseStudy> }) => adminFetch("PUT", `/api/case-studies/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/case-studies"] }); setCaseStudyDialogOpen(false); setEditingCaseStudy(null); toast({ title: "Case study updated" }); },
    onError: () => toast({ title: "Error", description: "Failed to update case study", variant: "destructive" }),
  });

  const deleteCaseStudyMutation = useMutation({
    mutationFn: async (id: number) => adminFetch("DELETE", `/api/case-studies/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/case-studies"] }); toast({ title: "Case study deleted" }); },
    onError: () => toast({ title: "Error", description: "Failed to delete case study", variant: "destructive" }),
  });

  const handleEditCaseStudy = (s: SelectCaseStudy) => {
    setEditingCaseStudy(s);
    setCaseStudyForm({ title: s.title, clientLabel: s.clientLabel, challenge: s.challenge, solution: s.solution, results: s.results.join("\n"), category: s.category, displayOrder: s.displayOrder });
    setCaseStudyDialogOpen(true);
  };

  const handleSaveCaseStudy = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...caseStudyForm, results: caseStudyForm.results.split("\n").map(r => r.trim()).filter(Boolean) };
    if (editingCaseStudy) {
      updateCaseStudyMutation.mutate({ id: editingCaseStudy.id, data });
    } else {
      createCaseStudyMutation.mutate(data);
    }
  };

  // Show password dialog if not authenticated
  if (!isAuthenticated) {
    return (
      <Dialog open={showPasswordDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Admin Access Required</DialogTitle>
            <DialogDescription className="text-center">
              Please enter your admin password to continue
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
            <Input
              type="password"
              placeholder="Enter admin code"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={4}
              autoFocus
              data-testid="input-admin-password"
            />
            <Button 
              type="submit" 
              className="w-full bg-spartan-gradient hover:glow-primary"
              data-testid="button-submit-password"
            >
              Access Admin Dashboard
            </Button>
          </form>
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
        <h1 className="text-5xl font-black mb-4" data-testid="text-admin-title">Admin Dashboard</h1>
        <p className="text-xl text-muted-foreground">
          Manage inquiries, newsletter subscribers, and published articles
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Visitor Statistics</h2>
        {analyticsLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading visitor statistics...</p>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card data-testid="card-visitors-day">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-visitors-day">{analytics.day}</div>
                <p className="text-xs text-muted-foreground mt-1">visitors</p>
              </CardContent>
            </Card>

            <Card data-testid="card-visitors-week">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-visitors-week">{analytics.week}</div>
                <p className="text-xs text-muted-foreground mt-1">visitors</p>
              </CardContent>
            </Card>

            <Card data-testid="card-visitors-month">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-visitors-month">{analytics.month}</div>
                <p className="text-xs text-muted-foreground mt-1">visitors</p>
              </CardContent>
            </Card>

            <Card data-testid="card-visitors-quarter">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Quarter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-visitors-quarter">{analytics.quarter}</div>
                <p className="text-xs text-muted-foreground mt-1">visitors</p>
              </CardContent>
            </Card>

            <Card data-testid="card-visitors-year">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Year</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-visitors-year">{analytics.year}</div>
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
        {eventAnalyticsLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading event analytics...</p>
          </div>
        ) : eventAnalyticsData?.analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-ai-tool-usage">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">AI Tool Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {eventAnalyticsData.analytics.aiToolUsage.length > 0 ? (
                  <div className="space-y-2">
                    {eventAnalyticsData.analytics.aiToolUsage.map((item) => (
                      <div key={item.eventName} className="flex items-center justify-between" data-testid={`ai-tool-${item.eventName}`}>
                        <span className="text-sm capitalize">{item.eventName.replace(/_/g, " ")}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No AI tool usage recorded yet</p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-resource-downloads">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Resource Downloads</CardTitle>
              </CardHeader>
              <CardContent>
                {eventAnalyticsData.analytics.resourceDownloads.length > 0 ? (
                  <div className="space-y-2">
                    {eventAnalyticsData.analytics.resourceDownloads.map((item) => (
                      <div key={item.eventName} className="flex items-center justify-between gap-2" data-testid={`resource-download-${item.eventName}`}>
                        <span className="text-sm truncate">{item.eventName}</span>
                        <Badge variant="secondary" className="shrink-0">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No resource downloads recorded yet</p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-contact-submissions">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contact Form Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-contact-submissions">{eventAnalyticsData.analytics.contactSubmissions}</div>
                <p className="text-xs text-muted-foreground mt-1">total submissions tracked</p>
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

      <Tabs defaultValue="inquiries" className="space-y-6">
        <TabsList className="flex w-full max-w-6xl overflow-x-auto">
          <TabsTrigger value="inquiries" data-testid="tab-inquiries">
            Inquiries ({inquiries.length})
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
        </TabsList>

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
            inquiries.map((inquiry) => (
              <Card key={inquiry.id} data-testid={`inquiry-${inquiry.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{inquiry.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(inquiry.submittedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {inquiry.serviceType && (
                      <Badge variant="secondary">{inquiry.serviceType}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${inquiry.email}`} className="hover:underline">
                      {inquiry.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${inquiry.phone}`} className="hover:underline">
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
                    <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
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
                        {new Date(subscriber.subscribedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                <p className="text-muted-foreground">No articles yet. Click "Add Article" to create your first article.</p>
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
                          <CardTitle className="text-xl">{article.title}</CardTitle>
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
                    <p className="text-sm text-muted-foreground">{article.description}</p>
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
                Upload training materials, templates, scripts, and checklists for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveResource} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resource-title">Title *</Label>
                  <Input
                    id="resource-title"
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
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
                    onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                    placeholder="Brief description of this resource"
                    rows={3}
                    data-testid="input-resource-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resource-category">Category *</Label>
                  <Select
                    value={resourceForm.category}
                    onValueChange={(value) => setResourceForm({ ...resourceForm, category: value })}
                  >
                    <SelectTrigger id="resource-category" data-testid="select-resource-category">
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
                      <Badge variant="secondary" className="gap-1" data-testid="badge-file-uploaded">
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
                  {createResourceMutation.isPending ? "Adding..." : "Add Resource"}
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
                <p className="text-muted-foreground">No resources yet. Add your first resource above.</p>
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
                          <CardTitle className="text-xl">{resource.title}</CardTitle>
                          <Badge variant="outline">{resource.category}</Badge>
                        </div>
                        {resource.description && (
                          <CardDescription>{resource.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(resource.fileUrl, '_blank')}
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
                    onChange={(e) => setPodcastForm({ ...podcastForm, title: e.target.value })}
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
                    onChange={(e) => setPodcastForm({ ...podcastForm, description: e.target.value })}
                    placeholder="Brief description of the episode"
                    rows={3}
                    data-testid="input-podcast-description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="podcast-episode-number">Episode Number</Label>
                    <Input
                      id="podcast-episode-number"
                      type="number"
                      value={podcastForm.episodeNumber}
                      onChange={(e) => setPodcastForm({ ...podcastForm, episodeNumber: e.target.value })}
                      placeholder="e.g., 1"
                      data-testid="input-podcast-episode-number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="podcast-duration">Duration</Label>
                    <Input
                      id="podcast-duration"
                      value={podcastForm.duration}
                      onChange={(e) => setPodcastForm({ ...podcastForm, duration: e.target.value })}
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
                      onChange={(e) => setPodcastForm({ ...podcastForm, publishDate: e.target.value })}
                      required
                      data-testid="input-podcast-publish-date"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Audio File *</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload the podcast audio file (MP3, M4A, or other audio formats)
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
                          onClick={() => setPodcastForm({ ...podcastForm, audioUrl: "" })}
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
                  {createPodcastMutation.isPending ? "Adding..." : "Add Podcast"}
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
                <p className="text-muted-foreground">No podcast episodes yet. Add your first episode above.</p>
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
                            <Badge variant="outline">Episode {podcast.episodeNumber}</Badge>
                          )}
                          <CardTitle className="text-xl">{podcast.title}</CardTitle>
                        </div>
                        {podcast.description && (
                          <CardDescription>{podcast.description}</CardDescription>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{new Date(podcast.publishDate).toLocaleDateString()}</span>
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
              <p className="text-sm text-muted-foreground">{testimonialsList.length} quotes and {caseStudiesList.length} case studies</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setEditingTestimonial(null); setTestimonialForm({ name: "", title: "", company: "", quote: "", outcome: "", category: "individual", featured: false, displayOrder: 0 }); setTestimonialDialogOpen(true); }} data-testid="button-add-testimonial">
                <Plus className="w-4 h-4 mr-2" /> Add Quote
              </Button>
              <Button variant="outline" onClick={() => { setEditingCaseStudy(null); setCaseStudyForm({ title: "", clientLabel: "", challenge: "", solution: "", results: "", category: "individual", displayOrder: 0 }); setCaseStudyDialogOpen(true); }} data-testid="button-add-case-study">
                <Plus className="w-4 h-4 mr-2" /> Add Case Study
              </Button>
            </div>
          </div>

          {testimonialsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading testimonials...</div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Quotes</h3>
              {testimonialsList.length === 0 ? (
                <p className="text-muted-foreground text-sm">No testimonials yet.</p>
              ) : testimonialsList.map((t) => (
                <Card key={t.id} data-testid={`card-testimonial-${t.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{t.name}</CardTitle>
                        {t.featured && <Badge variant="secondary">Featured</Badge>}
                        <Badge variant="outline" className="text-xs">{t.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{t.title}, {t.company}</p>
                      <p className="text-sm mt-2 italic line-clamp-2">"{t.quote}"</p>
                      {t.outcome && <p className="text-xs text-muted-foreground mt-1">Outcome: {t.outcome}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="icon" variant="outline" onClick={() => handleEditTestimonial(t)} data-testid={`button-edit-testimonial-${t.id}`}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="outline" onClick={() => { if (window.confirm("Delete this testimonial?")) deleteTestimonialMutation.mutate(t.id); }} data-testid={`button-delete-testimonial-${t.id}`}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {caseStudiesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading case studies...</div>
          ) : (
            <div className="space-y-3 mt-4">
              <h3 className="font-semibold text-lg">Case Studies</h3>
              {caseStudiesList.length === 0 ? (
                <p className="text-muted-foreground text-sm">No case studies yet.</p>
              ) : caseStudiesList.map((s) => (
                <Card key={s.id} data-testid={`card-case-study-${s.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{s.title}</CardTitle>
                        <Badge variant="outline" className="text-xs">{s.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{s.clientLabel}</p>
                      <p className="text-sm mt-2 line-clamp-2">{s.challenge}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="icon" variant="outline" onClick={() => handleEditCaseStudy(s)} data-testid={`button-edit-case-study-${s.id}`}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="outline" onClick={() => { if (window.confirm("Delete this case study?")) deleteCaseStudyMutation.mutate(s.id); }} data-testid={`button-delete-case-study-${s.id}`}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Agreements Tab */}
        <TabsContent value="agreements" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Signed Agreements</h2>
            <p className="text-sm text-muted-foreground">{agreements.length} agreements on file</p>
          </div>

          {agreementsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading agreements...</div>
          ) : agreements.length === 0 ? (
            <Card><CardHeader><CardTitle className="text-base text-muted-foreground text-center py-4">No signed agreements yet.</CardTitle></CardHeader></Card>
          ) : (
            <div className="space-y-3">
              {agreements.map((ag) => (
                <Card key={ag.id} data-testid={`card-agreement-${ag.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4 cursor-pointer" onClick={() => setExpandedAgreement(expandedAgreement === ag.id ? null : ag.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{ag.signerName}</CardTitle>
                        <Badge variant="secondary" className="text-xs">{ag.agreementType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{ag.signerTitle} at {ag.signerOrganization}</p>
                      <p className="text-xs text-muted-foreground mt-1">{ag.signerEmail} &bull; Signed {ag.signedAt ? new Date(ag.signedAt).toLocaleDateString() : "Unknown"}</p>
                    </div>
                    <Button size="icon" variant="ghost">
                      {expandedAgreement === ag.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CardHeader>
                  {expandedAgreement === ag.id && (
                    <div className="px-6 pb-4 space-y-2 border-t pt-4">
                      <p className="text-sm"><span className="font-medium">Agreement Type:</span> {ag.agreementType}</p>
                      <p className="text-sm"><span className="font-medium">Organization:</span> {ag.signerOrganization}</p>
                      <p className="text-sm"><span className="font-medium">Email:</span> {ag.signerEmail}</p>
                      <p className="text-sm"><span className="font-medium">Date Signed:</span> {ag.signedAt ? new Date(ag.signedAt).toLocaleString() : "Unknown"}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Role-Play Tab */}
        <TabsContent value="roleplay" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Role-Play Sessions</h2>
            <p className="text-sm text-muted-foreground">{roleplaySessions.length} sessions recorded</p>
          </div>

          {roleplaySessionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>
          ) : (
            <>
              {roleplaySessions.length > 0 && (() => {
                const scoredSessions = roleplaySessions.filter(s => s.rating !== null && s.rating !== undefined);
                const avgScore = scoredSessions.length > 0 ? Math.round(scoredSessions.reduce((sum, s) => sum + (s.rating ?? 0), 0) / scoredSessions.length) : null;
                const scenarioCounts: Record<string, number> = {};
                roleplaySessions.forEach(s => { scenarioCounts[s.scenarioTitle] = (scenarioCounts[s.scenarioTitle] || 0) + 1; });
                const topScenario = Object.entries(scenarioCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                    <Card><CardHeader className="pb-2"><p className="text-sm text-muted-foreground">Total Sessions</p><p className="text-3xl font-bold">{roleplaySessions.length}</p></CardHeader></Card>
                    <Card><CardHeader className="pb-2"><p className="text-sm text-muted-foreground">Average Score</p><p className="text-3xl font-bold">{avgScore !== null ? `${avgScore}%` : "N/A"}</p></CardHeader></Card>
                    <Card><CardHeader className="pb-2"><p className="text-sm text-muted-foreground">Most Practiced</p><p className="text-base font-semibold leading-snug">{topScenario ?? "N/A"}</p></CardHeader></Card>
                  </div>
                );
              })()}

              {roleplaySessions.length === 0 ? (
                <Card><CardHeader><CardTitle className="text-base text-muted-foreground text-center py-4">No role-play sessions yet.</CardTitle></CardHeader></Card>
              ) : (
                <div className="space-y-3">
                  {roleplaySessions.map((session) => {
                    const rating = session.rating;
                    const scoreBadgeVariant = rating === null || rating === undefined ? "outline" : rating >= 80 ? "default" : rating >= 60 ? "secondary" : "destructive";
                    const scoreLabel = rating !== null && rating !== undefined ? `${rating}%` : "Unscored";
                    return (
                      <Card key={session.id} data-testid={`card-roleplay-${session.id}`}>
                        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">{session.scenarioTitle}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(session.createdAt).toLocaleDateString()} &bull; {session.status}
                            </p>
                          </div>
                          <Badge variant={scoreBadgeVariant} data-testid={`badge-score-${session.id}`}>{scoreLabel}</Badge>
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
            <p className="text-sm text-muted-foreground">{drillCompletions.length} total completions recorded</p>
          </div>

          {drillCompletionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading drills data...</div>
          ) : (
            <>
              {drillCompletions.length > 0 && (() => {
                const uniqueDrills = new Set(drillCompletions.map(c => c.drillIndex)).size;
                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const recentCount = drillCompletions.filter(c => c.completedAt >= sevenDaysAgo).length;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                    <Card><CardHeader className="pb-2"><p className="text-sm text-muted-foreground">Total Completions</p><p className="text-3xl font-bold">{drillCompletions.length}</p></CardHeader></Card>
                    <Card><CardHeader className="pb-2"><p className="text-sm text-muted-foreground">Unique Drills Practiced</p><p className="text-3xl font-bold">{uniqueDrills}</p></CardHeader></Card>
                    <Card><CardHeader className="pb-2"><p className="text-sm text-muted-foreground">Last 7 Days</p><p className="text-3xl font-bold">{recentCount}</p></CardHeader></Card>
                  </div>
                );
              })()}

              {drillCompletions.length === 0 ? (
                <Card><CardHeader><CardTitle className="text-base text-muted-foreground text-center py-4">No drill completions yet.</CardTitle></CardHeader></Card>
              ) : (
                <div className="space-y-3">
                  {drillCompletions.slice().sort((a, b) => b.completedAt - a.completedAt).slice(0, 50).map((completion) => (
                    <Card key={completion.id} data-testid={`card-drill-${completion.id}`}>
                      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">{completion.drillTitle}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Drill #{completion.drillIndex} &bull; {new Date(completion.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">Completed</Badge>
                      </CardHeader>
                    </Card>
                  ))}
                  {drillCompletions.length > 50 && (
                    <p className="text-sm text-muted-foreground text-center">Showing 50 most recent of {drillCompletions.length} total</p>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

      </Tabs>

      {/* Article Dialog */}
      <Dialog open={articleDialogOpen} onOpenChange={(open) => {
        setArticleDialogOpen(open);
        if (!open) {
          setEditingArticle(null);
          resetArticleForm();
        }
      }}>
        <DialogContent className="sm:max-w-2xl" data-testid="dialog-article-form">
          <DialogHeader>
            <DialogTitle>{editingArticle ? "Edit Article" : "Add New Article"}</DialogTitle>
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
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
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
                onChange={(e) => setArticleForm({ ...articleForm, description: e.target.value })}
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
                onChange={(e) => setArticleForm({ ...articleForm, linkedinUrl: e.target.value })}
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
                onChange={(e) => setArticleForm({ ...articleForm, publishDate: e.target.value })}
                required
                data-testid="input-article-date"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="featured" className="text-base">Featured Article</Label>
                <p className="text-sm text-muted-foreground">
                  Display this article prominently on the Articles page
                </p>
              </div>
              <Switch
                id="featured"
                checked={articleForm.featured}
                onCheckedChange={(checked) => setArticleForm({ ...articleForm, featured: checked })}
                data-testid="switch-article-featured"
              />
            </div>

            <div className="space-y-2">
              <Label>Article PDF (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a PDF version of the article that readers can view or download
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
                    <Badge variant="secondary" className="gap-1" data-testid="badge-pdf-uploaded">
                      <FileText className="w-3 h-3" />
                      PDF Uploaded
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setArticleForm({ ...articleForm, pdfUrl: "" })}
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
                disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
                data-testid="button-save-article"
              >
                {editingArticle ? "Update Article" : "Create Article"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <Dialog open={testimonialDialogOpen} onOpenChange={(open) => { setTestimonialDialogOpen(open); if (!open) setEditingTestimonial(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTestimonial} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="t-name">Name</Label>
                <Input id="t-name" value={testimonialForm.name} onChange={e => setTestimonialForm({ ...testimonialForm, name: e.target.value })} required data-testid="input-testimonial-name" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-title">Title</Label>
                <Input id="t-title" value={testimonialForm.title} onChange={e => setTestimonialForm({ ...testimonialForm, title: e.target.value })} required data-testid="input-testimonial-title" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-company">Company</Label>
              <Input id="t-company" value={testimonialForm.company} onChange={e => setTestimonialForm({ ...testimonialForm, company: e.target.value })} required data-testid="input-testimonial-company" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-quote">Quote</Label>
              <Textarea id="t-quote" value={testimonialForm.quote} onChange={e => setTestimonialForm({ ...testimonialForm, quote: e.target.value })} required rows={3} data-testid="input-testimonial-quote" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-outcome">Outcome (optional)</Label>
              <Input id="t-outcome" value={testimonialForm.outcome} onChange={e => setTestimonialForm({ ...testimonialForm, outcome: e.target.value })} data-testid="input-testimonial-outcome" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="t-category">Category</Label>
                <Select value={testimonialForm.category} onValueChange={v => setTestimonialForm({ ...testimonialForm, category: v })}>
                  <SelectTrigger data-testid="select-testimonial-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-order">Display Order</Label>
                <Input id="t-order" type="number" value={testimonialForm.displayOrder} onChange={e => setTestimonialForm({ ...testimonialForm, displayOrder: parseInt(e.target.value) || 0 })} data-testid="input-testimonial-order" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="t-featured">Featured</Label>
              <Switch id="t-featured" checked={testimonialForm.featured} onCheckedChange={checked => setTestimonialForm({ ...testimonialForm, featured: checked })} data-testid="switch-testimonial-featured" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setTestimonialDialogOpen(false)} data-testid="button-cancel-testimonial">Cancel</Button>
              <Button type="submit" className="flex-1" disabled={createTestimonialMutation.isPending || updateTestimonialMutation.isPending} data-testid="button-save-testimonial">
                {editingTestimonial ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Case Study Dialog */}
      <Dialog open={caseStudyDialogOpen} onOpenChange={(open) => { setCaseStudyDialogOpen(open); if (!open) setEditingCaseStudy(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCaseStudy ? "Edit Case Study" : "Add Case Study"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCaseStudy} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="cs-title">Title</Label>
              <Input id="cs-title" value={caseStudyForm.title} onChange={e => setCaseStudyForm({ ...caseStudyForm, title: e.target.value })} required data-testid="input-casestudy-title" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cs-client">Client Label</Label>
              <Input id="cs-client" value={caseStudyForm.clientLabel} onChange={e => setCaseStudyForm({ ...caseStudyForm, clientLabel: e.target.value })} required placeholder="e.g. Regional Hospice Provider" data-testid="input-casestudy-client" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cs-challenge">Challenge</Label>
              <Textarea id="cs-challenge" value={caseStudyForm.challenge} onChange={e => setCaseStudyForm({ ...caseStudyForm, challenge: e.target.value })} required rows={2} data-testid="input-casestudy-challenge" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cs-solution">Solution</Label>
              <Textarea id="cs-solution" value={caseStudyForm.solution} onChange={e => setCaseStudyForm({ ...caseStudyForm, solution: e.target.value })} required rows={2} data-testid="input-casestudy-solution" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cs-results">Results (one per line)</Label>
              <Textarea id="cs-results" value={caseStudyForm.results} onChange={e => setCaseStudyForm({ ...caseStudyForm, results: e.target.value })} required rows={3} placeholder={"Referrals up 40%\nAverage census grew by 12 patients"} data-testid="input-casestudy-results" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cs-category">Category</Label>
                <Select value={caseStudyForm.category} onValueChange={v => setCaseStudyForm({ ...caseStudyForm, category: v })}>
                  <SelectTrigger data-testid="select-casestudy-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cs-order">Display Order</Label>
                <Input id="cs-order" type="number" value={caseStudyForm.displayOrder} onChange={e => setCaseStudyForm({ ...caseStudyForm, displayOrder: parseInt(e.target.value) || 0 })} data-testid="input-casestudy-order" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCaseStudyDialogOpen(false)} data-testid="button-cancel-casestudy">Cancel</Button>
              <Button type="submit" className="flex-1" disabled={createCaseStudyMutation.isPending || updateCaseStudyMutation.isPending} data-testid="button-save-casestudy">
                {editingCaseStudy ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
