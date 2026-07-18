import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export type DocumentSection = {
  heading: string;
  body: string | string[];
};

export function buildDocumentHtml(
  title: string,
  subtitle: string,
  sections: DocumentSection[]
) {
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);
  const renderedSections = sections
    .map((section) => {
      const bodyItems = Array.isArray(section.body) ? section.body : section.body.split("\n");
      return `
        <section style="margin-bottom: 20px;">
          <h2 style="font-size: 16px; margin: 0 0 8px; color: #0f172a;">${escapeHtml(section.heading)}</h2>
          ${bodyItems
            .filter(Boolean)
            .map((line) => `<p style="margin: 0 0 8px; line-height: 1.55; color: #1f2937;">${escapeHtml(line)}</p>`)
            .join("")}
        </section>
      `;
    })
    .join("");

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 36px;
            color: #0f172a;
            background: #fff;
          }
          h1, h2, p { margin: 0; }
        </style>
      </head>
      <body>
        <h1 style="font-size: 24px; margin-bottom: 8px;">${safeTitle}</h1>
        <p style="font-size: 13px; color: #475569; margin-bottom: 24px;">${safeSubtitle}</p>
        ${renderedSections}
      </body>
    </html>
  `;
}

export async function sharePdfDocument(options: {
  title: string;
  subtitle?: string;
  sections: DocumentSection[];
}) {
  const html = buildDocumentHtml(options.title, options.subtitle ?? "", options.sections);
  const file = await Print.printToFileAsync({ html });

  if (!(await Sharing.isAvailableAsync())) {
    return file.uri;
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "application/pdf",
    dialogTitle: options.title,
    UTI: "com.adobe.pdf",
  });

  return file.uri;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

