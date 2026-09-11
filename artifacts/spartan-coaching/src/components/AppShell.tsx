import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
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
import {
  primaryWorkspaceNav,
  utilityWorkspaceNav,
  workspaceNavForRole,
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

function SidebarBody({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const { member, canUseFieldKit, logout } = useAuth();
  const primary = primaryWorkspaceNav(member?.role);
  const utility = utilityWorkspaceNav(member?.role).filter(
    (i) => i.id !== "settings" && i.id !== "recent" && i.id !== "notifications",
  );

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="field-brand-zone">
        <Link href="/portal" onClick={onNavigate} className="flex items-center gap-3 w-full" data-testid="workspace-brand">
          <img
            src="/spartan-logo.png"
            alt="Spartan"
            className="field-brand-mark"
          />
          {!collapsed && (
            <div className="field-brand-text">
              <strong>Spartan</strong>
              <small>Hospice Sales Pro</small>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-none" aria-label="Workspace navigation" data-testid="workspace-nav">
        {!collapsed && <div className="field-nav-group-label">Work</div>}
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
            {!collapsed && <div className="field-nav-group-label mt-4">Admin</div>}
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

      <div className="p-4 border-t border-border space-y-2">
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
          <div className="grid grid-cols-2 gap-2 mt-2 md:hidden">
            <AppearanceControls compact testId="workspace-mobile-appearance" />
            <Button
              type="button"
              variant="outline"
              className="justify-start border-border text-foreground hover:bg-muted"
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
      className={cn("field-nav-link", active && "active", collapsed && "justify-center")}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      data-testid={testId}
    >
      <Icon aria-hidden />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
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
  const [searchUsingLocal, setSearchUsingLocal] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const corpus = useMemo(() => workspaceSearchCorpus(), []);
  const currentSection = useMemo(
    () => workspaceNavForRole(member?.role).find((item) => item.match(location)),
    [location, member?.role],
  );
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

  useEffect(() => {
    const q = searchQ.trim();
    if (q.length < 2 || !member) {
      setApiHits(null);
      setSearchLoading(false);
      setSearchUsingLocal(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const t = window.setTimeout(() => {
      void fetchUniversalSearch(q, 20)
        .then((data) => {
          if (!cancelled) {
            setApiHits(flattenSearchHits(data));
            setSearchUsingLocal(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setApiHits(null);
            setSearchUsingLocal(true);
          }
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

  useEffect(() => {
    setActiveSearchIndex(-1);
  }, [searchQ, results.length]);

  useEffect(() => {
    if (activeSearchIndex < 0) return;
    document
      .getElementById(`workspace-search-option-${activeSearchIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeSearchIndex]);

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

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveSearchIndex(-1);
      return;
    }
    if (!searchOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setSearchOpen(true);
    }
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSearchIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSearchIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeSearchIndex >= 0) {
      event.preventDefault();
      go(results[activeSearchIndex].path);
    }
  };

  return (
    <div
      className="field-workspace"
      data-testid="app-shell"
      data-workspace-shell={WORKSPACE_SHELL_VERSION}
    >
      <aside
        className={cn(
          "field-sidebar hidden md:flex",
          collapsed ? "w-[4.5rem]" : "w-[16rem]"
        )}
        data-testid="workspace-sidebar"
      >
        <SidebarBody collapsed={collapsed} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="field-topbar" data-testid="workspace-topbar">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0 mr-2 hover:bg-muted rounded-md"
                aria-label="Open workspace menu"
                data-testid="workspace-mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[min(100vw,20rem)] border-r border-border bg-card">
              <SheetHeader className="sr-only">
                <SheetTitle>Workspace menu</SheetTitle>
              </SheetHeader>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex shrink-0 mr-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
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

          <div
            ref={searchContainerRef}
            className="field-search-container"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setSearchOpen(false);
                setActiveSearchIndex(-1);
              }
            }}
          >
            <Search className="field-search-icon" aria-hidden />
            <Input
              value={searchQ}
              onChange={(e) => {
                setSearchQ(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search workspace…"
              className="field-search-input"
              aria-label="Universal workspace search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={searchOpen}
              aria-controls="workspace-search-results"
              aria-activedescendant={activeSearchIndex >= 0 ? `workspace-search-option-${activeSearchIndex}` : undefined}
              data-testid="workspace-search"
            />
            {searchOpen && (
              <div id="workspace-search-results" className="field-search-results" role="listbox" aria-label="Workspace search results" data-testid="workspace-search-results">
                {searchLoading ? (
                  <p className="px-4 py-4 text-[13px] leading-relaxed font-mono uppercase tracking-[0.08em] text-muted-foreground text-center" role="status">Searching…</p>
                ) : null}
                {!searchLoading && results.length === 0 ? (
                  <p className="px-4 py-6 text-[13px] leading-relaxed font-mono uppercase tracking-[0.08em] text-muted-foreground text-center">No matches</p>
                ) : (
                  results.map((item, index) => (
                    <button
                      key={`${item.path}-${item.label}`}
                      id={`workspace-search-option-${index}`}
                      type="button"
                      tabIndex={-1}
                      role="option"
                      aria-selected={activeSearchIndex === index}
                      className={cn("field-search-result-item", activeSearchIndex === index && "active")}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActiveSearchIndex(index)}
                      onClick={() => go(item.path)}
                      data-testid={`workspace-search-${item.path.replace(/[^a-z0-9]+/gi, "-")}`}
                    >
                      <span className="field-search-result-title">{item.label}</span>
                      <span className="field-search-result-desc" title={item.description}>{item.description}</span>
                    </button>
                  ))
                )}
                <div className="px-4 py-2.5 bg-muted/50 border-t border-border text-[11px] leading-relaxed text-muted-foreground font-mono uppercase tracking-[0.08em]">
                  {searchUsingLocal ? "Local results · live search unavailable" : apiHits ? "Live search" : "Local catalog"}
                </div>
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
            {!canUseFieldKit && (
              <Button size="sm" asChild className="hidden sm:inline-flex font-mono font-bold uppercase tracking-[0.08em] text-xs rounded-sm bg-primary text-primary-foreground hover:bg-primary/90" data-testid="workspace-subscribe-cta">
                <Link href="/account">Unlock tools</Link>
              </Button>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:inline-flex text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  aria-label="Recent activity"
                  data-testid="workspace-recent"
                >
                  <Clock className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0 border-border shadow-lg rounded-md bg-card">
                <div className="px-4 py-3 bg-muted/50 border-b border-border">
                  <span className="text-xs font-mono font-bold tracking-[0.08em] uppercase text-muted-foreground">
                    Recent activity
                  </span>
                </div>
                <div className="py-2 max-h-[300px] overflow-y-auto">
                  {recent.length === 0 ? (
                      <p className="px-4 py-4 text-[13px] leading-relaxed font-mono uppercase tracking-[0.08em] text-muted-foreground text-center">
                      Visit tools and resources.
                    </p>
                  ) : (
                    recent.map((r) => (
                      <button
                        key={`${r.path}-${r.at}`}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0"
                        onClick={() => go(r.path)}
                      >
                        <span className="block text-sm font-semibold text-foreground mb-1">{r.label}</span>
                        <span className="block text-xs leading-relaxed font-mono text-muted-foreground truncate" title={r.path}>
                          {r.path}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <NotificationCenter />

            <div className="hidden sm:block">
              <AppearanceControls compact testId="workspace-appearance" />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              aria-label="Sign out"
              data-testid="workspace-logout"
              onClick={() => void logout()}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex min-h-11 items-center justify-between gap-3 border-b border-border/70 bg-card/35 px-4 sm:px-6" aria-label="Current workspace section" data-testid="workspace-section-context">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <span className="font-mono font-bold uppercase tracking-[0.16em] text-primary">Workspace</span>
            <span className="text-border" aria-hidden>/</span>
            <span className="truncate font-semibold text-foreground">{currentSection?.label ?? "Current work"}</span>
          </div>
          <span className="hidden text-[11px] font-mono font-bold uppercase tracking-[0.1em] text-muted-foreground sm:inline">Private · nonclinical</span>
        </div>

        <main id="main-content" className="flex-1 min-w-0" tabIndex={-1}>
          {children}
        </main>

        <footer className="field-footer" aria-label="Workspace footer">
          <span>Hospice Sales Pro</span>
          <Link href="/services">Consulting</Link>
          <Link href="/faq">Support</Link>
          <Link href="/legal">Privacy and terms</Link>
        </footer>
      </div>
    </div>
  );
}
