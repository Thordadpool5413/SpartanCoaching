import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HeroSystemPanel } from "./Home";

function installMatchMedia(reducedMotion = false) {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: reducedMotion,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("homepage hero video", () => {
  beforeEach(() => {
    installMatchMedia();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("reports real playback and advancing currentTime", async () => {
    render(<HeroSystemPanel />);
    const video = screen.getByTestId("hero-video") as HTMLVideoElement;
    fireEvent.playing(video);
    Object.defineProperty(video, "currentTime", { configurable: true, value: 1.6 });
    fireEvent.timeUpdate(video);

    await waitFor(() => {
      expect(video.dataset.playbackState).toBe("playing");
      expect(Number(video.dataset.playbackSeconds)).toBeGreaterThan(1);
      expect(screen.getByTestId("hero-video-status").textContent).toContain("Field film playing");
    });
  });

  it("shows a user action when autoplay is blocked", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new Error("blocked"));
    render(<HeroSystemPanel />);

    expect(await screen.findByText("Playback needs permission")).toBeTruthy();
    expect(screen.getByTestId("button-hero-video-play")).toBeTruthy();
  });

  it("shows the poster after an error and retries the media element", async () => {
    render(<HeroSystemPanel />);
    const video = screen.getByTestId("hero-video");
    fireEvent.error(video);

    expect(await screen.findByAltText("Spartan Coaching field operating system")).toBeTruthy();
    fireEvent.click(screen.getByTestId("button-hero-video-play"));
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it("honors reduced motion with an intentional paused state", async () => {
    installMatchMedia(true);
    render(<HeroSystemPanel />);

    expect(await screen.findByText("Motion paused by preference")).toBeTruthy();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
});