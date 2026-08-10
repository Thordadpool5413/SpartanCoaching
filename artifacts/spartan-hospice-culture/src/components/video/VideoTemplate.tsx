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

// Total video duration: 27.5s
const SCENE_DURATIONS_MAP = {
  change: 3000, 
  donuts: 4000, 
  game: 3000, 
  questions: 4000, 
  challenge: 3500, 
  patient: 5000, 
  brand: 5000, 
};

const SCENE_DURATIONS = Object.values(SCENE_DURATIONS_MAP);

const VideoTemplate: React.FC = () => {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS_MAP });
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050506] flex items-center justify-center font-sans antialiased text-brand-light">
      
      {/* PERSISTENT BACKGROUND LAYER - Dark Distressed Texture */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
        style={{ backgroundImage: `url(${baseUrl}bg-distressed-dark.jpg)` }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
      />

      {/* Red Distressed Texture Overlay that shifts based on scene */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat mix-blend-screen pointer-events-none"
        style={{ backgroundImage: `url(${baseUrl}bg-spartan-red.jpg)` }}
        animate={{
          opacity: currentScene === 2 || currentScene === 6 ? 0.8 : 0.1,
          scale: currentScene === 2 || currentScene === 6 ? 1.05 : 1,
          filter: currentScene === 2 || currentScene === 6 ? 'brightness(1.2)' : 'brightness(0.5)'
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />
      
      {/* Dynamic Accent Accent Background */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url(${baseUrl}bg-texture-accent.jpg)` }}
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: 1.1,
          x: currentScene % 2 === 0 ? '-1%' : '1%'
        }}
        transition={{ duration: 10, ease: "linear", repeat: Infinity }}
      />
      
      {/* Accent Red Wipe Line / Frame that transforms across scenes */}
      <motion.div
        className="absolute top-0 left-0 w-full h-2 bg-brand-red z-30"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: (currentScene + 1) / 7 }}
        style={{ transformOrigin: 'left' }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-full h-2 bg-brand-red z-30"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: (currentScene + 1) / 7 }}
        style={{ transformOrigin: 'right' }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div 
        className="absolute rounded-full blur-[120px] pointer-events-none mix-blend-screen z-0"
        animate={{
          width: currentScene === 5 ? '80vw' : currentScene === 1 ? '60vw' : currentScene === 2 ? '50vw' : '30vw',
          height: currentScene === 5 ? '80vw' : currentScene === 1 ? '60vw' : currentScene === 2 ? '50vw' : '30vw',
          backgroundColor: currentScene === 5 ? 'rgba(251,251,251,0.04)' : 'rgba(211, 47, 47, 0.15)', 
          top: currentScene === 1 ? '70%' : currentScene === 4 ? '30%' : '50%',
          left: currentScene === 1 ? '20%' : currentScene === 4 ? '80%' : '50%',
          x: '-50%',
          y: '-50%',
        }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Heavy Noise Overlay for Cinematic Grit */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.15] mix-blend-overlay z-40"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />

      {/* SCENE CONTENT */}
      <div className="relative w-full h-full z-10 flex items-center justify-center">
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

      {/* Intense Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-brand-dark)_130%)] z-40" />
    </div>
  );
};

export default VideoTemplate;