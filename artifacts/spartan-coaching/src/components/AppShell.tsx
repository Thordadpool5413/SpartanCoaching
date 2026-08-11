/**
 * Paid Hospice Sales Pro application shell (HSP-32).
 * Desktop sidebar + top bar; responsive sheet/bottom affordances for tablet/mobile.
 * Marketing chrome (footer, chat, book-call sticky) stays out of this shell.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell,
  Clock,
  LogOut,
  Menu,
  Search,
  PanelLeftClose,
  PanelLeft,
  UserCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AppearanceControls } from "@/components/AppearanceControls";
import {
  primaryWorkspaceNav,
  utilityWorkspaceNav,
  pushWorkspaceRecent,
  readWorkspaceRecent,
  type WorkspaceRecentEntry,
  WORKSPACE_SHELL_VERSION,
} from "@/lib/workspaceShell";
import { allSearchablePages } from "@/lib/navigation";
import { FIELD_KIT_TOOLS } from "@/lib/fieldKitCatalog";

function workspaceSearchCorpus() {
  const toolPages = FIELD_KIT_TOOLS.map((t) => ({
    path: t.path,
    label: t.title,
    description: t.description,
  }));
  const fromSite = allSearchablePages.filter(
    (p) =>
      p.path.startsWith("/tools") ||
      p.path.startsWith("/resources") ||
      p.path.startsWith("/portal") ||
      p.path.startsWith("/account") ||
      p.path.startsWith("/admin") ||
      p.path === "/drills" ||
      p.path === "/quiz" ||
      p.path.startsWith("/learn"),
  );
  const merged = [...toolPages, ...fromSite];
  return merged.filter(
    (item, i, arr) => arr.findIndex((x) => x.path === item.path) === i,
  );
}

function NavLinkRow({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
  testId,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  testId?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors min-h-11",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        collapsed && "justify-center px-2",
      )}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      data-testid={testId}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SidebarBody({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const { member, canUseFieldKit, organization } = useAuth();
  const primary = primaryWorkspaceNav(member?.role);
  const utility = utilityWorkspaceNav(member?.role).filter(
    (i) => i.id !== "settings" && i.id !== "recent" && i.id !== "notifications",
  );

  return (
    <div className="flex flex-col h-full">
      <div className={cn("px-3 py-4 border-b border-border/60", collapsed && "px-2")}>
        <Link
          href="/portal"
          onClick={onNavigate}
          className="flex items-center gap-2 min-w-0"
          data-testid="workspace-brand"
        >
          <img
            src="/spartan-logo-stamp.png"
            alt=""
            className="h-8 w-8 shrink-0 object-contain"
            width={32}
            height={32}
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-widest uppercase text-primary">
                Hospice Sales Pro
              </p>
              <p className="text-sm font-bold text-foreground truncate leading-tight">
                Workspace
              </p>
            </div>
          )}
        </Link>
        {!collapsed && (
          <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
            {canUseFieldKit
              ? organization?.name || "Member workspace"
              : "Account · subscribe to unlock live tools"}
          </p>
        )}
      </div>

      <nav
        className="flex-1 overflow-y-auto px-2 py-3 space-y-1"
        aria-label="Workspace navigation"
        data-testid="workspace-nav"
      >
        {!collapsed && (
          <p className="px-2 pb-1 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            Work
          </p>
        )}
        {primary.map((item) => (
          <NavLinkRow
            key={item.id}
            href={item.href}
            label={item.short ?? item.label}
            icon={item.icon}
            active={item.match(location)}
            collapsed={collapsed}
            onNavigate={onNavigate}
            testId={`workspace-nav-${item.id}`}
          />
        ))}
        {utility.length > 0 && (
          <>
            {!collapsed && (
              <p className="px-2 pt-4 pb-1 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Admin
              </p>
            )}
            {utility.map((item) => (
              <NavLinkRow
                key={item.id}
                href={item.href}
                label={item.short ?? item.label}
                icon={item.icon}
                active={item.match(location)}
                collapsed={collapsed}
                onNavigate={onNavigate}
                testId={`workspace-nav-${item.id}`}
              />
            ))}
          </>
        )}
      </nav>

      <div className={cn("border-t border-border/60 p-3 space-y-2", collapsed && "px-2")}>
        <NavLinkRow
          href="/account"
          label="Account settings"
          icon={UserCircle}
          active={location === "/account" || location.startsWith("/account/")}
          collapsed={collapsed}
          onNavigate={onNavigate}
          testId="workspace-nav-settings"
        />
        {!collapsed && (
          <p className="text-[10px] text-muted-foreground px-1" data-testid="workspace-shell-version">
            {WORKSPACE_SHELL_VERSION}
          </p>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { member, logout, canUseFieldKit } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [recent, setRecent] = useState<WorkspaceRecentEntry[]>([]);

  const corpus = useMemo(() => workspaceSearchCorpus(), []);
  const results = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return corpus.slice(0, 8);
    return corpus
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.path.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [corpus, searchQ]);

  // Track recent activity for signed-in workspace navigation
  useEffect(() => {
    const path = location.split("?")[0] || location;
    if (!path.startsWith("/")) return;
    const hit = corpus.find((c) => c.path === path);
    const label = hit?.label ?? path;
    pushWorkspaceRecent({ path, label });
    setRecent(readWorkspaceRecent(8));
  }, [location, corpus]);

  useEffect(() => {
    setRecent(readWorkspaceRecent(8));
  }, []);

  const go = (path: string) => {
    setLocation(path);
    setSearchOpen(false);
    setSearchQ("");
    setMobileOpen(false);
  };

  return (
    <div
      className="flex min-h-screen bg-background text-foreground"
      data-testid="app-shell"
      data-workspace-shell={WORKSPACE_SHELL_VERSION}
    >
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border/80 bg-card/40 shrink-0 transition-[width] duration-200",
          collapsed ? "w-[4.25rem]" : "w-60 lg:w-64",
        )}
        data-testid="workspace-sidebar"
      >
        <SidebarBody collapsed={collapsed} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md safe-area-top"
          data-testid="workspace-topbar"
        >
          <div className="flex items-center gap-2 sm:gap-3 h-14 px-3 sm:px-4 lg:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  aria-label="Open workspace menu"
                  data-testid="workspace-mobile-menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[min(100vw,20rem)]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Workspace menu</SheetTitle>
                </SheetHeader>
                <SidebarBody onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex shrink-0"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              data-testid="workspace-sidebar-toggle"
            >
              {collapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </Button>

            {/* Universal search */}
            <div className="relative flex-1 max-w-xl">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                aria-hidden
              />
              <Input
                value={searchQ}
                onChange={(e) => {
                  setSearchQ(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => {
                  // allow click on results
                  window.setTimeout(() => setSearchOpen(false), 150);
                }}
                placeholder="Search tools, resources, workspace…"
                className="pl-9 h-10 bg-muted/40 border-border/80"
                aria-label="Universal workspace search"
                data-testid="workspace-search"
              />
              {searchOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-popover shadow-lg max-h-[min(50dvh,24rem)] overflow-y-auto z-50"
                  data-testid="workspace-search-results"
                >
                  {results.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                      No matches
                    </p>
                  ) : (
                    results.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => go(item.path)}
                        data-testid={`workspace-search-${item.path.replace(/[^a-z0-9]+/gi, "-")}`}
                      >
                        <div className="text-sm font-semibold text-foreground">
                          {item.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {item.description}
                        </div>
                      </button>
                    ))
                  )}
                  <p className="px-4 py-2 text-[10px] text-muted-foreground border-t border-border/50">
                    Tip: Ctrl/Cmd+K also opens the command palette
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {!canUseFieldKit && (
                <Button size="sm" asChild className="hidden sm:inline-flex font-bold" data-testid="workspace-subscribe-cta">
                  <Link href="/account">Unlock tools</Link>
                </Button>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Recent activity"
                    data-testid="workspace-recent"
                  >
                    <Clock className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-2">
                  <p className="px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Recent activity
                  </p>
                  {recent.length === 0 ? (
                    <p className="px-2 py-4 text-sm text-muted-foreground">
                      Visit tools and resources — they appear here.
                    </p>
                  ) : (
                    recent.map((r) => (
                      <button
                        key={`${r.path}-${r.at}`}
                        type="button"
                        className="w-full text-left rounded-lg px-2 py-2 text-sm hover:bg-muted/60"
                        onClick={() => go(r.path)}
                      >
                        <span className="font-semibold text-foreground">{r.label}</span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {r.path}
                        </span>
                      </button>
                    ))
                  )}
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notifications"
                    data-testid="workspace-notifications"
                  >
                    <Bell className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-3">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
                    Notifications
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {canUseFieldKit
                      ? "No new product alerts. Coaching and trial notices appear in Account when available."
                      : "Subscribe or start evaluation to unlock live tool runs and org notices."}
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                    <Link href="/account">Account & access</Link>
                  </Button>
                </PopoverContent>
              </Popover>

              <AppearanceControls compact testId="workspace-appearance" />

              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                data-testid="workspace-logout"
                onClick={() => void logout()}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {member && (
            <div className="hidden sm:flex items-center justify-between px-4 lg:px-6 pb-2 -mt-1">
              <p className="text-[11px] text-muted-foreground truncate">
                Signed in as{" "}
                <span className="font-semibold text-foreground">{member.name || member.email}</span>
                {member.role === "org_admin" || member.role === "platform_admin" ? (
                  <span className="ml-2 text-primary font-semibold">· {member.role.replace("_", " ")}</span>
                ) : null}
              </p>
              <Link
                href="/"
                className="text-[11px] font-semibold text-muted-foreground hover:text-primary shrink-0"
                data-testid="workspace-to-marketing"
              >
                Public site
              </Link>
            </div>
          )}
        </header>

        <main id="main-content" className="flex-1 min-w-0" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
