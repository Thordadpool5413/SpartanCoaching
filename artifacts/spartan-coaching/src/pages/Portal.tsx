import { AccentText } from "@/components/AccentText";
import { SEO } from "@/components/SEO";
import { FieldKitGate } from "@/components/FieldKitGate";
import { MembershipActivation } from "@/components/MembershipActivation";
import { ElitePortalHome, type NextMoveData } from "@/components/elite/ElitePortalHome";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback, useRef } from "react";
import { Switch } from "@/components/ui/switch";

export default function Portal() {
  const { member, canUseFieldKit, isLoading: authLoading } = useAuth();
  const [alsoLeadsTeam, setAlsoLeadsTeam] = useState(false);

  const [nextMove, setNextMove] = useState<NextMoveData | null>(null);
  const [loadingNextMove, setLoadingNextMove] = useState(true);
  const [nextMoveError, setNextMoveError] = useState(false);
  const [leadershipSaving, setLeadershipSaving] = useState(false);
  const [leadershipError, setLeadershipError] = useState<string | null>(null);
  const leadershipTouchedRef = useRef(false);
  const nextMoveRequestRef = useRef(0);

  useEffect(() => {
    if (!canUseFieldKit) return;
    void fetch("/api/me/onboarding", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!leadershipTouchedRef.current) {
          setAlsoLeadsTeam(Boolean(data?.member?.alsoLeadsTeam));
        }
      })
      .catch(() => undefined);
  }, [canUseFieldKit]);

  const loadNextMove = useCallback(async () => {
    const requestId = ++nextMoveRequestRef.current;
    setLoadingNextMove(true);
    setNextMoveError(false);
    try {
      const res = await fetch("/api/v1/workspace/next-move", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load next move");
      const data = await res.json();
      if (requestId === nextMoveRequestRef.current) {
        setNextMove(data?.recommendation || null);
      }
    } catch {
      if (requestId === nextMoveRequestRef.current) {
        setNextMoveError(true);
      }
    } finally {
      if (requestId === nextMoveRequestRef.current) {
        setLoadingNextMove(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!canUseFieldKit) return;
    void loadNextMove();
  }, [canUseFieldKit, loadNextMove]);

  async function updateLeadershipPreference(checked: boolean) {
    leadershipTouchedRef.current = true;
    const previous = alsoLeadsTeam;
    setAlsoLeadsTeam(checked);
    setLeadershipSaving(true);
    setLeadershipError(null);
    try {
      const response = await fetch("/api/me/onboarding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alsoLeadsTeam: checked }),
      });
      if (!response.ok) throw new Error("Could not save your recommendation preference.");
    } catch {
      setAlsoLeadsTeam(previous);
      setLeadershipError("Could not save your preference. Try again.");
      return;
    } finally {
      setLeadershipSaving(false);
    }
    void loadNextMove();
  }

  if (authLoading) {
    return <div className="grid min-h-[60vh] place-items-center" role="status"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /><span className="sr-only">Loading workspace</span></div>;
  }

  if (!canUseFieldKit) return <FieldKitGate />;

  return (
    <>
      <SEO title="Hospice Sales Pro Workspace | Spartan Coaching" noIndex />
      <MembershipActivation />
      <section id="section-mission-next" aria-labelledby="portal-next-action-heading" aria-live="polite">
        <h1 id="portal-next-action-heading" className="sr-only"><AccentText>Your Hospice Sales Pro workspace</AccentText></h1>
        <ElitePortalHome
          firstName={member?.name?.split(" ")[0] || ""}
          nextMove={nextMove}
          loading={loadingNextMove}
          error={nextMoveError}
          onRetry={loadNextMove}
        />
        <div className="mx-auto -mt-3 w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
          <details className="rounded-xl border border-border/70 bg-card/40 p-5">
            <summary className="cursor-pointer text-[15px] font-bold text-foreground">Personalize recommendations</summary>
            <div className="mt-5 flex items-center justify-between gap-6 border-t border-border/60 pt-5">
              <div><p className="text-[15px] font-semibold text-foreground">I also lead a team</p><p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">Include leadership and coaching recommendations in your workspace.</p></div>
              <Switch checked={alsoLeadsTeam} disabled={leadershipSaving} onCheckedChange={(checked) => void updateLeadershipPreference(checked)} data-testid="switch-also-leads-team" aria-label="I also lead a team" aria-describedby={leadershipError ? "leadership-preference-error" : undefined} />
            </div>
            {leadershipSaving ? <p className="mt-4 text-sm text-muted-foreground" role="status">Saving preference…</p> : null}
            {leadershipError ? <p id="leadership-preference-error" className="mt-4 text-sm text-destructive" role="alert">{leadershipError}</p> : null}
          </details>
        </div>
      </section>
    </>
  );
}
