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

// Total video duration: ~27.5s (adjusting pacing for broadcast feel)
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
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-brand-slateDark)] flex items-center justify-center font-sans antialiased text-[var(--color-brand-light)]">
      
      {/* PERSISTENT BACKGROUND LAYER - Cinematic Video */}
      <motion.div
        className="absolute inset-0 z-0 opacity-40 mix-blend-screen"
        animate={{ scale: 1.05 }}
        transition={{ duration: 30, ease: "linear" }}
      >
        <video 
          src={`${baseUrl}bg-studio-sweep.mp4`}
          className="w-full h-full object-cover"
          autoPlay 
          muted 
          loop 
          playsInline
        />
      </motion.div>

      {/* Broadcast Slate gradient overlay to ensure text legibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-slateLight)]/50 to-[var(--color-brand-slateDark)]/90 z-0 mix-blend-multiply" />
      
      {/* Subtle Studio Light sweeps (CSS fallback/enhancement) */}
      <motion.div 
        className="absolute w-[150vw] h-[100vh] rounded-full blur-[100px] pointer-events-none mix-blend-soft-light z-0"
        style={{ background: 'linear-gradient(90deg, rgba(232, 236, 240, 0) 0%, rgba(232, 236, 240, 0.15) 50%, rgba(232, 236, 240, 0) 100%)' }}
        animate={{
          x: currentScene % 2 === 0 ? '-30%' : '10%',
          rotate: currentScene % 2 === 0 ? -15 : -5,
          scale: currentScene === 5 ? 1.2 : 1,
        }}
        transition={{ duration: 4, ease: [0.25, 1, 0.5, 1] }}
      />
      
      {/* Clean Geometric Accents */}
      <motion.div
        className="absolute top-0 right-0 w-[40vw] h-[100vh] border-l border-[var(--color-brand-light)]/5 pointer-events-none z-10"
        animate={{
          x: currentScene === 4 ? '10vw' : currentScene === 1 ? '5vw' : '0vw',
          opacity: currentScene === 6 ? 0 : 1
        }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="absolute top-[20vh] left-0 w-[1px] h-[30vh] bg-[var(--color-brand-red)]"
          animate={{
            y: currentScene === 3 ? '20vh' : currentScene === 5 ? '40vh' : '0vh',
            opacity: currentScene === 6 ? 0 : 0.8
          }}
          transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>

      {/* Grid structure for depth */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:5vw_5vw]" />

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
