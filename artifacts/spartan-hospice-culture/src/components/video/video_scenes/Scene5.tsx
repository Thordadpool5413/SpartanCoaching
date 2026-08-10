import React from 'react';
import { motion } from 'framer-motion';

const Scene5: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Centered clean typographic layout */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.p
          className="font-sans text-[3vw] text-[var(--color-brand-lightMuted)] mb-[1vh]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          That's
        </motion.p>
        
        <div className="overflow-hidden">
          <motion.h1
            className="font-display text-[15vw] font-bold text-[var(--color-brand-light)] leading-none tracking-tight"
            initial={{ opacity: 0, y: "50%" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          >
            HOSPICE.
          </motion.h1>
        </div>
      </div>

      {/* Gentle pulse from center */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-brand-light)_0%,transparent_50%)] opacity-0 mix-blend-overlay z-0"
        animate={{ opacity: [0, 0.1, 0] }}
        transition={{ duration: 2, times: [0, 0.5, 1], delay: 1 }}
      />
    </motion.div>
  );
};

export default Scene5;
