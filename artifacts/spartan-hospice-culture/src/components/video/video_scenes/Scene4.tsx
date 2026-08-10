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
      initial={{ opacity: 0, y: '10vh' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(15px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center w-[90vw] text-center">
        
        <motion.p 
          className="text-2xl md:text-3xl font-sans font-medium text-brand-grayLight uppercase tracking-widest mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          The person who's willing to
        </motion.p>
        
        <motion.div 
          className="relative mb-8"
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-[12vw] font-display uppercase tracking-tighter leading-[0.8] text-brand-red text-stroke-red glitch-text" data-text="CHALLENGE THEMSELVES">
            CHALLENGE THEMSELVES
          </h2>
        </motion.div>

        <motion.div
          className="overflow-hidden"
        >
          <motion.p 
            className="text-4xl md:text-6xl font-display uppercase tracking-wide text-brand-light leading-tight max-w-5xl"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            to find the patient no one else is willing to take care of.
          </motion.p>
        </motion.div>

      </div>
    </motion.div>
  );
});

Scene4.displayName = 'Scene4';
export default Scene4;