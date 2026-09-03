import type { ReactNode } from "react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

type AccentTextProps = {
  children: ReactNode;
  accent?: string;
  className?: string;
};

function splitAtAccent(text: string, accent?: string) {
  const normalized = text.trim();
  if (!normalized) return null;

  if (accent) {
    const index = normalized.toLocaleLowerCase().lastIndexOf(accent.toLocaleLowerCase());
    if (index >= 0) {
      return {
        before: normalized.slice(0, index),
        highlighted: normalized.slice(index, index + accent.length),
        after: normalized.slice(index + accent.length),
      };
    }
  }

  const lastWord = normalized.match(/^(.*?)([^\s]+)$/);
  if (!lastWord) return { before: "", highlighted: normalized, after: "" };
  return { before: lastWord[1], highlighted: lastWord[2], after: "" };
}

/**
 * Adds one deliberate Spartan-red phrase to ink-heavy display copy.
 * Explicit JSX remains untouched so copy-specific emphasis always wins.
 */
export function AccentText({ children, accent, className }: AccentTextProps) {
  if (typeof children !== "string") return <Fragment>{children}</Fragment>;

  const parts = splitAtAccent(children, accent);
  if (!parts) return null;

  return (
    <>
      {parts.before}
      <span className={cn("text-spartan-red", className)}>{parts.highlighted}</span>
      {parts.after}
    </>
  );
}