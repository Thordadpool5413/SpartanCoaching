import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FieldKitChrome } from "@/components/FieldKitChrome";
import { ToolHowTo } from "@/components/ToolHowTo";
import { getToolByPath } from "@/lib/fieldKitCatalog";
import { cn } from "@/lib/utils";

/**
 * Standard shell for every Field Kit tool page:
 * chrome (what + nav) → breadcrumbs → when/how/why → page content.
 */
export function FieldKitToolLayout({
  children,
  className,
  /** Override path detection (defaults to current location) */
  toolPath,
  /** Fallback crumb title when path is not in the tool catalog */
  title,
  /** Learn items (drills) use Learn parent instead of Tools */
  section = "tools",
  showHowTo = true,
  showChrome = true,
}: {
  children: ReactNode;
  className?: string;
  toolPath?: string;
  title?: string;
  section?: "tools" | "learn";
  showHowTo?: boolean;
  showChrome?: boolean;
}) {
  const [location] = useLocation();
  const path = toolPath ?? location.split("?")[0];
  const tool = getToolByPath(path);
  const crumbTitle = tool?.title ?? title;

  const crumbs =
    section === "learn"
      ? [
          { label: "Field Kit", href: "/portal" },
          { label: "Learn", href: "/portal/learn" },
          ...(crumbTitle ? [{ label: crumbTitle }] : []),
        ]
      : [
          { label: "Field Kit", href: "/portal" },
          { label: "Tools", href: "/tools" },
          ...(crumbTitle ? [{ label: crumbTitle }] : []),
        ];

  return (
    <div
      className={cn("w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16", className)}
      data-testid="field-kit-tool-layout"
    >
      {showChrome && <FieldKitChrome />}
      <Breadcrumbs items={crumbs} />
      {showHowTo && tool && <ToolHowTo tool={tool} />}
      {children}
    </div>
  );
}
