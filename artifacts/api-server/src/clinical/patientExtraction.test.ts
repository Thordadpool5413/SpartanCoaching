import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { assertClinicalFileSignature, extractPatientDocument } from "./patientExtraction";

describe("patient record file boundaries", () => {
  it("rejects a disguised executable before sending it to the scanner or model", () => {
    expect(() => assertClinicalFileSignature("application/pdf", Buffer.from("MZ executable"))).toThrow(/does not match/);
    expect(() => assertClinicalFileSignature("image/png", Buffer.from("<script>"))).toThrow(/does not match/);
    expect(() => assertClinicalFileSignature("text/plain", Buffer.from([65, 0, 66]))).toThrow(/does not match/);
  });

  it("extracts DOCX text locally without persisting a file or invoking a model", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", '<w:document><w:body><w:p><w:r><w:t>Hospice &amp; care</w:t></w:r></w:p><w:p><w:r><w:t>ADL decline</w:t></w:r></w:p></w:body></w:document>');
    const bytes = await zip.generateAsync({ type: "nodebuffer" });
    expect(await extractPatientDocument("application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes)).toContain("Hospice & care");
    expect(await extractPatientDocument("application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes)).toContain("ADL decline");
  });
});
