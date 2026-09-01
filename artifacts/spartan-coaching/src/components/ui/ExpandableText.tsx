import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExpandableText({
  children,
  className,
  lines = 4,
}: {
  children: string;
  className?: string;
  lines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const isLong = children.trim().length > 180;

  return (
    <div className={cn("min-w-0", className)}>
      <p
        id={contentId}
        className={cn(
          "min-w-0 whitespace-normal break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere] [hyphens:auto]",
          !expanded && isLong && "overflow-hidden",
        )}
        style={
          !expanded && isLong
            ? {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: lines,
              }
            : undefined
        }
      >
        {children}
      </p>
      {isLong ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 min-h-11 px-0 font-bold text-primary"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      ) : null}
    </div>
  );
}
