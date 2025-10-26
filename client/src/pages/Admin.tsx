import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building, Calendar, Users } from "lucide-react";
import type { SelectInquiry, SelectNewsletterSubscriber } from "@shared/schema";

export default function Admin() {
  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery<{ inquiries: SelectInquiry[] }>({
    queryKey: ["/api/inquiries"],
  });

  const { data: subscribersData, isLoading: subscribersLoading } = useQuery<{ subscribers: SelectNewsletterSubscriber[] }>({
    queryKey: ["/api/newsletter/subscribers"],
  });

  const inquiries = inquiriesData?.inquiries || [];
  const subscribers = subscribersData?.subscribers || [];

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-4">Admin Dashboard</h1>
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
