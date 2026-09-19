import { afterEach, describe, expect, it, vi } from "vitest";
import { shareAbortable, withinBudget } from "./cancellation";
import { fetchJsonWithRetry } from "./http";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("CMS request cancellation", () => {
  it("propagates caller cancellation to fetch without retrying", async () => {
    let calls = 0;
    let upstreamSignal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => {
      calls += 1;
      upstreamSignal = init?.signal || undefined;
      return new Promise<Response>((_resolve, reject) => {
        upstreamSignal?.addEventListener("abort", () => reject(upstreamSignal?.reason), { once: true });
      });
    }));
    const controller = new AbortController();
    const pending = fetchJsonWithRetry("https://data.cms.gov/example", {
      retries: 3,
      timeout: 60_000,
      signal: controller.signal,
    });

    controller.abort(new Error("browser disconnected"));

    await expect(pending).rejects.toThrow("browser disconnected");
    expect(upstreamSignal?.aborted).toBe(true);
    expect(calls).toBe(1);
  });

  it("keeps cancellation attached while the response body is streaming", async () => {
    let calls = 0;
    let bodySignal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => {
      calls += 1;
      bodySignal = init?.signal || undefined;
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        text: () => new Promise<string>((_resolve, reject) => {
          bodySignal?.addEventListener("abort", () => reject(bodySignal?.reason), { once: true });
        }),
      } as Response);
    }));
    const controller = new AbortController();
    const pending = fetchJsonWithRetry("https://data.cms.gov/streaming", {
      retries: 3,
      timeout: 60_000,
      signal: controller.signal,
    });

    await Promise.resolve();
    controller.abort(new Error("browser disconnected during body"));

    await expect(pending).rejects.toThrow("browser disconnected during body");
    expect(bodySignal?.aborted).toBe(true);
    expect(calls).toBe(1);
  });

  it("aborts underlying work when its feed budget expires", async () => {
    vi.useFakeTimers();
    let released = false;
    const pending = withinBudget("Hospice feed", 1_000, undefined, (signal) =>
      new Promise<never>((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          released = true;
          reject(signal.reason);
        }, { once: true });
      }),
    );
    const rejected = expect(pending).rejects.toThrow("Hospice feed exceeded the 1 second market-load budget.");

    await vi.advanceTimersByTimeAsync(1_000);

    await rejected;
    expect(released).toBe(true);
  });

  it("does not start budgeted work when its parent is already cancelled", async () => {
    const controller = new AbortController();
    controller.abort(new Error("request already disconnected"));
    const work = vi.fn();

    await expect(withinBudget("Hospice feed", 1_000, controller.signal, work))
      .rejects.toThrow("request already disconnected");
    expect(work).not.toHaveBeenCalled();
  });

  it("shares identical work and aborts it only after every subscriber disconnects", async () => {
    const first = new AbortController();
    const second = new AbortController();
    let starts = 0;
    let upstreamAborted = false;
    const work = (signal: AbortSignal) => {
      starts += 1;
      return new Promise<string>((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          upstreamAborted = true;
          reject(signal.reason);
        }, { once: true });
      });
    };
    const firstResult = shareAbortable("market:OK", first.signal, work);
    const secondResult = shareAbortable("market:OK", second.signal, work);

    first.abort(new Error("first tab closed"));
    await expect(firstResult).rejects.toThrow("first tab closed");
    expect(starts).toBe(1);
    expect(upstreamAborted).toBe(false);

    second.abort(new Error("second tab closed"));
    await expect(secondResult).rejects.toThrow("second tab closed");
    expect(upstreamAborted).toBe(true);
  });
});