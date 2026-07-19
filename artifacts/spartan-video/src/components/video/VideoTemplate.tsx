import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { Scene1_Intro } from './video_scenes/Scene1_Intro';
import { Scene2_Buildup } from './video_scenes/Scene2_Buildup';
import { Scene3_Kinetic } from './video_scenes/Scene3_Kinetic';
import { Scene4_CrestHero } from './video_scenes/Scene4_CrestHero';
import { Scene5_Outro } from './video_scenes/Scene5_Outro';

const spartanStamp = `${import.meta.env.BASE_URL}spartan-logo-stamp.png`;

export const SCENE_DURATIONS: Record<string, number> = {
  intro: 7000,
  buildup: 7000,
  kinetic: 8000,
  crestHero: 9000,
  outro: 8000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene1_Intro,
  buildup: Scene2_Buildup,
  kinetic: Scene3_Kinetic,
  crestHero: Scene4_CrestHero,
  outro: Scene5_Outro,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="w-full h-screen overflow-hidden relative bg-[#080808]">
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute w-[80vw] h-[80vw] rounded-full blur-[100px] opacity-30"
          style={{ background: 'radial-gradient(circle, #e8291e, transparent 70%)' }}
          animate={{
            x: ['-20%', '20%', '-10%', '-20%'],
            y: ['-20%', '10%', '-30%', '-20%'],
            scale: [1, 1.2, 0.9, 1],
            opacity: sceneIndex === 3 ? 0.6 : (sceneIndex === 4 ? 0.1 : 0.3),
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-20 right-0 bottom-0"
          style={{ background: 'radial-gradient(circle, #5e0d08, transparent 60%)' }}
          animate={{
            x: ['10%', '-30%', '20%', '10%'],
            y: ['10%', '-20%', '30%', '10%'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Persistent Midground: faint crest watermark */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        animate={{
          opacity: sceneIndex >= 2 && sceneIndex < 4 ? 0.05 : 0,
          scale: [1, 1.05],
        }}
        transition={{ duration: 15, ease: 'linear' }}
      >
        <img src={spartanStamp} alt="" className="w-[120vh] h-[120vh] object-contain" />
      </motion.div>

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </div>
  );
}
