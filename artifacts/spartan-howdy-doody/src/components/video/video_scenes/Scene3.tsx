import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 3 — The Indictment.
 * The same donut box, now abandoned at dusk. The warm serif returns,
 * but it reads as an accusation. Red strike sweeps and holds.
 */
const Scene3: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-end z-10 bg-[var(--color-brand-black)]"
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
          scale: { duration: 7, ease: 'linear' },
          opacity: { duration: 1.1, ease: 'easeOut' },
        }}
      >
        <img
          src={`${baseUrl}assets/act2_cold_donuts.jpg`}
          alt="The untouched donut box on an empty counter at dusk"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(1.85) contrast(1.02) saturate(0.9)' }}
        />
        {/* Darken the right corridor side where the text sits */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/65 via-black/20 to-transparent" />
      </motion.div>

      {/* The accusation — right side, over the empty corridor */}
      <div className="relative z-10 flex flex-col items-start justify-center w-[52vw] pr-[6vw] pl-[2vw]">
        <motion.p
          className="font-sans font-medium text-[1.9vw] tracking-[0.5em] uppercase text-[var(--color-brand-gray)] text-shadow-subtle mb-[2.5vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.6 }}
        >
          6:12 PM &middot; Same day
        </motion.p>

        <div className="relative inline-block pb-[2.2vh]">
          <motion.h2
            className="font-display italic font-semibold text-[5.4vw] leading-[1.25] text-white text-shadow-heavy"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 1.4 }}
          >
            And your rep
            <br />
            brought donuts.
          </motion.h2>

          {/* The red strike — the moment the irony curdles */}
          <motion.div
            className="absolute bottom-0 left-0 h-[1.1vh] bg-[var(--color-brand-red)] shadow-[0_0_20px_rgba(218,41,28,0.55)]"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.55, ease: [0.7, 0, 0.3, 1], delay: 3.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Scene3;
