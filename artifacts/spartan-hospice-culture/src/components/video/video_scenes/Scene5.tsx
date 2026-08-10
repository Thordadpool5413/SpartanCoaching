import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene5 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center w-full h-full bg-brand-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "linear" }}
    >
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        
        {/* Massive text, slowly scaling up */}
        <motion.h2 
          className="text-[18vw] font-display uppercase tracking-tighter text-brand-light leading-none absolute"
          initial={{ scale: 0.8, opacity: 0, filter: "blur(20px)" }}
          animate={{ scale: 1.1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 4.5, ease: "easeOut" }}
        >
          THAT'S HOSPICE.
        </motion.h2>

        {/* Second layer for dramatic depth */}
        <motion.h2 
          className="text-[18vw] font-display uppercase tracking-tighter leading-none absolute text-transparent text-stroke-thin"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1.15, opacity: 0.8 }}
          transition={{ duration: 4.5, ease: "easeOut" }}
        >
          THAT'S HOSPICE.
        </motion.h2>
        
        {/* Central red flare */}
        <motion.div 
          className="absolute w-[50vw] h-[50vw] bg-brand-red rounded-full mix-blend-screen blur-[120px] pointer-events-none -z-10"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 3, ease: "easeOut", delay: 0.5 }}
        />

      </div>
    </motion.div>
  );
});

Scene5.displayName = 'Scene5';
export default Scene5;