import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 5 — The Pivot.
 * The red corridor wipes in from the left with real urgency in the frame.
 * The demand punches in over it, fast and no-nonsense.
 */
const Scene5: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'linear' }}
    >
      {/* Red-graded corridor — wipes in hard from the left */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1], delay: 0.15 }}
      >
        <motion.img
          src={`${baseUrl}assets/act2_red_corridor.jpg`}
          alt="A hospital corridor washed in urgent red light"
          className="w-full h-full object-cover"
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 7.5, ease: 'linear' }}
        />
        {/* Keep the center readable without killing the red */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 75% 65% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)',
          }}
        />
      </motion.div>

      {/* The demand — punches in hard */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full px-[6vw]">
        <motion.h2
          className="font-sans font-extrabold text-[5.2vw] leading-[1.15] uppercase tracking-tight text-white text-shadow-heavy"
          initial={{ opacity: 0, scale: 1.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 0.85, 0.15, 1], delay: 0.9 }}
        >
          It&rsquo;s time to change
        </motion.h2>

        <motion.h2
          className="font-sans font-extrabold text-[5.2vw] leading-[1.15] uppercase tracking-tight text-white text-shadow-heavy mt-[1.2vh]"
          initial={{ opacity: 0, scale: 1.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 0.85, 0.15, 1], delay: 1.6 }}
        >
          how hospice sales
          <br />
          is delivered.
        </motion.h2>

        {/* White rule slams underneath */}
        <motion.div
          className="h-[0.7vh] w-[32vw] bg-white mt-[4vh]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1], delay: 2.7 }}
        />

        {/* Kicker — the alternative to donuts */}
        <motion.p
          className="font-sans font-medium text-[2.1vw] tracking-[0.35em] uppercase text-[var(--color-brand-warm)] text-shadow-subtle mt-[3.5vh]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 4.2 }}
        >
          Not with donuts. With discipline.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Scene5;
