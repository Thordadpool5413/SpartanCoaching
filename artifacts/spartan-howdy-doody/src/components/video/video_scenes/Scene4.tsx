import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 4 — The Leader Challenge.
 * A properly lit, authoritative director on the right of frame.
 * Three questions build on the left, each heavier than the last.
 */
const Scene4: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-start z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* The director — face clearly lit, watching */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          scale: { duration: 10, ease: 'linear' },
          opacity: { duration: 1.2, ease: 'easeOut' },
        }}
      >
        <img
          src={`${baseUrl}assets/act2_leader.jpg`}
          alt="A hospice clinical director, arms crossed"
          className="w-full h-full object-cover object-[70%_22%]"
          style={{ filter: 'brightness(1.18)' }}
        />
        {/* Deepen only the left text column; keep her face lit */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
      </motion.div>

      {/* Three questions, escalating in weight and size */}
      <div className="relative z-10 flex flex-col justify-center gap-[4.5vh] w-[58vw] pl-[6vw]">
        <motion.h2
          className="font-sans font-normal text-[3vw] leading-[1.3] text-[var(--color-brand-gray)] text-shadow-subtle"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
        >
          Why do you accept this?
        </motion.h2>

        <motion.h2
          className="font-sans font-semibold text-[3.9vw] leading-[1.3] text-[var(--color-brand-warm)] text-shadow-subtle"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 3.4 }}
        >
          Why does your team accept this?
        </motion.h2>

        <div>
          <motion.h2
            className="font-display font-bold text-[5.2vw] leading-[1.15] text-white text-shadow-heavy"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 6.2 }}
          >
            Families are
            <br />
            running out of time.
          </motion.h2>
          <motion.div
            className="h-[0.9vh] bg-[var(--color-brand-red)] mt-[2.2vh] origin-left"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.3, 1], delay: 7.6 }}
            style={{ width: '26vw' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Scene4;
