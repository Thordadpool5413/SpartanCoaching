import { afterEach, describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import {
  assertClinicalFileSignature,
  extractPatientDocument,
} from "./patientExtraction";

const responses = vi.hoisted(() => ({
  create: vi.fn(async (_request: unknown) => ({
    output_text: "Synthetic extracted record",
  })),
}));
vi.mock("openai", () => ({
  default: class {
    responses = responses;
  },
}));
afterEach(() => vi.clearAllMocks());

describe("patient record file boundaries", () => {
  it("rejects a disguised executable before sending it to the scanner or model", () => {
    expect(() =>
      assertClinicalFileSignature(
        "application/pdf",
        Buffer.from("MZ executable"),
      ),
    ).toThrow(/does not match/);
    expect(() =>
      assertClinicalFileSignature("image/png", Buffer.from("<script>")),
    ).toThrow(/does not match/);
    expect(() =>
      assertClinicalFileSignature("text/plain", Buffer.from([65, 0, 66])),
    ).toThrow(/does not match/);
  });

  it("extracts DOCX text locally without persisting a file or invoking a model", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      "<w:document><w:body><w:p><w:r><w:t>Hospice &amp; care</w:t></w:r></w:p><w:p><w:r><w:t>ADL decline</w:t></w:r></w:p></w:body></w:document>",
    );
    const bytes = await zip.generateAsync({ type: "nodebuffer" });
    expect(
      await extractPatientDocument(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        bytes,
      ),
    ).toContain("Hospice & care");
    expect(
      await extractPatientDocument(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        bytes,
      ),
    ).toContain("ADL decline");
  });
});

describe("OpenAI PHI-path extraction retention", () => {
  it.each([
    ["application/pdf", Buffer.from("%PDF- synthetic record")],
    [
      "image/png",
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ],
    ["image/jpeg", Buffer.from([0xff, 0xd8, 0xff])],
  ])("keeps store:false for %s", async (contentType, bytes) => {
    expect(
      await extractPatientDocument(contentType as string, bytes as Buffer),
    ).toBe("Synthetic extracted record");
    expect(responses.create).toHaveBeenCalledOnce();
    expect(responses.create.mock.calls[0][0]).toMatchObject({ store: false });
  });
});
