import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 5 — The Pivot.
 * Red floods the frame from the left. The demand punches in,
 * fast and no-nonsense. The red then settles as the text holds.
 */
const Scene5: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'linear' }}
    >
      {/* Red flood — wipes in from the left, then holds as the stage */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 0.65, ease: [0.7, 0, 0.2, 1], delay: 0.2 }}
      >
        <img
          src={`${baseUrl}assets/red_flood_bg.jpg`}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[var(--color-brand-red)]/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
      </motion.div>

      {/* The demand — punches in hard */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full px-[6vw]">
        <motion.h2
          className="font-sans font-extrabold text-[5.4vw] leading-[1.2] uppercase tracking-tight text-[var(--color-brand-white)] text-shadow-heavy"
          initial={{ opacity: 0, scale: 1.35 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.2, 0.85, 0.15, 1], delay: 0.9 }}
        >
          It&rsquo;s time to change
        </motion.h2>

        <motion.h2
          className="font-sans font-extrabold text-[5.4vw] leading-[1.2] uppercase tracking-tight text-[var(--color-brand-white)] text-shadow-heavy mt-[1vh]"
          initial={{ opacity: 0, scale: 1.35 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.2, 0.85, 0.15, 1], delay: 1.5 }}
        >
          how hospice sales is delivered.
        </motion.h2>

        {/* Underline settles the statement */}
        <motion.div
          className="h-[0.6vh] w-[30vw] bg-[var(--color-brand-white)] mt-[4vh]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 2.4 }}
        />
      </div>
    </motion.div>
  );
};

export default Scene5;
