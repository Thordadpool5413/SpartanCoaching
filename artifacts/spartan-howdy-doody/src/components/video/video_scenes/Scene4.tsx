import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 4 — The Leader Challenge.
 * Photographic authority in the background. Three questions build
 * line by line, each heavier than the last. The satire is over.
 */
const Scene4: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-start z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* The leader — blurred, authoritative, watching */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 0.55, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: { duration: 1.6, ease: 'easeOut' },
          scale: { duration: 10, ease: 'linear' },
        }}
      >
        <img
          src={`${baseUrl}assets/leader_challenge.jpg`}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
      </motion.div>

      {/* Three questions, escalating in weight and size */}
      <div className="relative z-10 flex flex-col justify-center gap-[4vh] w-full px-[7vw]">
        <motion.h2
          className="font-sans font-light text-[3.6vw] leading-[1.3] text-[var(--color-brand-gray)] text-shadow-subtle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.8 }}
        >
          Why do you accept this?
        </motion.h2>

        <motion.h2
          className="font-sans font-medium text-[4.6vw] leading-[1.3] text-[var(--color-brand-warm)] text-shadow-subtle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 3.2 }}
        >
          Why does your team accept this?
        </motion.h2>

        <motion.h2
          className="font-display font-bold text-[6.2vw] leading-[1.2] text-[var(--color-brand-white)] text-shadow-heavy"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 5.8 }}
        >
          Families are running out of time.
        </motion.h2>
      </div>
    </motion.div>
  );
};

export default Scene4;
