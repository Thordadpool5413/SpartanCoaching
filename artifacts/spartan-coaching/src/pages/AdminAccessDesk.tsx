import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { AdminAuthGate } from "@/components/AdminAuthGate";
import { AccessDesk } from "@/components/AccessDesk";
import { LayoutDashboard } from "lucide-react";

/** Lightweight ops surface — avoids loading the full Admin CMS monolith. */
export default function AdminAccessDesk() {
  return (
    <>
      <SEO title="Access Desk | Spartan Coaching" noIndex />
      <AdminAuthGate
        title="Access Desk"
        headerExtra={
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/admin">
              <LayoutDashboard className="w-4 h-4" />
              Full admin CMS
            </Link>
          </Button>
        }
      >
        <AccessDesk />
      </AdminAuthGate>
    </>
  );
}
