/**
 * Paid Hospice Sales Pro application shell (HSP-32).
 * Desktop sidebar + top bar; responsive sheet/bottom affordances for tablet/mobile.
 * Marketing chrome (footer, chat, book-call sticky) stays out of this shell.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Clock,
  LogOut,
  Menu,
  Search,
  PanelLeftClose,
  PanelLeft,
  UserCircle,
} from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
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
import { BrandBackdrop } from "@/components/BrandBackdrop";
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
import {
  fetchUniversalSearch,
  flattenSearchHits,
  type UniversalSearchHit,
} from "@/lib/universalSearchClient";
import { recordPersonalizationEvent } from "@/lib/personalizationClient";

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

type LocalResult = { path: string; label: string; description: string; group?: string };

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
  const { member, canUseFieldKit, organization, logout } = useAuth();
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
          <div className="grid grid-cols-2 gap-2 pt-1 md:hidden">
            <AppearanceControls compact testId="workspace-mobile-appearance" />
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() => void logout()}
              data-testid="workspace-mobile-logout"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
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
  const [apiHits, setApiHits] = useState<UniversalSearchHit[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const corpus = useMemo(() => workspaceSearchCorpus(), []);
  const localResults: LocalResult[] = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return corpus.slice(0, 8).map((c) => ({ ...c, group: "Workspace" }));
    return corpus
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.path.toLowerCase().includes(q),
      )
      .slice(0, 12)
      .map((c) => ({ ...c, group: "Workspace" }));
  }, [corpus, searchQ]);

  // Permission-aware backend search when signed in (HSP-36)
  useEffect(() => {
    const q = searchQ.trim();
    if (q.length < 2 || !member) {
      setApiHits(null);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const t = window.setTimeout(() => {
      void fetchUniversalSearch(q, 20)
        .then((data) => {
          if (!cancelled) setApiHits(flattenSearchHits(data));
        })
        .catch(() => {
          if (!cancelled) setApiHits(null);
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [searchQ, member]);

  const results: LocalResult[] = useMemo(() => {
    if (apiHits && apiHits.length > 0) {
      return apiHits.map((h) => ({
        path: h.href,
        label: h.title,
        description: h.snippet ? `${h.group} · ${h.snippet}` : h.group,
        group: h.group,
      }));
    }
    return localResults;
  }, [apiHits, localResults]);

  // Track recent activity locally + sync to backend (HSP-37 multi-device)
  useEffect(() => {
    const path = location.split("?")[0] || location;
    if (!path.startsWith("/")) return;
    const hit = corpus.find((c) => c.path === path);
    const label = hit?.label ?? path;
    pushWorkspaceRecent({ path, label });
    setRecent(readWorkspaceRecent(8));
    if (!member) return;
    const tool = FIELD_KIT_TOOLS.find((t) => t.path === path || path.startsWith(t.path + "/"));
    void recordPersonalizationEvent({
      action: "open",
      item: {
        kind: tool
          ? tool.id === "sales-workflow"
            ? "workflow"
            : "tool"
          : path.startsWith("/resources")
            ? "resource"
            : "page",
        id: tool?.id || path,
        title: tool?.title || label,
        href: path,
      },
    }).catch(() => undefined);
  }, [location, corpus, member]);

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
      className="workspace-premium flex min-h-screen bg-background text-foreground"
      data-testid="app-shell"
      data-workspace-shell={WORKSPACE_SHELL_VERSION}
    >
      <BrandBackdrop />
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "workspace-sidebar hidden md:flex flex-col border-r border-border/80 bg-card/40 shrink-0 transition-[width] duration-200",
          collapsed ? "w-[4.25rem]" : "w-60 lg:w-64",
        )}
        data-testid="workspace-sidebar"
      >
        <SidebarBody collapsed={collapsed} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="workspace-topbar sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md safe-area-top"
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
                placeholder="Search workspace…"
                className="pl-9 h-10 bg-muted/40 border-border/80"
                aria-label="Universal workspace search"
                data-testid="workspace-search"
              />
              {searchOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-popover shadow-lg max-h-[min(50dvh,24rem)] overflow-y-auto z-50"
                  data-testid="workspace-search-results"
                >
                  {searchLoading ? (
                    <p className="px-4 py-4 text-sm text-muted-foreground text-center" role="status">
                      Searching…
                    </p>
                  ) : null}
                  {!searchLoading && results.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                      No matches
                    </p>
                  ) : (
                    results.map((item) => (
                      <button
                        key={`${item.path}-${item.label}`}
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
                    {apiHits ? "Live search · " : "Local catalog · "}
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
                    className="hidden sm:inline-flex"
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

              <NotificationCenter />

              <div className="hidden sm:block">
                <AppearanceControls compact testId="workspace-appearance" />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex"
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
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/"
                  className="text-[11px] font-semibold text-muted-foreground hover:text-primary"
                  data-testid="workspace-to-marketing"
                >
                  Public site
                </Link>
              </div>
            </div>
          )}
        </header>

        <main id="main-content" className="flex-1 min-w-0" tabIndex={-1}>
          {children}
        </main>
        <footer className="workspace-footer" aria-label="Workspace footer">
          <span>Hospice Sales Pro</span>
          <Link href="/services">Consulting</Link>
          <Link href="/faq">Support</Link>
          <Link href="/legal">Privacy and terms</Link>
        </footer>
      </div>
    </div>
  );
}
