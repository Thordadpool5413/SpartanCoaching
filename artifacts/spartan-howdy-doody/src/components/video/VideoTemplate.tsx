import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '../../lib/video/hooks';
import Scene0 from './video_scenes/Scene0';
import Scene1 from './video_scenes/Scene1';
import Scene2 from './video_scenes/Scene2';
import Scene3 from './video_scenes/Scene3';
import Scene4 from './video_scenes/Scene4';
import Scene5 from './video_scenes/Scene5';
import Scene6 from './video_scenes/Scene6';

const SCENE_DURATIONS_MAP = {
  arrival: 5500,
  howdyCall: 9000,
  turn: 9000,
  indictment: 7500,
  challenge: 11000,
  pivot: 8000,
  brand: 10000,
};

const SCENE_DURATIONS = Object.values(SCENE_DURATIONS_MAP);

const VideoTemplate: React.FC = () => {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS_MAP });

  // Act 1 (scenes 0-1) is bright and cheerful — keep the vignette light there.
  // Act 2 darkens into the cinematic register.
  const isActOne = currentScene <= 1;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-brand-black)] flex items-center justify-center font-sans antialiased text-[var(--color-brand-white)]">

      {/* Vignette — soft in Act 1, heavy in Act 2 */}
      <motion.div
        className="absolute inset-0 z-40 pointer-events-none"
        animate={{ opacity: isActOne ? 0.35 : 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle, transparent 35%, rgba(17, 19, 21, 0.75) 100%)' }} />

      {/* Global Film Grain */}
      <div
        className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle light leak drifting slowly across the whole spot */}
      <motion.div
        className="absolute w-[150vw] h-[150vh] rounded-full mix-blend-screen opacity-[0.03] z-40 pointer-events-none bg-gradient-to-r from-transparent via-[#f4eee1] to-transparent blur-[120px]"
        animate={{
          x: ['-50vw', '20vw', '-50vw'],
          y: ['-20vh', '10vh', '-20vh'],
        }}
        transition={{
          duration: 20,
          ease: 'linear',
          repeat: Infinity,
        }}
      />

      {/* SCENE CONTENT */}
      <div className="relative w-full h-full z-20 flex items-center justify-center">
        <AnimatePresence mode="sync">
          {currentScene === 0 && <Scene0 key="scene0" duration={SCENE_DURATIONS[0]} />}
          {currentScene === 1 && <Scene1 key="scene1" duration={SCENE_DURATIONS[1]} />}
          {currentScene === 2 && <Scene2 key="scene2" duration={SCENE_DURATIONS[2]} />}
          {currentScene === 3 && <Scene3 key="scene3" duration={SCENE_DURATIONS[3]} />}
          {currentScene === 4 && <Scene4 key="scene4" duration={SCENE_DURATIONS[4]} />}
          {currentScene === 5 && <Scene5 key="scene5" duration={SCENE_DURATIONS[5]} />}
          {currentScene === 6 && <Scene6 key="scene6" duration={SCENE_DURATIONS[6]} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VideoTemplate;
