import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene4 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-[80vw]">
        
        <div className="overflow-hidden mb-4" style={{ perspective: '1000px' }}>
          <motion.h2 
            className="text-3xl md:text-5xl font-sans font-light text-brand-grayLight"
            initial={{ rotateX: 90, opacity: 0, y: 50 }}
            animate={{ rotateX: 0, opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            The person who's willing to
          </motion.h2>
        </div>

        <div className="overflow-hidden" style={{ perspective: '1000px' }}>
          <motion.h1 
            className="text-7xl md:text-9xl font-display uppercase tracking-widest text-brand-red leading-none"
            initial={{ rotateX: 90, opacity: 0, y: 50 }}
            animate={{ rotateX: 0, opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            Challenge
          </motion.h1>
        </div>

        <div className="overflow-hidden mt-[-10px]" style={{ perspective: '1000px' }}>
          <motion.h1 
            className="text-7xl md:text-9xl font-display uppercase tracking-widest text-brand-light leading-none"
            initial={{ rotateX: -90, opacity: 0, y: -50 }}
            animate={{ rotateX: 0, opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            Themselves
          </motion.h1>
        </div>

      </div>
    </motion.div>
  );
});

Scene4.displayName = 'Scene4';
export default Scene4;
