import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
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
  cold: 1800,
  stats: 4000,
  gap: 3500,
  conversational: 2000,
  fragments: 3200,
  ethos: 4500,
  pillars: 4200,
  close: 4500,
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

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="w-full h-screen overflow-hidden relative bg-[#070707]">
      {/* Persistent Midground: Watermark */}
      <motion.img
        src={spartanStamp}
        alt=""
        className="absolute w-[120vh] h-[120vh] object-contain opacity-[0.03] pointer-events-none"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        animate={{ scale: [1, 1.08] }}
        transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
      />

      {/* Persistent Midground: Accent line */}
      <motion.div
        className="absolute h-[2px] bg-[#e8291e] z-30"
        animate={{
          left: ['0%', '10%', '15%', '25%', '10%', '0%', '20%', '30%'][sceneIndex] || '0%',
          width: ['100%', '50%', '70%', '5%', '2%', '100%', '60%', '40%'][sceneIndex] || '100%',
          top: ['50%', '80%', '20%', '50%', '90%', '95%', '10%', '85%'][sceneIndex] || '50%',
          opacity: [1, 0.4, 0.4, 0.8, 0.8, 1, 0.6, 0.5][sceneIndex] || 1,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Persistent Midground: Floating geometries */}
      <motion.div
        className="absolute w-12 h-12 border border-white/5 opacity-50 z-30"
        animate={{
          x: ['80vw', '10vw', '50vw', '90vw', '30vw', '10vw', '80vw', '50vw'][sceneIndex] || '0vw',
          y: ['20vh', '80vh', '10vh', '50vh', '85vh', '20vh', '85vh', '10vh'][sceneIndex] || '0vh',
          rotate: [0, 45, 90, 135, 180, 225, 270, 315][sceneIndex] || 0,
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute w-4 h-4 bg-[#e8291e] opacity-20 z-30"
        animate={{
          x: ['20vw', '70vw', '85vw', '10vw', '80vw', '90vw', '20vw', '10vw'][sceneIndex] || '0vw',
          y: ['70vh', '30vh', '80vh', '20vh', '15vh', '70vh', '30vh', '85vh'][sceneIndex] || '0vh',
          rotate: [0, 90, 180, 270, 0, 90, 180, 270][sceneIndex] || 0,
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
