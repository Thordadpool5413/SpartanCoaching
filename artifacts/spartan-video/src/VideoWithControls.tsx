import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, Repeat } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS } from './components/video/VideoTemplate';
import { useSceneControls } from './useSceneControls';

const PROGRESS_TICK_MS = 60;
const AUTO_HIDE_MOUSE_MS = 2000;
const AUTO_HIDE_TOUCH_MS = 4000;

function ProgressSegments({
  sceneKeys,
  activeIndex,
  activeDuration,
  tick,
  paused,
  onJumpTo,
}: {
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  tick: number;
  paused: boolean;
  onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  // Use a ref so the interval closure always reads the latest paused value
  // without resetting elapsed on every pause toggle
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  const accumulatedRef = useRef(0);
  const lastTickRef = useRef(performance.now());

  useEffect(() => {
    setElapsed(0);
    accumulatedRef.current = 0;
    lastTickRef.current = performance.now();

    const id = window.setInterval(() => {
      const now = performance.now();
      if (!pausedRef.current) {
        accumulatedRef.current += now - lastTickRef.current;
        setElapsed(accumulatedRef.current);
      }
      lastTickRef.current = now;
    }, PROGRESS_TICK_MS);

    return () => window.clearInterval(id);
  // Only reset on scene change (tick), NOT on pause toggle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const progress = activeDuration > 0 ? Math.min(1, elapsed / activeDuration) : 0;

  return (
    <div className="flex-1 flex items-center gap-1.5">
      {sceneKeys.map((key, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        const fill = isActive ? progress * 100 : isPast ? 100 : 0;
        return (
          <button
            key={key}
            onClick={() => onJumpTo(i)}
            className="flex-1 min-h-[28px] flex items-center cursor-pointer group touch-manipulation"
            aria-label={`Jump to scene ${i + 1}`}
            aria-current={isActive ? 'true' : undefined}
          >
            <div className="w-full h-3 group-hover:h-4 bg-white/20 rounded-full overflow-hidden transition-all relative">
              <div
                className="absolute inset-y-0 left-0 bg-white/90 rounded-full transition-[width] duration-100"
                style={{ width: `${fill}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface ControlBarProps {
  visible: boolean;
  collapsed: boolean;
  locked: boolean;
  paused: boolean;
  fullscreen: boolean;
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  tick: number;
  onToggleLock: () => void;
  onTogglePause: () => void;
  onPrevScene: () => void;
  onNextScene: () => void;
  onJumpTo: (index: number) => void;
  onToggleCollapsed: () => void;
  onToggleFullscreen: () => void;
}

function ControlBar({
  visible,
  collapsed,
  locked,
  paused,
  fullscreen,
  sceneKeys,
  activeIndex,
  activeDuration,
  tick,
  onToggleLock,
  onTogglePause,
  onPrevScene,
  onNextScene,
  onJumpTo,
  onToggleCollapsed,
  onToggleFullscreen,
}: ControlBarProps) {
  return (
    <div
      className={`flex items-center gap-2 bg-black/55 backdrop-blur-sm px-4 py-3 transition-all duration-200 ease-out ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      {/* Repeat / scene-lock */}
      <button
        onClick={onToggleLock}
        className={`w-12 h-12 flex items-center justify-center transition-colors rounded-lg shrink-0 touch-manipulation ${
          locked
            ? 'text-white bg-white/15 hover:bg-white/25'
            : 'text-white/50 hover:text-white hover:bg-white/10'
        }`}
        title={locked ? 'Loop scene: on' : 'Loop scene: off'}
        aria-label={locked ? 'Loop scene: on' : 'Loop scene: off'}
        aria-pressed={locked}
      >
        <Repeat className="w-6 h-6" />
      </button>

      <div className="w-px self-stretch bg-white/15" aria-hidden="true" />

      {/* Prev scene */}
      <button
        onClick={onPrevScene}
        disabled={activeIndex === 0}
        className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors rounded-lg shrink-0 touch-manipulation"
        title="Previous scene (←)"
        aria-label="Previous scene"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>

      {/* Pause / Play */}
      <button
        onClick={onTogglePause}
        className="w-14 h-14 flex items-center justify-center text-white hover:bg-white/15 transition-colors rounded-full shrink-0 ring-1 ring-white/20 touch-manipulation"
        title={paused ? 'Play (Space)' : 'Pause (Space)'}
        aria-label={paused ? 'Play' : 'Pause'}
        aria-pressed={paused}
      >
        {paused ? <Play className="w-7 h-7 translate-x-0.5" /> : <Pause className="w-7 h-7" />}
      </button>

      {/* Next scene */}
      <button
        onClick={onNextScene}
        disabled={activeIndex === sceneKeys.length - 1}
        className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors rounded-lg shrink-0 touch-manipulation"
        title="Next scene (→)"
        aria-label="Next scene"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      <div className="w-px self-stretch bg-white/15" aria-hidden="true" />

      {/* Progress segments */}
      <ProgressSegments
        sceneKeys={sceneKeys}
        activeIndex={activeIndex}
        activeDuration={activeDuration}
        tick={tick}
        paused={paused}
        onJumpTo={onJumpTo}
      />

      {/* Scene counter */}
      <div className="text-sm text-white/50 font-mono tabular-nums shrink-0 w-10 text-center">
        {activeIndex + 1}/{sceneKeys.length}
      </div>

      <div className="w-px self-stretch bg-white/15" aria-hidden="true" />

      {/* Full-screen toggle */}
      <button
        onClick={onToggleFullscreen}
        className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors rounded-lg shrink-0 touch-manipulation"
        title={fullscreen ? 'Exit full screen' : 'Full screen'}
        aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'}
        aria-pressed={fullscreen}
      >
        {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapsed}
        className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors rounded-lg shrink-0"
        title={collapsed ? 'Show controls' : 'Hide controls'}
        aria-label={collapsed ? 'Show controls' : 'Hide controls'}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
    </div>
  );
}

export default function VideoWithControls() {
  const isRecording = typeof window !== 'undefined' && typeof window.startRecording === 'function';

  const {
    sceneKeys,
    activeIndex,
    locked,
    paused,
    mountKey,
    tick,
    durations,
    activeDuration,
    onSceneChange,
    jumpTo,
    toggleLock,
    togglePause,
    prevScene,
    nextScene,
  } = useSceneControls(SCENE_DURATIONS);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  // Faux-fullscreen: fixed overlay for platforms with no Fullscreen API (e.g. older iOS Safari)
  const [fauxFullscreen, setFauxFullscreen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect native Fullscreen API availability (standard + webkit prefix)
  const fsSupported =
    typeof document !== 'undefined' &&
    (document.fullscreenEnabled ||
      !!(document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled);

  // Track native fullscreen state changes (Escape key exits fullscreen too)
  useEffect(() => {
    type WebkitDoc = Document & { webkitFullscreenElement?: Element | null };
    const onFsChange = () => {
      const active = !!(
        document.fullscreenElement ||
        (document as WebkitDoc).webkitFullscreenElement
      );
      setFullscreen(active);
      // If native fullscreen just became active, clear faux-fullscreen so they don't stack
      if (active) setFauxFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    type WebkitDoc = Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
    };
    type WebkitEl = HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };

    const wDoc = document as WebkitDoc;
    const wEl = el as WebkitEl;
    const isActive = !!(document.fullscreenElement || wDoc.webkitFullscreenElement);

    if (fsSupported) {
      if (isActive) {
        (document.exitFullscreen?.() ?? wDoc.webkitExitFullscreen?.())?.catch((err: unknown) => {
          console.warn('[VideoWithControls] exitFullscreen failed:', err);
        });
      } else {
        (el.requestFullscreen?.() ?? wEl.webkitRequestFullscreen?.())?.catch((err: unknown) => {
          // Denied (e.g. not triggered by user gesture) — fall back to faux fullscreen
          console.warn('[VideoWithControls] requestFullscreen denied, using faux fullscreen:', err);
          setFauxFullscreen(true);
        });
      }
    } else {
      // No Fullscreen API (older iOS Safari, some in-app browsers): toggle faux fullscreen
      setFauxFullscreen((v) => !v);
    }
  }, [fsSupported]);

  const showControls = useCallback((isTouch = false) => {
    setControlsVisible(true);
    if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, isTouch ? AUTO_HIDE_TOUCH_MS : AUTO_HIDE_MOUSE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse') showControls();
    },
    [showControls],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse') showControls(true);
    },
    [showControls],
  );

  const handleToggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
    showControls();
  }, [showControls]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
        showControls();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevScene();
        showControls();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextScene();
        showControls();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePause, prevScene, nextScene, showControls]);

  const barVisible = !collapsed && controlsVisible;

  if (isRecording) {
    return <VideoTemplate />;
  }

  const isFullscreen = fullscreen || fauxFullscreen;

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${fauxFullscreen ? 'fixed inset-0 z-[9999] bg-black' : 'h-screen'}`}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      <VideoTemplate
        key={mountKey}
        durations={durations}
        loop
        paused={paused}
        onSceneChange={onSceneChange}
      />

      {/* Collapsed stub — always visible so user can tap/hover to restore */}
      {collapsed && (
        <button
          className="absolute bottom-3 right-3 z-[60] w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white/40 hover:text-white hover:bg-black/60 rounded-full transition-colors"
          onClick={handleToggleCollapsed}
          title="Show controls"
          aria-label="Show controls"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {/* Control bar — bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-[60]">
        <ControlBar
          visible={barVisible}
          collapsed={collapsed}
          locked={locked}
          paused={paused}
          fullscreen={isFullscreen}
          sceneKeys={sceneKeys}
          activeIndex={activeIndex}
          activeDuration={activeDuration}
          tick={tick}
          onToggleLock={toggleLock}
          onTogglePause={togglePause}
          onPrevScene={prevScene}
          onNextScene={nextScene}
          onJumpTo={jumpTo}
          onToggleCollapsed={handleToggleCollapsed}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
}
