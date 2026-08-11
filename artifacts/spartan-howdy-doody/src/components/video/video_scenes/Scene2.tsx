import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 2 — The Stat Slap.
 * Hard cut to black. Clinical white text. No warmup, no motion flourish.
 * The silence is the point.
 */
const Scene2: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'linear' }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full px-[8vw]">
        <motion.p
          className="font-sans font-light text-[3.4vw] leading-[1.5] tracking-wide text-[var(--color-brand-gray)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: 'linear', delay: 0.3 }}
        >
          Of the patients who needed hospice last year &mdash;
        </motion.p>

        <motion.h2
          className="font-sans font-extrabold text-[7.2vw] leading-[1.15] text-[var(--color-brand-white)] mt-[3vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: 'linear', delay: 1.6 }}
        >
          most never got it.
        </motion.h2>
      </div>
    </motion.div>
  );
};

export default Scene2;
