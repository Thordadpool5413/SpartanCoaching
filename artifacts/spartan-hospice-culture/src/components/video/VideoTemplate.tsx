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
    <div className="relative w-full h-screen overflow-hidden bg-brand-dark flex items-center justify-center font-sans antialiased text-brand-light">
      
      {/* PERSISTENT BACKGROUND LAYER */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen"
        style={{ backgroundImage: `url(${baseUrl}bg-texture.jpg)` }}
        animate={{
          scale: [1, 1.05, 1.1, 1.05, 1.08, 1, 1.02, 1],
          opacity: [0.1, 0.3, 0.2, 0.4, 0.2, 0.5, 0.3, 0.2]
        }}
        transition={{ duration: 27.5, ease: "linear", repeat: Infinity }}
      />
      
      {/* Accent Lines that transform across scenes */}
      <motion.div
        className="absolute top-0 left-0 h-1 bg-brand-red z-30"
        initial={{ width: 0 }}
        animate={{ width: `${((currentScene + 1) / 7) * 100}%` }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div 
        className="absolute rounded-full blur-[100px] pointer-events-none mix-blend-screen z-0"
        animate={{
          width: currentScene === 5 ? '70vw' : currentScene === 1 ? '50vw' : currentScene === 2 ? '40vw' : '20vw',
          height: currentScene === 5 ? '70vw' : currentScene === 1 ? '50vw' : currentScene === 2 ? '40vw' : '20vw',
          backgroundColor: currentScene === 5 ? 'rgba(251,251,251,0.06)' : 'rgba(201, 42, 42, 0.12)', 
          top: currentScene === 1 ? '70%' : currentScene === 4 ? '20%' : '50%',
          left: currentScene === 1 ? '30%' : currentScene === 4 ? '80%' : '50%',
          x: '-50%',
          y: '-50%',
          opacity: currentScene === 6 ? 0.2 : 0.6
        }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Global Noise Overlay for Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay z-40"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
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

      {/* Persistent Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_10%,var(--color-brand-dark)_120%)] z-40" />
    </div>
  );
};

export default VideoTemplate;
