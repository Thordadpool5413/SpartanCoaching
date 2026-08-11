import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 1 — "The Howdy Doody Call."
 * Three sales-call pleasantries bounce in one after another,
 * playful and mocking. Light, blurred break-room register.
 */
const LINES = [
  { text: '\u201CHi! Brought donuts.\u201D', delay: 0.6 },
  { text: '\u201CWe\u2019re the best hospice in town.\u201D', delay: 2.8 },
  { text: '\u201CHave a great day!\u201D', delay: 5.0 },
];

const Scene1: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Blurred, bright hallway — the world where this call happens */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 0.55, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: { duration: 1.4, ease: 'easeOut' },
          scale: { duration: 8, ease: 'linear' },
        }}
      >
        <img
          src={`${baseUrl}assets/hospice_hallway.jpg`}
          alt=""
          className="w-full h-full object-cover blur-[6px] scale-105"
        />
        <div className="absolute inset-0 bg-[var(--color-brand-warm)]/15" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/75" />
      </motion.div>

      {/* Ironic label pinned at the top */}
      <motion.p
        className="absolute top-[10vh] z-10 font-sans font-semibold text-[1.9vw] tracking-[0.5em] uppercase text-[var(--color-brand-warm)] text-shadow-subtle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
      >
        The Sales Call
      </motion.p>

      {/* The three pleasantries — each bounces in, dripping with irony */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-[4.5vh] w-full px-[6vw] text-center">
        {LINES.map((line) => (
          <motion.h2
            key={line.text}
            className="font-display italic font-semibold text-[5.6vw] leading-[1.25] text-[var(--color-brand-white)] text-shadow-heavy"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.7,
              type: 'spring',
              stiffness: 260,
              damping: 14,
              delay: line.delay,
            }}
          >
            {line.text}
          </motion.h2>
        ))}
      </div>
    </motion.div>
  );
};

export default Scene1;
