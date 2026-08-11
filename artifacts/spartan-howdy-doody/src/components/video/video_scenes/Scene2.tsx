import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 2 — The Turn: who the Howdy Doody call never reaches.
 * Hard cut from the donut party to a family caring for a dying husband
 * alone at night — no nurses, no support. The warmth drains from the
 * frame, then the stat lands over the people it's actually about.
 */
const Scene2: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'linear' }}
    >
      {/* The family, alone — starts warm, drains cold on screen */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ scale: { duration: 9, ease: 'linear' } }}
      >
        <motion.img
          src={`${baseUrl}assets/act2_family_alone.jpg`}
          alt="A wife sits alone at her dying husband's bedside, with no hospice support"
          className="w-full h-full object-cover object-[center_30%]"
          initial={{ filter: 'saturate(1.35) brightness(1.15) sepia(0.2)' }}
          animate={{ filter: 'saturate(0.75) brightness(1.0) sepia(0)' }}
          transition={{ duration: 2.8, ease: [0.4, 0, 0.6, 1], delay: 0.5 }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[42vh] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      </motion.div>

      {/* Context slate — this is the other side of town */}
      <motion.p
        className="absolute top-[6vh] left-[6vw] z-10 font-sans font-bold text-[1.8vw] tracking-[0.45em] uppercase text-[var(--color-brand-warm)] text-shadow-subtle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.95 }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.6 }}
      >
        Meanwhile &middot; No hospice. No help.
      </motion.p>

      {/* The stat — lands after the color drain, lower third */}
      <div className="absolute inset-x-0 bottom-[7vh] z-10 flex flex-col items-start px-[6vw]">
        <motion.p
          className="font-sans font-light text-[2.6vw] leading-[1.4] tracking-wide text-[var(--color-brand-warm)] text-shadow-subtle"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 3.2 }}
        >
          Of the patients who needed hospice last year &mdash;
        </motion.p>

        <motion.h2
          className="font-sans font-extrabold text-[5.8vw] leading-[1.1] text-white text-shadow-heavy mt-[1.6vh]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 4.8 }}
        >
          most never got it.
        </motion.h2>
      </div>
    </motion.div>
  );
};

export default Scene2;
