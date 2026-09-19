import { beforeEach, describe, expect, it, vi } from "vitest";
import { withCancellationSignal } from "./cancellation";

const mocks = vi.hoisted(() => ({
  write: vi.fn(),
}));

vi.mock("./runtime", () => ({
  storage: {
    read: vi.fn(),
    write: mocks.write,
    delete: vi.fn(),
    list: vi.fn(),
  },
}));

import { writeJsonCache } from "./cache";

describe("Medicare cache cancellation", () => {
  beforeEach(() => {
    mocks.write.mockReset();
  });

  it("does not start a cache write after its request has been cancelled", async () => {
    const controller = new AbortController();
    controller.abort(new Error("request disconnected"));

    await expect(withCancellationSignal(controller.signal, () =>
      writeJsonCache("cms-cache/provider/test.json", { partial: true }),
    )).rejects.toThrow("request disconnected");
    expect(mocks.write).not.toHaveBeenCalled();
  });
});