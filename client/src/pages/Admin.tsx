import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Phone, Building, Calendar, Users, Lock, LogOut } from "lucide-react";
import type { SelectInquiry, SelectNewsletterSubscriber } from "@shared/schema";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";

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

  const inquiries = inquiriesData?.inquiries || [];
  const subscribers = subscribersData?.subscribers || [];

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
          Manage inquiries and newsletter subscribers
        </p>
      </div>

      <Tabs defaultValue="inquiries" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="inquiries" data-testid="tab-inquiries">
            Inquiries ({inquiries.length})
          </TabsTrigger>
          <TabsTrigger value="subscribers" data-testid="tab-subscribers">
            Subscribers ({subscribers.length})
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
      </Tabs>
    </div>
  );
}
