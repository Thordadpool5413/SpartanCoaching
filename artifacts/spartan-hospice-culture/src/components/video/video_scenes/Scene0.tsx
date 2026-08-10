import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene0 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)", scale: 1.1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center max-w-[90vw]">
        <div className="overflow-hidden mb-2">
          <motion.h1 
            className="text-[10vw] font-display uppercase tracking-tight text-center leading-[0.85] text-brand-light"
            initial={{ y: '100%', rotateX: -45, opacity: 0 }}
            animate={{ y: 0, rotateX: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Hospice Sales
          </motion.h1>
        </div>

        <motion.div 
          className="h-2 bg-brand-red w-full mt-4 mb-4 relative overflow-hidden"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
             className="absolute inset-0 bg-brand-light"
             initial={{ x: '-100%' }}
             animate={{ x: '100%' }}
             transition={{ delay: 1, duration: 0.5, ease: "linear" }}
          />
        </motion.div>

        <div className="overflow-hidden relative">
          <motion.h2 
            className="text-[12vw] font-display uppercase tracking-tighter text-brand-red leading-[0.8] glitch-text"
            data-text="HAS TO CHANGE."
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            HAS TO CHANGE.
          </motion.h2>
        </div>
      </div>
    </motion.div>
  );
});

Scene0.displayName = 'Scene0';
export default Scene0;