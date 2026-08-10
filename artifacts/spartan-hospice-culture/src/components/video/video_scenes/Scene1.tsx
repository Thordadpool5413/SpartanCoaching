import React from 'react';
import { motion } from 'framer-motion';

const Scene1: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center justify-center w-full max-w-[80vw] z-10 relative">
        <motion.div
          className="overflow-hidden mb-[2vh]"
          initial={{ opacity: 0, y: "50%" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        >
          <p className="font-sans text-[2.5vw] tracking-wide text-[var(--color-brand-lightMuted)] uppercase">
            It's not about who brings the best
          </p>
        </motion.div>
        
        <div className="flex items-center gap-[3vw]">
          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, rotateX: 90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          >
            <h2 className="font-display text-[7vw] font-medium text-[var(--color-brand-light)]">
              donuts
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 1.1 }}
          >
            <span className="font-display text-[4vw] text-[var(--color-brand-lightMuted)] font-light italic">
              or
            </span>
          </motion.div>
          
          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, rotateX: -90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.4 }}
          >
            <h2 className="font-display text-[7vw] font-medium text-[var(--color-brand-light)]">
              coffee.
            </h2>
          </motion.div>
        </div>
      </div>
      
      {/* Structural Accent Lines */}
      <motion.div
        className="absolute top-1/2 left-[5vw] right-[5vw] h-[1px] bg-[var(--color-brand-light)]/10 z-0"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      />
    </motion.div>
  );
};

export default Scene1;
