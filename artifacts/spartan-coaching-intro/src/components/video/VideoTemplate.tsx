import { useVideoPlayer } from '@/lib/video/hooks';
import { VideoPlayerContext } from '@/lib/video/VideoPlayerContext';
import { AnimatePresence, motion } from 'framer-motion';

import { Scene1_ColdOpen } from './video_scenes/Scene1_ColdOpen';
import { Scene2_Stats } from './video_scenes/Scene2_Stats';
import { Scene3_Gap } from './video_scenes/Scene3_Gap';
import { Scene4_Conversational } from './video_scenes/Scene4_Conversational';
import { Scene5_Fragments } from './video_scenes/Scene5_Fragments';
import { Scene6_Ethos } from './video_scenes/Scene6_Ethos';
import { Scene7_Pillars } from './video_scenes/Scene7_Pillars';
import { Scene8_Close } from './video_scenes/Scene8_Close';

const SCENE_DURATIONS = {
  cold: 4000,
  stats: 5000,
  gap: 4500,
  conversational: 3500,
  fragments: 6000,
  ethos: 6000,
  pillars: 5000,
  close: 5500,
};

export function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
    loop: true,
  });

  // Derived properties for persistent elements based on currentScene
  const isEthosScene = currentScene === 5;
  const isGapScene = currentScene === 2;

  // Red accent line config per scene
  const redLineConfig = {
    0: { top: '50%', left: '50%', width: '0vw', height: '2px', x: '-50%', y: '-50%', opacity: 1, scale: 1 }, // Will animate in scene 1 but starts at 0 width
    1: { top: '70%', left: '10%', width: '15vw', height: '4px', x: '0%', y: '0%', opacity: 1, scale: 1 },
    2: { top: '30%', left: '80%', width: '2px', height: '40vh', x: '0%', y: '0%', opacity: 1, scale: 1 },
    3: { top: '85%', left: '10%', width: '80vw', height: '1px', x: '0%', y: '0%', opacity: 0.3, scale: 1 },
    4: { top: '15%', left: '5%', width: '5vw', height: '8px', x: '0%', y: '0%', opacity: 1, scale: 1 },
    5: { top: '50%', left: '50%', width: '100vw', height: '100vh', x: '-50%', y: '-50%', opacity: 0, scale: 2 }, // Scales to fill and fades out
    6: { top: '50%', left: '50%', width: '4px', height: '80vh', x: '-50%', y: '-50%', opacity: 1, scale: 1 },
    7: { top: '10%', left: '50%', width: '40vw', height: '2px', x: '-50%', y: '0%', opacity: 1, scale: 1 },
  }[currentScene as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7] || { opacity: 0 };

  // Floating shape configs
  const shape1Config = {
    0: { top: '10%', left: '80%', rotate: 45, scale: 0.5, opacity: 0.1 },
    1: { top: '80%', left: '15%', rotate: 90, scale: 1.2, opacity: 0.05 },
    2: { top: '40%', left: '10%', rotate: 15, scale: 0.8, opacity: 0.15 },
    3: { top: '20%', left: '60%', rotate: 120, scale: 0.4, opacity: 0.08 },
    4: { top: '70%', left: '80%', rotate: 0, scale: 1.5, opacity: 0.03 },
    5: { top: '50%', left: '50%', rotate: 0, scale: 0, opacity: 0 }, // hidden
    6: { top: '15%', left: '20%', rotate: 45, scale: 0.9, opacity: 0.1 },
    7: { top: '85%', left: '85%', rotate: 90, scale: 0.6, opacity: 0.05 },
  }[currentScene as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7] || { opacity: 0 };

  const shape2Config = {
    0: { top: '80%', left: '20%', rotate: 15, scale: 0.7, opacity: 0.05 },
    1: { top: '15%', left: '75%', rotate: -30, scale: 0.5, opacity: 0.1 },
    2: { top: '70%', left: '80%', rotate: -90, scale: 1.1, opacity: 0.08 },
    3: { top: '60%', left: '15%', rotate: -45, scale: 0.6, opacity: 0.12 },
    4: { top: '30%', left: '40%', rotate: 60, scale: 0.8, opacity: 0.05 },
    5: { top: '50%', left: '50%', rotate: 0, scale: 0, opacity: 0 }, // hidden
    6: { top: '80%', left: '60%', rotate: -15, scale: 1.3, opacity: 0.07 },
    7: { top: '20%', left: '15%', rotate: -60, scale: 0.8, opacity: 0.1 },
  }[currentScene as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7] || { opacity: 0 };

  return (
    <VideoPlayerContext.Provider value={{ paused: false }}>
      <div className="absolute inset-0 bg-spartan-bg overflow-hidden text-spartan-white font-inter">
        
        {/* Persistent watermark */}
        <motion.img
          src={`${import.meta.env.BASE_URL}spartan-logo-stamp.png`}
          alt=""
          className="absolute top-1/2 left-1/2 w-[60vh] h-[60vh] object-contain opacity-[0.03] z-0 pointer-events-none mix-blend-screen"
          style={{ x: '-50%', y: '-50%' }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 10, ease: "linear", repeat: Infinity }}
        />

        {/* Floating Shape 1 */}
        <motion.div 
          className="absolute w-[20vw] h-[20vw] border border-spartan-white/30 rounded-full z-0 pointer-events-none"
          animate={shape1Config}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Floating Shape 2 */}
        <motion.div 
          className="absolute w-[15vw] h-[15vw] border border-spartan-red/20 z-0 pointer-events-none"
          animate={shape2Config}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Red accent element */}
        <motion.div
          className="absolute bg-spartan-red z-10 pointer-events-none"
          animate={redLineConfig}
          transition={{ 
            duration: currentScene === 5 ? 0.8 : 1.2, 
            ease: [0.16, 1, 0.3, 1] 
          }}
        />

        {/* White Flash Transition - Triggers on scene change except for scene 3 (gap) and 6 (ethos) */}
        {!isGapScene && !isEthosScene && (
          <motion.div
            key={`flash-${currentScene}`}
            className="absolute inset-0 bg-white z-50 pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          />
        )}

        {/* Scene Container */}
        <div className="absolute inset-0 z-20">
          <AnimatePresence mode="popLayout">
            {currentScene === 0 && <Scene1_ColdOpen key="scene0" />}
            {currentScene === 1 && <Scene2_Stats key="scene1" />}
            {currentScene === 2 && <Scene3_Gap key="scene2" />}
            {currentScene === 3 && <Scene4_Conversational key="scene3" />}
            {currentScene === 4 && <Scene5_Fragments key="scene4" />}
            {currentScene === 5 && <Scene6_Ethos key="scene5" />}
            {currentScene === 6 && <Scene7_Pillars key="scene6" />}
            {currentScene === 7 && <Scene8_Close key="scene7" />}
          </AnimatePresence>
        </div>
        
      </div>
    </VideoPlayerContext.Provider>
  );
}
