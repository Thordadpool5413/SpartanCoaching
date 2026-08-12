/**
 * Continue + Recommended today + recents (HSP-37) — explainable, removable.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Star, X, RotateCcw, Loader2 } from "lucide-react";
import {
  fetchPersonalization,
  recordPersonalizationEvent,
  updatePersonalization,
  type PersonalizationView,
} from "@/lib/personalizationClient";
import { useAuth } from "@/context/AuthContext";
import { getToolById } from "@/lib/fieldKitCatalog";

export function PersonalizationPanel() {
  const { isAuthenticated, canUseFieldKit } = useAuth();
  const [view, setView] = useState<PersonalizationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setView(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPersonalization();
      setView(data);
    } catch {
      setError("Could not load your workspace preferences.");
      setView(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!isAuthenticated) return null;

  const toolLabel = (id: string) => getToolById(id)?.title || id;

  return (
    <section className="mb-8 space-y-4" data-testid="section-personalization" aria-label="Your workspace">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
            For you
          </p>
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">
            Continue & recommended today
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Lightweight preferences that follow you across devices. Every suggestion includes a short
            reason — nothing opaque.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-semibold"
            disabled={loading}
            onClick={() =>
              void updatePersonalization({ clearRecent: true }).then(setView).catch(() => undefined)
            }
            data-testid="personalization-clear-recent"
          >
            Clear recents
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="font-semibold"
            disabled={loading}
            onClick={() => {
              if (
                !window.confirm(
                  "Reset favorites, pins, recents, and dismissed suggestions for this account?",
                )
              ) {
                return;
              }
              void updatePersonalization({ reset: true }).then(setView).catch(() => undefined);
            }}
            data-testid="personalization-reset"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" aria-hidden />
            Reset all
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Loading your workspace…
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {view && !loading ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="border border-border p-4 sm:p-5 space-y-3" data-testid="personalization-continue">
            <h3 className="text-sm font-bold text-foreground">Continue</h3>
            {view.continueItems.length === 0 ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {view.emptyHistory
                  ? "No drafts or recents yet — open a tool or Command Center to build history."
                  : "Nothing in progress. Open a tool to continue later."}
              </p>
            ) : (
              <ul className="space-y-2">
                {view.continueItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="block rounded-lg border border-border/80 px-3 py-2.5 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() =>
                        void recordPersonalizationEvent({
                          action: "open",
                          item: {
                            kind: item.kind === "draft" ? "saved_work" : "page",
                            id: item.id,
                            title: item.title,
                            href: item.href,
                          },
                        }).then(setView)
                      }
                    >
                      <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                        {item.title}
                        <ArrowRight className="w-3.5 h-3.5 text-primary" aria-hidden />
                      </span>
                      <span className="text-xs text-muted-foreground leading-snug block mt-0.5">
                        {item.why}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="border border-border p-4 sm:p-5 space-y-3" data-testid="personalization-recommended">
            <h3 className="text-sm font-bold text-foreground">Recommended today</h3>
            {view.recommendedToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recommendations — pin a tool or clear dismissals.
              </p>
            ) : (
              <ul className="space-y-2">
                {view.recommendedToday.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 rounded-lg border border-border/80 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={item.href}
                        className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{item.why}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      aria-label={`Dismiss ${item.title}`}
                      onClick={() =>
                        void updatePersonalization({
                          dismissRecommendationId: item.id,
                        }).then(setView)
                      }
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="border border-border p-4 sm:p-5 space-y-3 lg:col-span-2" data-testid="personalization-favorites">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Star className="w-4 h-4 text-primary" aria-hidden />
                Favorites & pins
              </h3>
              {canUseFieldKit ? (
                <p className="text-xs text-muted-foreground">
                  Star tools from Tools pages (or use quick pins below).
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {["objections", "sales-workflow", "weekly-plan", "role-play"].map((id) => {
                const fav = view.payload.favorites.tools.includes(id);
                const pin = view.payload.pinnedTools.includes(id);
                return (
                  <div
                    key={id}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs"
                  >
                    <Link href={getToolById(id)?.path || "/tools"} className="font-semibold text-foreground">
                      {toolLabel(id)}
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant={fav ? "default" : "outline"}
                      className="h-7 px-2 text-[11px] font-bold"
                      onClick={() =>
                        void recordPersonalizationEvent({
                          action: fav ? "unfavorite_tool" : "favorite_tool",
                          item: { id, kind: "tool", title: toolLabel(id) },
                        }).then(setView)
                      }
                      data-testid={`personalization-fav-${id}`}
                    >
                      {fav ? "Favorited" : "Favorite"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={pin ? "default" : "outline"}
                      className="h-7 px-2 text-[11px] font-bold"
                      onClick={() =>
                        void recordPersonalizationEvent({
                          action: pin ? "unpin_tool" : "pin_tool",
                          item: { id, kind: "tool", title: toolLabel(id) },
                        }).then(setView)
                      }
                      data-testid={`personalization-pin-${id}`}
                    >
                      {pin ? "Pinned" : "Pin"}
                    </Button>
                  </div>
                );
              })}
            </div>
            {view.payload.recent.length > 0 ? (
              <div className="pt-2 border-t border-border/60">
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
                  Recent (synced)
                </p>
                <ul className="flex flex-wrap gap-2">
                  {view.payload.recent.slice(0, 8).map((r) => (
                    <li key={`${r.kind}-${r.id}-${r.at}`}>
                      <Link
                        href={r.href}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {r.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}
    </section>
  );
}
