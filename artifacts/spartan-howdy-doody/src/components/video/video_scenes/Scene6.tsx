import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 6 — Brand Close.
 * The Spartan stamp slams in bigger and harder than before, the lockup
 * rises, and a final kicker ends the Howdy Doody call for good.
 */
const Scene6: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Red corridor continuity — heavily darkened, barely there */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 0.3, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ opacity: { duration: 1.6, ease: 'easeOut' }, scale: { duration: 9, ease: 'linear' } }}
      >
        <img
          src={`${baseUrl}assets/act2_red_corridor.jpg`}
          alt=""
          className="w-full h-full object-cover blur-[18px] scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/90" />
      </motion.div>

      {/* Red shock pulse at the moment of impact */}
      <motion.div
        className="absolute z-[5] w-[85vw] h-[85vw] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(218,41,28,0.5) 0%, rgba(218,41,28,0.15) 35%, transparent 65%)',
        }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 1.4] }}
        transition={{ duration: 0.9, times: [0, 0.25, 1], delay: 0.75, ease: 'easeOut' }}
      />

      {/* Frame shake on impact */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full"
        animate={{ x: [0, -10, 8, -5, 3, 0], y: [0, 6, -4, 3, -1, 0] }}
        transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
      >
        {/* The stamp — bigger, dominating the frame */}
        <motion.div
          className="w-[38vw] relative"
          style={{ filter: 'drop-shadow(0 30px 70px rgba(0,0,0,0.85))' }}
          initial={{ scale: 3, opacity: 0, rotate: -14 }}
          animate={{ scale: 1, opacity: 1, rotate: -4 }}
          transition={{ duration: 0.45, ease: [0.2, 0.85, 0.15, 1], delay: 0.45 }}
        >
          <img
            src={`${baseUrl}spartan-stamp-logo.png`}
            alt="Spartan Coaching"
            className="w-full h-auto object-contain"
          />
        </motion.div>

        {/* Lockup — rises beneath the stamp */}
        <div className="flex flex-col items-center text-center mt-[1vh] px-[5vw] w-full">
          <motion.p
            className="font-display italic text-[2.3vw] leading-[1.4] text-[var(--color-brand-warm)] text-shadow-subtle"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 0.95, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 1.6 }}
          >
            Training hospice sales teams to find the patients no one else will.
          </motion.p>

          {/* Red rule sweeps in */}
          <motion.div
            className="h-[0.6vh] w-[30vw] bg-[var(--color-brand-red)] mt-[2.2vh] origin-left"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.3, 1], delay: 2.6 }}
          />

          {/* Final kicker — ends the Howdy Doody call for good */}
          <motion.p
            className="font-sans font-bold text-[1.9vw] tracking-[0.4em] uppercase text-white text-shadow-subtle mt-[2.4vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 3.6 }}
          >
            The Howdy Doody call ends here.
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Scene6;
