import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer, VideoPlayerContext } from '@/lib/video';
import { Scene1_ColdOpen } from './video_scenes/Scene1_ColdOpen';
import { Scene2_Stats } from './video_scenes/Scene2_Stats';
import { Scene3_Gap } from './video_scenes/Scene3_Gap';
import { Scene4_Conversational } from './video_scenes/Scene4_Conversational';
import { Scene5_Fragments } from './video_scenes/Scene5_Fragments';
import { Scene6_Ethos } from './video_scenes/Scene6_Ethos';
import { Scene7_Pillars } from './video_scenes/Scene7_Pillars';
import { Scene8_Close } from './video_scenes/Scene8_Close';

const spartanStamp = `${import.meta.env.BASE_URL}spartan-logo-stamp.png`;

export const SCENE_DURATIONS: Record<string, number> = {
  cold: 7000,
  stats: 9000,
  gap: 10000,
  conversational: 6000,
  fragments: 15000,
  ethos: 8000,
  pillars: 7000,
  close: 6000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  cold: Scene1_ColdOpen,
  stats: Scene2_Stats,
  gap: Scene3_Gap,
  conversational: Scene4_Conversational,
  fragments: Scene5_Fragments,
  ethos: Scene6_Ethos,
  pillars: Scene7_Pillars,
  close: Scene8_Close,
};

const SCENE_KEYS = Object.keys(SCENE_DURATIONS);

const ACCENT_POSITIONS = [
  { left: '0%',  width: '100%', top: '50%', opacity: 1   },
  { left: '10%', width: '50%',  top: '80%', opacity: 0.4 },
  { left: '15%', width: '70%',  top: '20%', opacity: 0.4 },
  { left: '25%', width: '5%',   top: '50%', opacity: 0.8 },
  { left: '10%', width: '2%',   top: '90%', opacity: 0.8 },
  { left: '0%',  width: '100%', top: '95%', opacity: 1   },
  { left: '20%', width: '60%',  top: '10%', opacity: 0.6 },
  { left: '30%', width: '40%',  top: '85%', opacity: 0.5 },
];

const GEO1_POSITIONS = [
  { x: '80vw', y: '20vh', rotate: 0   },
  { x: '10vw', y: '80vh', rotate: 45  },
  { x: '50vw', y: '10vh', rotate: 90  },
  { x: '90vw', y: '50vh', rotate: 135 },
  { x: '30vw', y: '85vh', rotate: 180 },
  { x: '10vw', y: '20vh', rotate: 225 },
  { x: '80vw', y: '85vh', rotate: 270 },
  { x: '50vw', y: '10vh', rotate: 315 },
];

const GEO2_POSITIONS = [
  { x: '20vw', y: '70vh', rotate: 0   },
  { x: '70vw', y: '30vh', rotate: 90  },
  { x: '85vw', y: '80vh', rotate: 180 },
  { x: '10vw', y: '20vh', rotate: 270 },
  { x: '80vw', y: '15vh', rotate: 0   },
  { x: '90vw', y: '70vh', rotate: 90  },
  { x: '20vw', y: '30vh', rotate: 180 },
  { x: '10vw', y: '85vh', rotate: 270 },
];

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  paused = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  paused?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop, paused });

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = SCENE_KEYS.indexOf(baseSceneKey);

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const accent = ACCENT_POSITIONS[sceneIndex] ?? ACCENT_POSITIONS[0];
  const geo1   = GEO1_POSITIONS[sceneIndex]   ?? GEO1_POSITIONS[0];
  const geo2   = GEO2_POSITIONS[sceneIndex]   ?? GEO2_POSITIONS[0];

  const isEthos = sceneIndex === 5;

  return (
    <div className="w-full h-screen overflow-hidden relative bg-[#070707]">

      {/* ── z-0: logo watermark — always below scene content ── */}
      <motion.img
        src={spartanStamp}
        alt=""
        className="absolute object-contain pointer-events-none select-none"
        style={{
          width: '120vh',
          height: '120vh',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 0,
          opacity: 0.03,
        }}
        animate={{ scale: [1, 1.08] }}
        transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
      />

      {/* ── z-1: red accent line — repositions per scene ── */}
      <motion.div
        className="absolute h-[2px] bg-[#e8291e] pointer-events-none"
        style={{ zIndex: 1 }}
        animate={{
          left:    accent.left,
          width:   accent.width,
          top:     accent.top,
          opacity: accent.opacity,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* ── z-1: floating geometry — hidden during ethos hero beat ── */}
      <motion.div
        className="absolute w-12 h-12 border border-white/5 pointer-events-none"
        style={{ zIndex: 1 }}
        animate={{
          x:       geo1.x,
          y:       geo1.y,
          rotate:  geo1.rotate,
          opacity: isEthos ? 0 : 0.5,
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute w-4 h-4 bg-[#e8291e] pointer-events-none"
        style={{ zIndex: 1 }}
        animate={{
          x:       geo2.x,
          y:       geo2.y,
          rotate:  geo2.rotate,
          opacity: isEthos ? 0 : 0.2,
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* ── z-10+: scene components (foreground layer) — wrapped in player context ── */}
      <VideoPlayerContext.Provider value={{ paused }}>
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </VideoPlayerContext.Provider>

      {/* ── z-50: hard-cut white flash on every scene change ── */}
      <motion.div
        key={`flash-${currentSceneKey}`}
        className="absolute inset-0 pointer-events-none bg-white"
        style={{ zIndex: 50 }}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      />
    </div>
  );
}
