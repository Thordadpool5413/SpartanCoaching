import React from 'react';
import { motion } from 'framer-motion';

const Scene1: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: "-10vw" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center justify-center w-[90vw] text-center">
        <motion.p
          className="font-sans font-medium text-[3vw] tracking-widest text-[var(--color-brand-gray)] uppercase mb-[4vh]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        >
          It's not about who brings the best
        </motion.p>
        
        <div className="flex items-center gap-[3vw] overflow-hidden py-4">
          <motion.h2
            className="font-display font-semibold text-[10vw] leading-none tracking-tight text-[var(--color-brand-white)]"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.1, 1], delay: 0.6 }}
          >
            DONUTS
          </motion.h2>
          
          <motion.span
            className="font-sans font-light italic text-[3vw] text-[var(--color-brand-gray)]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 1.0 }}
          >
            or
          </motion.span>
          
          <motion.h2
            className="font-display font-semibold text-[10vw] leading-none tracking-tight text-[var(--color-brand-white)]"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.1, 1], delay: 1.2 }}
          >
            COFFEE.
          </motion.h2>
        </div>

        {/* Subtle respectful underline */}
        <motion.div
          className="w-[20vw] h-[2px] bg-[var(--color-brand-gray)] mt-[4vh] opacity-30"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.5 }}
        />
      </div>
    </motion.div>
  );
};

export default Scene1;
