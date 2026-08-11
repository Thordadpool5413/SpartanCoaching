import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 1 — "The Howdy Doody Call", named on screen.
 * Bright nurses' station, big smiles. The three pleasantries appear
 * ONE AT A TIME in the lower third — each fades in, holds, and leaves
 * before the next arrives, so the faces stay visible and nothing crowds.
 */
const LINES = [
  { text: '\u201CHi! Brought donuts!\u201D', start: 0.9 },
  { text: '\u201CWe\u2019re the best hospice in town!\u201D', start: 3.4 },
  { text: '\u201CHave a great day!\u201D', start: 5.9 },
];

const LINE_ON = 2.3; // seconds each line is fully visible

const Scene1: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[var(--color-brand-warm)]"
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
        {/* Scrim only over the lower third where the dialogue sits */}
        <div className="absolute inset-x-0 bottom-0 h-[34vh] bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
      </motion.div>

      {/* The name of the call — a red tag, top-left, out of the faces */}
      <motion.div
        className="absolute top-[6vh] left-[6vw] z-10 bg-[var(--color-brand-red)] px-[2vw] py-[1.3vh] shadow-[0_10px_35px_rgba(0,0,0,0.45)]"
        initial={{ opacity: 0, scale: 1.4, rotate: 2 }}
        animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
        transition={{ duration: 0.45, ease: [0.2, 0.85, 0.15, 1], delay: 0.35 }}
      >
        <p className="font-sans font-extrabold text-[2vw] tracking-[0.28em] uppercase text-white">
          The &ldquo;Howdy Doody&rdquo; Call
        </p>
      </motion.div>

      {/* One pleasantry at a time — lower third, like sitcom dialogue */}
      <div className="absolute inset-x-0 bottom-[7vh] z-10 flex items-end justify-start px-[6vw]">
        {LINES.map((line) => (
          <motion.h2
            key={line.text}
            className="absolute bottom-0 left-[6vw] font-display italic font-bold text-[4.6vw] leading-[1.2] text-white text-shadow-heavy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -12] }}
            transition={{
              duration: LINE_ON + 0.8,
              times: [0, 0.16, 0.84, 1],
              delay: line.start,
              ease: 'easeOut',
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
