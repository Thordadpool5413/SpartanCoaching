import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene2 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center w-full h-full bg-brand-red"
      initial={{ clipPath: 'inset(0 0 0 100%)' }}
      animate={{ clipPath: 'inset(0 0 0 0%)' }}
      exit={{ clipPath: 'inset(0 100% 0 0%)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 text-center max-w-[80vw]">
        <div className="overflow-hidden">
          <motion.h1 
            className="text-6xl md:text-8xl font-display uppercase tracking-widest text-brand-dark leading-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            It's about the person
          </motion.h1>
        </div>
        <div className="overflow-hidden mt-4">
          <motion.h1 
            className="text-7xl md:text-9xl font-display uppercase tracking-widest text-brand-light leading-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Who Brings Their Game.
          </motion.h1>
        </div>
      </div>
    </motion.div>
  );
});

Scene2.displayName = 'Scene2';
export default Scene2;
