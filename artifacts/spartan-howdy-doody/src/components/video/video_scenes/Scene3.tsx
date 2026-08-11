import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 3 — "And your rep brought donuts."
 * The same warm serif from the sales call returns,
 * but now it reads as an indictment. Red underline sweeps and holds.
 */
const Scene3: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full px-[6vw]">
        <div className="relative inline-block pb-[2.5vh]">
          <motion.h2
            className="font-display italic font-semibold text-[6.8vw] leading-[1.25] text-[var(--color-brand-white)] text-shadow-heavy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, ease: 'easeOut', delay: 0.5 }}
          >
            And your rep brought donuts.
          </motion.h2>

          {/* The red strike — the moment the irony curdles */}
          <motion.div
            className="absolute bottom-0 left-0 h-[1.2vh] bg-[var(--color-brand-red)] shadow-[0_0_20px_rgba(218,41,28,0.55)]"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.55, ease: [0.7, 0, 0.3, 1], delay: 2.0 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Scene3;
