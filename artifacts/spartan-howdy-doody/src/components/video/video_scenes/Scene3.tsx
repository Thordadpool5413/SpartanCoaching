import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 3 — The Indictment.
 * The same donut box, abandoned at dusk. One line, lower third,
 * consistent with every other scene: the pleasantry is now an accusation.
 */
const Scene3: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* The cold donut box — the morning's cheer, gone stale */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.07, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          scale: { duration: 6.5, ease: 'linear' },
          opacity: { duration: 1.0, ease: 'easeOut' },
        }}
      >
        <img
          src={`${baseUrl}assets/act2_cold_donuts.jpg`}
          alt="The untouched donut box on an empty counter at dusk"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(1.6) contrast(1.02) saturate(0.9)' }}
        />
        {/* Lower-third scrim — keeps the box itself visible */}
        <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      </motion.div>

      {/* Slate — same visit, hours later */}
      <motion.p
        className="absolute top-[6vh] left-[6vw] z-10 font-sans font-bold text-[1.8vw] tracking-[0.45em] uppercase text-[var(--color-brand-gray)] text-shadow-subtle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
      >
        6:12 PM &middot; Same day
      </motion.p>

      {/* The accusation — lower third, red strike underneath */}
      <div className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <div className="relative inline-block pb-[2vh]">
          <motion.h2
            className="font-display italic font-semibold text-[5vw] leading-[1.2] text-white text-shadow-heavy"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
          >
            And your rep brought donuts.
          </motion.h2>

          {/* The red strike — the moment the irony curdles */}
          <motion.div
            className="absolute bottom-0 left-0 h-[1vh] bg-[var(--color-brand-red)] shadow-[0_0_20px_rgba(218,41,28,0.55)]"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1], delay: 2.8 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Scene3;
