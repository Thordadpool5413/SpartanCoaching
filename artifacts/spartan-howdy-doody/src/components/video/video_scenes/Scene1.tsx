import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 1 — "The Howdy Doody Call", named on screen.
 * Bright nurses' station, big smiles, and three pleasantries
 * that bounce in one after another — playful, mocking, hollow.
 */
const LINES = [
  { text: '\u201CHi! Brought donuts!\u201D', delay: 1.4, rotate: -1.5 },
  { text: '\u201CWe\u2019re the best hospice in town!\u201D', delay: 3.6, rotate: 1 },
  { text: '\u201CHave a great day!\u201D', delay: 5.8, rotate: -1 },
];

const Scene1: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-warm)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Bright, cheerful nurses' station — fully exposed */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.98 }}
        transition={{ scale: { duration: 9, ease: 'linear' } }}
      >
        <img
          src={`${baseUrl}assets/act1_donuts_smiles.jpg`}
          alt="Nurses happily reaching into a donut box"
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(1.12) brightness(1.03)' }}
        />
        {/* Soft center scrim so type stays readable over the busy image */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0.12) 100%)',
          }}
        />
      </motion.div>

      {/* The name of the call — a red tag, stamped on screen */}
      <motion.div
        className="absolute top-[8vh] z-10 bg-[var(--color-brand-red)] px-[2.2vw] py-[1.4vh] shadow-[0_10px_35px_rgba(0,0,0,0.45)]"
        initial={{ opacity: 0, scale: 1.5, rotate: 3 }}
        animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
        transition={{ duration: 0.45, ease: [0.2, 0.85, 0.15, 1], delay: 0.4 }}
      >
        <p className="font-sans font-extrabold text-[2.3vw] tracking-[0.3em] uppercase text-white">
          The &ldquo;Howdy Doody&rdquo; Call
        </p>
      </motion.div>

      {/* Three pleasantries, bouncing in — dripping with irony */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-[4vh] w-full px-[6vw] pt-[8vh] text-center">
        {LINES.map((line) => (
          <motion.h2
            key={line.text}
            className="font-display italic font-bold text-[5.2vw] leading-[1.25] text-white text-shadow-heavy"
            initial={{ opacity: 0, scale: 0.7, y: 26 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: line.rotate }}
            transition={{
              type: 'spring',
              stiffness: 320,
              damping: 13,
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
