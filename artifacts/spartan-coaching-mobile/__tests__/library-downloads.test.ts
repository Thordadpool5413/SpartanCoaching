import { libraryDownloadFilename } from "@/lib/libraryDownloads";

describe("Library download identity", () => {
  it("keeps a stable safe extension without exposing the source URL", () => {
    const first = libraryDownloadFilename("https://example.com/private/guide.pdf", "resource");
    const second = libraryDownloadFilename("https://example.com/private/guide.pdf", "resource");
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{8}\.pdf$/);
    expect(first).not.toContain("private");
  });

  it("uses a safe fallback for extensionless audio", () => {
    expect(libraryDownloadFilename("https://example.com/audio/stream", "audio")).toMatch(/\.mp3$/);
  });
});
