import { useFieldKitChecklistToast } from "@/hooks/use-field-kit-checklist-toast";

/** Mount once near app root so tool pages get checklist feedback. */
export function FieldKitChecklistToast() {
  useFieldKitChecklistToast();
  return null;
}
