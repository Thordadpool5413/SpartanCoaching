import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  kicker?: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
};

/** Consistent section header for marketing + product surfaces. */
export function SectionHeader({
  kicker,
  title,
  description,
  align = "center",
  className,
  titleClassName,
}: Props) {
  return (
    <div
      className={cn(
        "mb-8 max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {kicker && (
        <p
          className={cn(
            "text-kicker mb-3",
            align === "center" && "justify-center",
          )}
        >
          {kicker}
        </p>
      )}
      <h2
        className={cn(
          "text-h2 font-display font-black text-foreground tracking-tight",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground mt-3 leading-relaxed text-sm sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
