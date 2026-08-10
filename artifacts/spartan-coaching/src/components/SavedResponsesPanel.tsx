import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SavedResponse } from "@/hooks/useSavedResponses";

/**
 * Cross-device saved AI outputs (server-backed via /api/workspace/items).
 */
export function SavedResponsesPanel({
  items,
  onDelete,
  emptyLabel = "No saved responses yet. Save a result to use it on web and iOS.",
}: {
  items: SavedResponse[];
  onDelete: (id: string) => void;
  emptyLabel?: string;
}) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="saved-responses-empty">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="saved-responses-panel">
      {items.map((item) => (
        <Card
          key={item.id}
          className="border border-border p-4 space-y-2"
          data-testid={`saved-response-${item.id}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(item.savedAt).toLocaleString()}
                {item.version ? ` · v${item.version}` : " · local"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => onDelete(item.id)}
              data-testid={`button-delete-saved-${item.id}`}
            >
              Delete
            </Button>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-6">
            {item.response}
          </p>
        </Card>
      ))}
    </div>
  );
}
