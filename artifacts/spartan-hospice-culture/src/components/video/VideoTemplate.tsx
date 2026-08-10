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
  change: 3000, 
  donuts: 4500, 
  game: 3500, 
  questions: 4000, 
  challenge: 5500, 
  patient: 3500, 
  brand: 5000, 
};

const SCENE_DURATIONS = Object.values(SCENE_DURATIONS_MAP);

const VideoTemplate: React.FC = () => {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS_MAP });
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-brand-black)] flex items-center justify-center font-sans antialiased text-[var(--color-brand-white)]">
      
      {/* PERSISTENT BACKGROUND LAYER - Fiery Embers */}
      <motion.div
        className="absolute inset-0 z-0 mix-blend-screen"
        animate={{ opacity: currentScene === 6 ? 0 : 0.6 }}
        transition={{ duration: 1, ease: "linear" }}
      >
        <video 
          src={`${baseUrl}fiery-sparks-bg.mp4`}
          className="w-full h-full object-cover"
          autoPlay 
          muted 
          loop 
          playsInline
        />
      </motion.div>

      {/* Persistent Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/90 z-0 pointer-events-none" 
           style={{ background: 'radial-gradient(circle, transparent 20%, #030303 100%)' }} />

      {/* Dynamic Red Light Slash / Accent */}
      <motion.div
        className="absolute w-[120vw] h-[10vh] bg-[var(--color-brand-red)] mix-blend-overlay blur-[80px] z-0 pointer-events-none"
        animate={{
          y: currentScene % 2 === 0 ? '-30vh' : '30vh',
          rotate: currentScene % 2 === 0 ? -10 : 15,
          opacity: currentScene === 6 ? 0 : 0.7
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
      />
      
      {/* Glitch/Flash subtle overlay on scene changes */}
      <motion.div
        key={`glitch-${currentScene}`}
        className="absolute inset-0 bg-[var(--color-brand-red)] z-50 pointer-events-none mix-blend-overlay"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
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
