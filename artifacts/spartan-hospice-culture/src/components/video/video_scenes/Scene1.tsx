import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene1 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center w-full h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: '-10vw', filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 flex flex-col items-start justify-center w-[80vw] max-w-7xl">
        <div className="overflow-hidden">
          <motion.p 
            className="text-4xl md:text-5xl font-sans font-medium text-brand-grayLight uppercase tracking-widest mb-4"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            It's
          </motion.p>
        </div>
        
        <div className="overflow-hidden mb-6">
          <motion.h2 
            className="text-[12vw] font-display uppercase tracking-tight leading-[0.8] text-brand-red text-stroke-red"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            NOT ABOUT
          </motion.h2>
        </div>

        <div className="overflow-hidden relative">
          <motion.p 
            className="text-5xl md:text-8xl font-display uppercase tracking-wide text-brand-light opacity-60"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 0.6 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            who brings the best donuts or coffee.
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
});

Scene1.displayName = 'Scene1';
export default Scene1;