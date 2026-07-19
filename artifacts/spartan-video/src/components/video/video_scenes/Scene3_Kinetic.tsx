import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3_Kinetic() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2400),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 5600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 z-10"
      initial={{ opacity: 0, x: '10%' }}
      animate={{ opacity: 1, x: '0%' }}
      exit={{ opacity: 0, x: '-10%' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 flex flex-col justify-center px-[10vw]">
        <div className="overflow-hidden mb-4">
          <motion.h1 
            className="text-[7vw] font-display font-bold uppercase text-white leading-none"
            initial={{ y: "100%" }}
            animate={phase >= 1 ? { y: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            THE PROMISE IS SIMPLE:
          </motion.h1>
        </div>

        <div className="overflow-hidden mb-4">
          <motion.h1 
            className="text-[7vw] font-display font-bold uppercase text-[#e8291e] leading-none"
            initial={{ y: "100%" }}
            animate={phase >= 2 ? { y: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            WHEN A PERSON IS ELIGIBLE
          </motion.h1>
        </div>

        <div className="overflow-hidden">
          <motion.h1 
            className="text-[7vw] font-display font-bold uppercase text-white leading-none"
            initial={{ y: "100%" }}
            animate={phase >= 3 ? { y: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            THEY DESERVE CARE.
          </motion.h1>
        </div>

        {/* Accent flash */}
        <motion.div 
          className="absolute inset-0 bg-[#e8291e] z-20 pointer-events-none mix-blend-overlay"
          initial={{ opacity: 0 }}
          animate={phase === 4 ? { opacity: [0, 0.5, 0] } : { opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
