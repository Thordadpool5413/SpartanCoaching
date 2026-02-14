import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  variant?: "full" | "compact";
  className?: string;
}

export function MarkdownContent({ content, variant = "full", className }: MarkdownContentProps) {
  const isCompact = variant === "compact";

  return (
    <div className={cn("markdown-content", variant === "compact" ? "markdown-compact" : "", className)} data-testid="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className={cn("font-bold text-foreground", isCompact ? "text-base mt-3 mb-1" : "text-xl mt-6 mb-3 first:mt-0")}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={cn("font-semibold text-foreground", isCompact ? "text-base mt-2 mb-1" : "text-lg mt-5 mb-2 first:mt-0")}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={cn("font-semibold text-foreground", isCompact ? "text-sm mt-2 mb-1" : "text-base mt-4 mb-2 first:mt-0")}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className={cn("text-sm leading-relaxed text-foreground", isCompact ? "mb-2 last:mb-0" : "mb-3 last:mb-0")}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className={cn("list-disc list-outside text-sm text-foreground", isCompact ? "ml-4 mb-2 space-y-0.5" : "ml-5 mb-3 space-y-1")}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={cn("list-decimal list-outside text-sm text-foreground", isCompact ? "ml-4 mb-2 space-y-0.5" : "ml-5 mb-3 space-y-1")}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">
              {children}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote className={cn("border-l-4 border-primary pl-4 py-1 bg-accent/30 rounded-r-md italic text-muted-foreground text-sm", isCompact ? "my-2" : "my-3")}>
              {children}
            </blockquote>
          ),
          code: ({ children, className: codeClassName, ...props }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("text-xs font-mono", codeClassName)} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-muted p-4 rounded-md overflow-x-auto mb-3 text-xs font-mono">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <table className="w-full border-collapse mb-4 text-sm">
              {children}
            </table>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-foreground">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="even:bg-muted/20">
              {children}
            </tr>
          ),
          hr: () => (
            <hr className="border-border my-4" />
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-primary hover:underline">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
