import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 0 — Act 1 cold open: The Rep Arrives.
 * Bright, sunny, a little too perfect. The satire begins with the light.
 */
const Scene0: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-end justify-start z-10 bg-[var(--color-brand-warm)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Bright commercial photography — full exposure, sitcom warmth */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1.02 }}
        exit={{ scale: 1 }}
        transition={{ scale: { duration: 6, ease: 'linear' } }}
      >
        <img
          src={`${baseUrl}assets/act1_rep_arrives.jpg`}
          alt="A cheerful sales rep arriving with donuts and coffee"
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(1.15) brightness(1.05)' }}
        />
        {/* Light scrim only where the slate sits */}
        <div className="absolute inset-x-0 bottom-0 h-[38vh] bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </motion.div>

      {/* Documentary slate — wry, deadpan */}
      <div className="relative z-10 w-full px-[6vw] pb-[8vh]">
        <motion.p
          className="font-sans font-bold text-[2vw] tracking-[0.45em] uppercase text-[var(--color-brand-warm)] text-shadow-subtle"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
        >
          Tuesday &middot; 9:47 AM
        </motion.p>

        <motion.h1
          className="font-display italic font-semibold text-[6.2vw] leading-[1.15] text-white text-shadow-heavy mt-[1.2vh]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 1.5 }}
        >
          The weekly sales visit.
        </motion.h1>
      </div>
    </motion.div>
  );
};

export default Scene0;
