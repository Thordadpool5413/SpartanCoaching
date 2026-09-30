import OpenAI from "openai";
import JSZip from "jszip";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function assertClinicalFileSignature(contentType: string, bytes: Buffer): void {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  const valid = contentType === "application/pdf"
    ? bytes.subarray(0, 5).toString("ascii") === "%PDF-"
    : contentType === DOCX
      ? starts(0x50, 0x4b, 0x03, 0x04)
      : contentType === "image/png"
        ? starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
        : contentType === "image/jpeg"
          ? starts(0xff, 0xd8, 0xff)
          : contentType === "text/plain" && !bytes.includes(0);
  if (!valid) throw new Error("File content does not match the selected type");
}

function decodeXml(value: string) {
  return value.replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos);/gi, (matched, numeric: string, named: string) => {
    if (numeric) {
      const code = numeric.startsWith("x") ? parseInt(numeric.slice(1), 16) : parseInt(numeric, 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    }
    return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" } as Record<string, string>)[named] ?? matched;
  });
}

export async function extractPatientDocument(contentType: string, bytes: Buffer): Promise<string> {
  assertClinicalFileSignature(contentType, bytes);
  if (contentType === "text/plain") return bytes.toString("utf8");
  if (contentType === DOCX) {
    const zip = await JSZip.loadAsync(bytes);
    const main = zip.file("word/document.xml");
    if (!main) throw new Error("DOCX document content was not found");
    const uncompressedSize = (main as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    if (uncompressedSize > 2 * 1024 * 1024) throw new Error("DOCX text is too large to review safely");
    const xml = await main.async("string");
    return decodeXml(xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab\s*\/>/g, "\t").replace(/<[^>]+>/g, " ")).replace(/ +/g, " ").trim();
  }
  const content = contentType === "application/pdf"
    ? [{ type: "input_file", filename: "record.pdf", file_data: `data:application/pdf;base64,${bytes.toString("base64")}` }]
    : [{ type: "input_image", image_url: `data:${contentType};base64,${bytes.toString("base64")}`, detail: "high" }];
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60_000, maxRetries: 1 });
  const result = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5",
    store: false,
    input: [
      { role: "system", content: "Transcribe document text faithfully. Mark unreadable passages [UNREADABLE]. Do not infer facts or offer clinical advice." },
      { role: "user", content: [{ type: "input_text", text: "Extract the text in this record." }, ...content] as never },
    ],
  });
  return result.output_text;
}
