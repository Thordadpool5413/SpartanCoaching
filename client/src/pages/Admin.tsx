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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Phone, Building, Calendar, Users, Lock, LogOut, Plus, Edit, Trash2, ExternalLink, Star } from "lucide-react";
import type { SelectInquiry, SelectNewsletterSubscriber, SelectArticle, InsertArticle, VisitorAnalytics } from "@shared/schema";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const ADMIN_CODE = "5413";
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

  const inquiries = inquiriesData?.inquiries || [];
  const subscribers = subscribersData?.subscribers || [];
  const articles = articlesData?.articles || [];
  const analytics = analyticsData?.analytics;

  // Article form state
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<SelectArticle | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: "",
    description: "",
    linkedinUrl: "",
    publishDate: new Date().toISOString().split('T')[0],
    featured: false,
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
    });
  };

  const handleEditArticle = (article: SelectArticle) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      description: article.description,
      linkedinUrl: article.linkedinUrl,
      publishDate: new Date(article.publishDate).toISOString().split('T')[0],
      featured: article.featured,
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
    };

    if (editingArticle) {
      updateArticleMutation.mutate({ id: editingArticle.id, data });
    } else {
      createArticleMutation.mutate(data);
    }
  };

  const handleDeleteArticle = (id: number) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      deleteArticleMutation.mutate(id);
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
    <div className="container mx-auto px-6 py-12">
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

      <Tabs defaultValue="inquiries" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="inquiries" data-testid="tab-inquiries">
            Inquiries ({inquiries.length})
          </TabsTrigger>
          <TabsTrigger value="subscribers" data-testid="tab-subscribers">
            Subscribers ({subscribers.length})
          </TabsTrigger>
          <TabsTrigger value="articles" data-testid="tab-articles">
            Articles ({articles.length})
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
    </div>
  );
}
