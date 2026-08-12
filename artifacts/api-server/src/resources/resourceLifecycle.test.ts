import { describe, it, expect } from "vitest";
import {
  RESOURCE_LIFECYCLE_VERSION,
  findCurrentInSeries,
  isSilentFileReplace,
  newerVersionNotice,
  normalizeLifecycleStatus,
  planLifecycleTransition,
  type LifecycleResourceSnapshot,
} from "./resourceLifecycle";

const base = (over: Partial<LifecycleResourceSnapshot> = {}): LifecycleResourceSnapshot => ({
  id: 1,
  title: "Objection Cards",
  fileUrl: "/resources/files/objections-v1.pdf",
  seriesKey: "objection-cards",
  versionLabel: "1.0",
  lifecycleStatus: "published",
  isCurrent: true,
  supersededById: null,
  contentOwner: "Field Ops",
  reviewer: "Compliance",
  publishedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("resourceLifecycle (HSP-27)", () => {
  it("is versioned", () => {
    expect(RESOURCE_LIFECYCLE_VERSION).toMatch(/^resource-lifecycle-v\d+/);
  });

  it("maps legacy architecture statuses", () => {
    expect(normalizeLifecycleStatus("review_required")).toBe("in_review");
    expect(normalizeLifecycleStatus(null)).toBe("published");
  });

  it("blocks silent file replace on published resources", () => {
    expect(
      isSilentFileReplace(base(), "/resources/files/objections-v2.pdf"),
    ).toBe(true);
    expect(isSilentFileReplace(base(), base().fileUrl)).toBe(false);
    expect(
      isSilentFileReplace(
        base({ lifecycleStatus: "draft" }),
        "/resources/files/other.pdf",
      ),
    ).toBe(false);
  });

  it("plans publish_new_version without overwriting the old file URL", () => {
    const plan = planLifecycleTransition({
      resource: base(),
      action: "publish_new_version",
      newVersion: {
        versionLabel: "2.0",
        fileUrl: "/resources/files/objections-v2.pdf",
        title: "Objection Cards",
      },
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.toStatus).toBe("superseded");
    expect(plan.patchSource.lifecycleStatus).toBe("superseded");
    expect(plan.patchSource.isCurrent).toBe(false);
    expect(plan.createNewVersion?.versionLabel).toBe("2.0");
    expect(plan.createNewVersion?.fileUrl).toContain("v2");
    expect(plan.createNewVersion?.fileUrl).not.toBe(base().fileUrl);
  });

  it("rejects publish_new_version with same file URL", () => {
    const plan = planLifecycleTransition({
      resource: base(),
      action: "publish_new_version",
      newVersion: {
        versionLabel: "2.0",
        fileUrl: base().fileUrl,
      },
    });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.code).toBe("SAME_FILE_URL");
  });

  it("rejects invalid transitions", () => {
    const plan = planLifecycleTransition({
      resource: base({ lifecycleStatus: "retired" }),
      action: "publish",
    });
    expect(plan.ok).toBe(false);
  });

  it("detects newer version in series for banners", () => {
    const v1 = base({ id: 1, versionLabel: "1.0", isCurrent: false, lifecycleStatus: "superseded" });
    const v2 = base({
      id: 2,
      versionLabel: "2.0",
      isCurrent: true,
      lifecycleStatus: "published",
      fileUrl: "/resources/files/objections-v2.pdf",
    });
    const notice = newerVersionNotice(v1, [v1, v2]);
    expect(notice.hasNewerVersion).toBe(true);
    expect(notice.currentVersion?.id).toBe(2);
    expect(notice.documentVersionLine).toMatch(/Version 1\.0/);
    expect(notice.documentVersionLine).toMatch(/Superseded/);
    expect(findCurrentInSeries("objection-cards", [v1, v2])?.id).toBe(2);
  });

  it("allows draft → publish", () => {
    const plan = planLifecycleTransition({
      resource: base({ lifecycleStatus: "draft", isCurrent: false }),
      action: "publish",
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.toStatus).toBe("published");
  });
});
