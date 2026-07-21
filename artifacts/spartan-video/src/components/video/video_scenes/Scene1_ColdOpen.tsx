import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const statsBg = `${import.meta.env.BASE_URL}stats-bg.mp4`;

export function Scene1_ColdOpen() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center bg-[#070707]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
      transition={{ duration: 0.4 }}
    >
      <div className="pl-[10vw] pr-[10vw] w-full">
        <motion.div
          className="overflow-hidden"
        >
          <motion.h1
            className="text-[30vw] font-display font-black uppercase text-white leading-none mix-blend-difference truncate"
            initial={{ y: '-100%', filter: 'blur(10px)' }}
            animate={phase >= 1 ? { y: 0, filter: 'blur(0px)' } : { y: '-100%', filter: 'blur(10px)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            GAP.
          </motion.h1>
        </motion.div>
      </div>
    </motion.div>
  );
}
