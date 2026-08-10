import React from 'react';
import { motion } from 'framer-motion';

const Scene2: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-brand-red overflow-hidden"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ scale: 1.5, opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-30 mix-blend-multiply pointer-events-none" />
      
      <div className="relative z-10 w-full flex flex-col items-center text-center">
        <motion.p 
          className="font-sans font-bold text-[1.5vw] text-brand-dark tracking-widest uppercase mb-[1vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
        >
          It's about the person who
        </motion.p>
        
        <div className="overflow-hidden">
          <motion.h1 
            className="font-display text-[15vw] leading-[0.8] tracking-tighter text-brand-light uppercase"
            initial={{ y: "100%", skewY: 10 }}
            animate={{ y: 0, skewY: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          >
            BRINGS
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1 
            className="font-display text-[15vw] leading-[0.8] tracking-tighter text-brand-dark uppercase"
            initial={{ y: "100%", skewY: -10 }}
            animate={{ y: 0, skewY: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.0 }}
          >
            THEIR GAME.
          </motion.h1>
        </div>
      </div>
    </motion.div>
  );
};

export default Scene2;