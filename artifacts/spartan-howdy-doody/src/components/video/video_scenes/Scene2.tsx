import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 2 — The Turn.
 * The warmth visibly drains out of the frame on screen — color and
 * brightness bleed away over an empty bedroom — and the stat lands.
 */
const Scene2: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-end justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'linear' }}
    >
      {/* The empty bed — starts warm and bright, drains to cold */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ scale: { duration: 8, ease: 'linear' } }}
      >
        <motion.img
          src={`${baseUrl}assets/act2_empty_bed.jpg`}
          alt="An empty bed by a window at dusk"
          className="w-full h-full object-cover"
          initial={{ filter: 'saturate(1.55) brightness(1.3) sepia(0.28)' }}
          animate={{ filter: 'saturate(0.7) brightness(0.95) sepia(0)' }}
          transition={{ duration: 3.2, ease: [0.4, 0, 0.6, 1], delay: 0.4 }}
        />
        {/* Warm glow that fades away as the color drains */}
        <motion.div
          className="absolute inset-0 bg-[#f4b860] mix-blend-overlay"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 3.2, ease: [0.4, 0, 0.6, 1], delay: 0.4 }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[46vh] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      </motion.div>

      {/* The stat — lands only after the warmth is gone */}
      <div className="relative z-10 flex flex-col items-center text-center w-full px-[7vw] pb-[9vh]">
        <motion.p
          className="font-sans font-light text-[3vw] leading-[1.5] tracking-wide text-[var(--color-brand-warm)] text-shadow-subtle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, ease: 'easeOut', delay: 3.4 }}
        >
          Of the patients who needed hospice last year &mdash;
        </motion.p>

        <motion.h2
          className="font-sans font-extrabold text-[6.6vw] leading-[1.15] text-white text-shadow-heavy mt-[2vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 5.2 }}
        >
          most never got it.
        </motion.h2>
      </div>
    </motion.div>
  );
};

export default Scene2;
