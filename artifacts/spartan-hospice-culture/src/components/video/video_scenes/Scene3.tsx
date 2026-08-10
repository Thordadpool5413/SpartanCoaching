import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene3 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center w-full h-full"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: '-10vh' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 flex flex-col items-start justify-center w-[85vw] max-w-7xl">
        <div className="overflow-hidden mb-4">
          <motion.p 
            className="text-4xl md:text-5xl font-sans font-medium text-brand-grayLight uppercase tracking-widest"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            The person who asks
          </motion.p>
        </div>

        <div className="overflow-hidden">
          <motion.h2 
            className="text-[14vw] font-display uppercase tracking-tight leading-[0.85] text-brand-red mb-2"
            initial={{ y: '100%', rotateX: 45 }}
            animate={{ y: 0, rotateX: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            THE HARD
          </motion.h2>
        </div>

        <div className="overflow-hidden w-full">
          <motion.h2 
            className="text-[12vw] font-display uppercase tracking-tighter leading-[0.85] text-brand-light w-full text-right"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ delay: 0.8, duration: 1, type: "spring", damping: 25, stiffness: 120 }}
          >
            DISCOVERY QUESTIONS.
          </motion.h2>
        </div>
        
        {/* Accent block */}
        <motion.div 
          className="absolute -left-8 top-0 bottom-0 w-2 bg-brand-red"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
});

Scene3.displayName = 'Scene3';
export default Scene3;