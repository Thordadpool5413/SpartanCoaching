import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const spartanStamp = `${import.meta.env.BASE_URL}spartan-logo-stamp.png`;

export function Scene5_Outro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-[#080808]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hard red impact flash on entry */}
      <motion.div
        className="absolute inset-0 bg-[#e8291e] pointer-events-none"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      <div className="relative flex flex-col items-center">
        {/* Crest stamp — dominant hero */}
        <motion.img
          src={spartanStamp}
          alt="Spartan Coaching"
          className="w-[30vh] h-[30vh] object-contain mb-8 relative z-10"
          initial={{ scale: 1.6, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 1.6, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        />

        {/* Wordmark in CSS — no image dependency */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 600, damping: 30 }}
        >
          <h1 className="text-[4.5vw] font-display font-black uppercase tracking-[0.3em] text-white leading-none">
            SPARTAN COACHING
          </h1>

          {/* Red rule shoots left-to-right */}
          <motion.div
            className="h-[3px] bg-[#e8291e] w-full origin-left mt-4 mb-4"
            initial={{ scaleX: 0 }}
            animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          />

          <motion.p
            className="text-[1.6vw] font-body text-white/55 tracking-[0.3em] uppercase"
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            Hospice Sales Consulting
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
