import React from 'react';
import { motion } from 'framer-motion';

/**
 * Final scene — the brand close.
 * The Spartan stamp SLAMS into center frame like a real stamp impact,
 * followed by the "That's Spartan Hospice Coaching!" lockup rising beneath it.
 */
const Scene6: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Warm documentary background — heavily blurred, barely-there continuity with the film */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 0.3, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ opacity: { duration: 1.8, ease: 'easeOut' }, scale: { duration: 6, ease: 'linear' } }}
      >
        <img
          src={`${baseUrl}assets/deep_conversation.jpg`}
          alt=""
          className="w-full h-full object-cover blur-[24px] scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/90" />
      </motion.div>

      {/* Red shock pulse behind the stamp at the moment of impact */}
      <motion.div
        className="absolute z-[5] w-[70vw] h-[70vw] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(218,41,28,0.45) 0%, rgba(218,41,28,0.12) 35%, transparent 65%)',
        }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1.15, 1.35] }}
        transition={{ duration: 0.9, times: [0, 0.25, 1], delay: 0.95, ease: 'easeOut' }}
      />

      {/* Frame shake on impact — the whole lockup jolts when the stamp lands */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full"
        animate={{ x: [0, -7, 6, -3, 2, 0], y: [0, 4, -3, 2, -1, 0] }}
        transition={{ duration: 0.45, delay: 1.0, ease: 'easeOut' }}
      >
        {/* The stamp — slams in from above the frame, oversized and dominant */}
        <motion.div
          className="w-[34vw] relative"
          style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.8))' }}
          initial={{ scale: 2.6, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: -4 }}
          transition={{ duration: 0.5, ease: [0.2, 0.85, 0.15, 1], delay: 0.6 }}
        >
          <img
            src={`${baseUrl}spartan-stamp-logo.png`}
            alt="Spartan Coaching"
            className="w-full h-auto object-contain"
          />
        </motion.div>

        {/* Lockup — rises beneath the stamp once it has landed */}
        <div className="flex flex-col items-center text-center mt-[3vh] px-[5vw] w-full">
          <motion.p
            className="font-sans font-medium text-[1.8vw] tracking-[0.55em] text-[var(--color-brand-warm)] uppercase mb-[1vh] text-shadow-subtle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 1.5 }}
          >
            That's
          </motion.p>

          <div className="overflow-hidden w-full">
            <motion.h2
              className="font-display font-bold text-[5.4vw] leading-[1.1] text-[var(--color-brand-white)] text-shadow-heavy pb-[0.5vh]"
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 1.7 }}
            >
              Spartan Hospice Coaching!
            </motion.h2>
          </div>

          {/* Red rule — echoes the opening scene's strike */}
          <motion.div
            className="h-[0.5vh] w-[28vw] bg-[var(--color-brand-red)] mt-[2.5vh] origin-left"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 2.3 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Scene6;
