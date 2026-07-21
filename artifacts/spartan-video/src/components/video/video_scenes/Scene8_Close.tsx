import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const spartanStamp = `${import.meta.env.BASE_URL}spartan-logo-stamp.png`;

export function Scene8_Close() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070707]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.img
        src={spartanStamp}
        alt="Spartan Stamp"
        className="w-[20vw] h-[20vw] object-contain mb-8"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      <div className="overflow-hidden">
        <motion.h2
          className="text-[4vw] font-display text-[#f5f5f0] tracking-widest uppercase"
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={phase >= 2 ? { clipPath: 'inset(0 0% 0 0)' } : { clipPath: 'inset(0 100% 0 0)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          SPARTAN COACHING
        </motion.h2>
      </div>

      <motion.p
        className="text-[1.5vw] font-body text-[#9a9a8e] mt-4 tracking-wider"
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        spartancoaching.com
      </motion.p>
    </motion.div>
  );
}
