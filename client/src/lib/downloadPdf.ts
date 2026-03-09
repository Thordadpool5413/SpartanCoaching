export interface PdfSection {
  heading?: string;
  body: string;
}

export async function downloadPdf(
  filename: string,
  title: string,
  sections: PdfSection[],
  subtitle?: string
): Promise<void> {
  const res = await fetch("/api/pdf/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, title, subtitle, sections }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "PDF generation failed" }));
    throw new Error(err.error || "PDF generation failed");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function markdownToSections(markdown: string): PdfSection[] {
  const sections: PdfSection[] = [];
  const parts = markdown.split(/(?=^## )/m);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      const newlineIdx = trimmed.indexOf("\n");
      if (newlineIdx === -1) {
        sections.push({ heading: trimmed.replace(/^## /, ""), body: "" });
      } else {
        const heading = trimmed.substring(3, newlineIdx).trim();
        const body = cleanMarkdown(trimmed.substring(newlineIdx + 1).trim());
        sections.push({ heading, body });
      }
    } else {
      const body = cleanMarkdown(trimmed.replace(/^# .+\n?/, "").trim());
      if (body) sections.push({ body });
    }
  }

  return sections.length > 0 ? sections : [{ body: cleanMarkdown(markdown) }];
}

export function cleanMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}([\s\S]*?)`{1,3}/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + " ")
    .replace(/^---+$/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
