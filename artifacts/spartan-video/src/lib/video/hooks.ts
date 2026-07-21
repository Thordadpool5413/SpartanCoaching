// Video player hook - handles recording lifecycle, scene advancement, and looping

import { useState, useEffect, useRef } from 'react';
import { useVideoPlayerContext } from './VideoPlayerContext';

declare global {
  interface Window {
    startRecording?: () => Promise<void>;
    stopRecording?: () => void;
  }
}

export interface SceneDurations {
  [key: string]: number;
}

export interface UseVideoPlayerOptions {
  durations: SceneDurations;
  onVideoEnd?: () => void;
  loop?: boolean;
  paused?: boolean;
}

export interface UseVideoPlayerReturn {
  currentScene: number;
  totalScenes: number;
  currentSceneKey: string;
  hasEnded: boolean;
}

export function useVideoPlayer(options: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { durations, onVideoEnd, loop = true, paused = false } = options;

  // Captured once on mount -- durations must be a static object
  const sceneKeys = useRef(Object.keys(durations)).current;
  const totalScenes = sceneKeys.length;
  const durationsArray = useRef(Object.values(durations)).current;

  const [currentScene, setCurrentScene] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);

  // Track elapsed time within the current scene for accurate pause/resume
  const elapsedRef = useRef<number>(0);
  const timerStartRef = useRef<number | null>(null);
  const prevSceneRef = useRef<number>(-1);

  // Start recording on mount
  useEffect(() => {
    window.startRecording?.();
  }, []);

  // Reset elapsed time when scene index changes (scene jump or natural advance)
  useEffect(() => {
    if (currentScene !== prevSceneRef.current) {
      elapsedRef.current = 0;
      prevSceneRef.current = currentScene;
    }
  }, [currentScene]);

  // Scene advancement -- respects paused state and resumes from correct position
  useEffect(() => {
    if (paused) return;
    if (hasEnded && !loop) return;

    const fullDuration = durationsArray[currentScene];
    const remaining = Math.max(0, fullDuration - elapsedRef.current);

    timerStartRef.current = performance.now();

    const timer = setTimeout(() => {
      elapsedRef.current = 0;
      timerStartRef.current = null;

      if (currentScene >= totalScenes - 1) {
        if (!hasEnded) {
          window.stopRecording?.();
          setHasEnded(true);
          onVideoEnd?.();
        }
        if (loop) {
          setCurrentScene(0);
        }
      } else {
        setCurrentScene(prev => prev + 1);
      }
    }, remaining);

    return () => {
      clearTimeout(timer);
      if (timerStartRef.current !== null) {
        elapsedRef.current += performance.now() - timerStartRef.current;
        timerStartRef.current = null;
      }
    };
  }, [currentScene, totalScenes, durationsArray, hasEnded, loop, onVideoEnd, paused]);

  return {
    currentScene,
    totalScenes,
    currentSceneKey: sceneKeys[currentScene],
    hasEnded,
  };
}

/**
 * useScenePhases — pause-aware phase timer for scene components.
 * Reads `paused` from VideoPlayerContext so scenes don't need a prop.
 * Pass a static schedule of [delayMs, phaseValue] tuples.
 */
export function useScenePhases(
  schedule: ReadonlyArray<readonly [number, number]>,
): number {
  const { paused } = useVideoPlayerContext();
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const elapsedRef = useRef(0);
  const timerStartRef = useRef<number | null>(null);
  const scheduleRef = useRef(schedule);

  useEffect(() => {
    if (paused) {
      if (timerStartRef.current !== null) {
        elapsedRef.current += performance.now() - timerStartRef.current;
        timerStartRef.current = null;
      }
      return;
    }

    const currentElapsed = elapsedRef.current;
    const currentPhase = phaseRef.current;
    timerStartRef.current = performance.now();

    const timers = scheduleRef.current
      .filter(([, p]) => p > currentPhase)
      .map(([delay, p]) =>
        window.setTimeout(() => {
          phaseRef.current = p;
          setPhase(p);
        }, Math.max(0, delay - currentElapsed)),
      );

    return () => {
      timers.forEach(t => clearTimeout(t));
      if (timerStartRef.current !== null) {
        elapsedRef.current += performance.now() - timerStartRef.current;
        timerStartRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return phase;
}

export function useSceneTimer(events: Array<{ time: number; callback: () => void }>) {
  const firedRef = useRef<Set<number>>(new Set());
  const callbacksRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    callbacksRef.current = events.map(e => e.callback);
  }, [events]);

  const scheduleKey = events.map((event, i) => `${i}:${event.time}`).join('|');

  useEffect(() => {
    firedRef.current = new Set();

    const timers = events.map(({ time }, index) => {
      return setTimeout(() => {
        if (!firedRef.current.has(index)) {
          firedRef.current.add(index);
          callbacksRef.current[index]?.();
        }
      }, time);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [scheduleKey]);
}
