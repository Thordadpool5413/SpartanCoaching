import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1_Intro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1300),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
      transition={{ duration: 0.25 }}
    >
      <div className="text-center px-8">
        <motion.h2
          className="text-[2.5vw] text-white/55 tracking-[0.7em] uppercase font-body font-light mb-5"
          initial={{ opacity: 0, y: -16 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
          transition={{ type: 'spring', stiffness: 700, damping: 28 }}
        >
          Hospice Sales
        </motion.h2>

        <div className="overflow-hidden">
          <motion.h1
            className="text-[9vw] text-white font-display font-black uppercase tracking-tight leading-[0.9]"
            initial={{ y: '110%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '110%' }}
            transition={{ type: 'spring', stiffness: 900, damping: 38 }}
          >
            IS NOT A
          </motion.h1>
        </div>

        <div className="overflow-hidden">
          <motion.h1
            className="text-[9vw] text-[#e8291e] font-display font-black uppercase tracking-tight leading-[0.9]"
            initial={{ y: '110%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '110%' }}
            transition={{ type: 'spring', stiffness: 900, damping: 38, delay: 0.04 }}
          >
            MYSTERY
          </motion.h1>
        </div>

        <motion.div
          className="h-[3px] bg-[#e8291e] mt-7 origin-left"
          initial={{ scaleX: 0 }}
          animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}
