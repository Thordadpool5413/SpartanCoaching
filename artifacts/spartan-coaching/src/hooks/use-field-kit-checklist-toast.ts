import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

/** Listens for auto-checklist completions and shows a professional toast. */
export function useFieldKitChecklistToast() {
  const { toast } = useToast();

  useEffect(() => {
    const onDone = (e: Event) => {
      const detail = (e as CustomEvent).detail as { label?: string } | undefined;
      toast({
        title: "Portal progress updated",
        description: detail?.label
          ? `Marked complete: ${detail.label}. See Portal for what's next.`
          : "Checklist item marked complete.",
      });
    };
    window.addEventListener("field-kit-checklist-done", onDone);
    return () => window.removeEventListener("field-kit-checklist-done", onDone);
  }, [toast]);
}
