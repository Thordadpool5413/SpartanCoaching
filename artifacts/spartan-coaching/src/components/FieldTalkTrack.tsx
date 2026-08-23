import { SpeakerIcon } from "@/components/icons";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ToolResultPanel } from "@/components/ToolResultPanel";
import { ReminderPicker } from "@/components/ReminderPicker";
import { FIELD_KIT_PHI } from "@/lib/complianceCopy";
import { ToolResultActions } from "@/components/ToolResultActions";

/**
 * Field-ready talk-track presentation for objection-style AI outputs.
 */
export function FieldTalkTrack({
  title = "Talk track for the room",
  content,
  copyText,
  loading,
  empty,
  onReadAloud,
  reading,
  reminderTitle,
  citations,
  copyTestId,
  readAloudTestId,
  nextToolHref = "/tools/role-play",
  nextToolLabel = "Practice this in Role-Play",
  toolId = "objections",
}: {
  title?: string;
  content?: string;
  copyText?: string;
  loading?: boolean;
  empty?: boolean;
  onReadAloud?: () => void;
  reading?: boolean;
  reminderTitle?: string;
  citations?: Array<{ id: string; title: string; category: string }>;
  copyTestId?: string;
  readAloudTestId?: string;
  nextToolHref?: string;
  nextToolLabel?: string;
  toolId?: string;
}) {
  return (
    <ToolResultPanel
      title={title}
      copyText={copyText ?? content}
      loading={loading}
      empty={empty && !content && !loading}
      disclaimer={`${FIELD_KIT_PHI.result} Do not sound scripted.`}
      className="shadow-sm"
      copyTestId={copyTestId}
      footer={
        content ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onReadAloud && (
              <button
                type="button"
                onClick={onReadAloud}
                disabled={reading}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                data-testid={readAloudTestId}
              >
                <SpeakerIcon className="w-4 h-4" />
                {reading ? "Playing…" : "Practice aloud"}
              </button>
            )}
            {reminderTitle && <ReminderPicker title={reminderTitle} />}
          </div>
        ) : undefined
      }
      actions={
        content ? (
          <ToolResultActions
            toolId={toolId}
            title="Turn the response into field work"
            description="Say it once aloud, then use the next action to prepare for the real conversation."
            actions={[
              {
                id: "next-tool",
                label: nextToolLabel,
                href: nextToolHref,
              },
            ]}
            persistenceNote="This talk track is shown for this session. Copy it if you need a working copy; it is not automatically saved to My Work."
            testId="talk-track-next-action"
          />
        ) : undefined
      }
    >
      {content ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
            <p className="text-[10px] font-bold tracking-widest uppercase text-primary mb-2">
              Say this
            </p>
            <div className="text-foreground leading-relaxed">
              <MarkdownContent content={content} />
            </div>
          </div>
          {citations && citations.length > 0 && (
            <div className="rounded-md border border-border/80 bg-background/50 px-3 py-2 space-y-1">
              <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Spartan sources
              </p>
              <ul className="space-y-0.5">
                {citations.map((c) => (
                  <li key={c.id} className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.title}</span>
                    <span> · {c.category}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </ToolResultPanel>
  );
}
