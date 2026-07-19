import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1_Intro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div 
        className="text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 6, ease: 'easeOut' }}
      >
        <div className="overflow-hidden">
          <motion.h2 
            className="text-[2vw] text-white/50 tracking-[1em] uppercase font-body font-light mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            Hospice Sales
          </motion.h2>
        </div>
        
        <div className="overflow-hidden">
          <motion.h1 
            className="text-[6vw] text-white font-display uppercase tracking-tight leading-none"
            initial={{ y: "100%", opacity: 0 }}
            animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            IS NOT A MYSTERY
          </motion.h1>
        </div>
      </motion.div>
    </motion.div>
  );
}
