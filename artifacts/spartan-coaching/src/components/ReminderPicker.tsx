import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useReminderHistory, REMINDER_PRESETS, type PendingReminder } from "@/hooks/use-reminder-history";
import { cn } from "@/lib/utils";

export function ReminderPicker({
  title,
  contact = "",
  onScheduled,
}: {
  title: string;
  contact?: string;
  onScheduled?: () => void;
}) {
  const { addReminder } = useReminderHistory();
  const { toast } = useToast();
  const [scheduledLabel, setScheduledLabel] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState<string | null>(null);
  const [contactInput, setContactInput] = useState(contact);
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setContactInput(contact);
  }, [contact]);

  const handleSchedule = async (minutes: number, presetLabel: string) => {
    setScheduling(presetLabel);

    const scheduledFor = Date.now() + minutes * 60_000;
    const contactName = contactInput.trim();
    const id = `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const reminderTitle = title || "Follow-Up Reminder";
    const body = contactName
      ? `Follow up with ${contactName}`
      : "Time for your follow-up";

    const reminder: PendingReminder = {
      id,
      title: reminderTitle,
      body,
      scheduledFor,
      contact: contactName || undefined,
      presetLabel,
    };

    addReminder(reminder);

    const delay = scheduledFor - Date.now();
    const t = setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification(reminderTitle, { body });
      }
    }, delay);
    timeoutRefs.current.set(id, t);

    setScheduledLabel(presetLabel);
    setScheduling(null);
    onScheduled?.();

    toast({
      title: "Reminder set",
      description: contactName
        ? `You'll be reminded to follow up with ${contactName} ${presetLabel.toLowerCase()}.`
        : `Reminder set for ${presetLabel.toLowerCase()}.`,
    });
  };

  const requestAndSchedule = async (minutes: number, presetLabel: string) => {
    if (!("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return;
    }
    if (Notification.permission === "denied") {
      toast({
        title: "Notifications blocked",
        description: "Enable notifications in your browser settings to use reminders.",
        variant: "destructive",
      });
      return;
    }
    if (Notification.permission !== "granted") {
      const result = await Notification.requestPermission();
      if (result !== "granted") {
        toast({
          title: "Permission denied",
          description: "Reminders require notification permission.",
          variant: "destructive",
        });
        return;
      }
    }
    await handleSchedule(minutes, presetLabel);
  };

  if (scheduledLabel) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
        <Bell className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="flex-1 text-foreground">
          {contactInput.trim() ? (
            <>
              Reminder for{" "}
              <span className="font-semibold">{contactInput.trim()}</span>{" "}
              set for <span className="font-semibold">{scheduledLabel}</span>
            </>
          ) : (
            <>
              Reminder set for{" "}
              <span className="font-semibold">{scheduledLabel}</span>
            </>
          )}
        </span>
        <button
          onClick={() => setScheduledLabel(null)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Change reminder"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">
          Set follow-up reminder
        </span>
      </div>
      <Input
        placeholder="Contact name (optional)"
        value={contactInput}
        onChange={(e) => setContactInput(e.target.value)}
        className="text-sm"
        data-testid="input-reminder-contact"
      />
      <div className="flex flex-wrap gap-2">
        {REMINDER_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            disabled={!!scheduling}
            onClick={() => requestAndSchedule(preset.minutes, preset.label)}
            className={cn("text-xs font-medium", scheduling === preset.label && "opacity-60")}
            data-testid={`button-reminder-${preset.label.replace(/\s/g, "-").toLowerCase()}`}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
