import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene6 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center w-full h-full bg-brand-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      <div className="relative z-10 flex flex-col items-center max-w-[80vw]">
        <div className="overflow-hidden mb-12">
          <motion.h2 
            className="text-4xl md:text-6xl font-display uppercase tracking-[0.2em] text-brand-grayLight"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            That's Hospice.
          </motion.h2>
        </div>

        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <img 
            src={`${baseUrl}spartan-logo.png`} 
            alt="Spartan Coaching Logo" 
            className="w-auto h-40 md:h-56 object-contain mb-8 drop-shadow-2xl"
          />
          <div className="overflow-hidden">
            <motion.h1 
              className="text-3xl md:text-5xl font-sans font-light tracking-wider text-brand-light"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              That's <span className="font-medium">Spartan Hospice Coaching</span>
            </motion.h1>
          </div>
        </motion.div>
      </div>
      
      {/* Subtle bottom flare */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-brand-red/10 to-transparent pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 2 }}
      />
    </motion.div>
  );
});

Scene6.displayName = 'Scene6';
export default Scene6;
