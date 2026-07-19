import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2_Buildup() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.h1 
          className="text-[15vw] font-display font-bold uppercase text-white/10 leading-none absolute"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={phase >= 1 && phase < 3 ? { opacity: 1, scale: 1.1 } : { opacity: 0, scale: 1.2 }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
        >
          IT IS A
        </motion.h1>

        <motion.h1 
          className="text-[20vw] font-display font-black uppercase text-[#e8291e] leading-none absolute mix-blend-screen"
          initial={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
        >
          PROMISE
        </motion.h1>
      </div>

      <motion.div 
        className="absolute bottom-20 left-20 w-32 h-1 bg-[#e8291e]"
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
}
