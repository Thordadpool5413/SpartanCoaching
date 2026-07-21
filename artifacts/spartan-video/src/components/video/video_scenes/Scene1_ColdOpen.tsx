import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const statsBg = `${import.meta.env.BASE_URL}stats-bg.mp4`;

export function Scene1_ColdOpen() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 3400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <video
        src={statsBg}
        className="absolute inset-0 w-full h-full object-cover opacity-10"
        autoPlay muted playsInline loop
      />
      <div className="absolute inset-0 bg-[#070707]/80" />

      {/* Red line draws left-to-right */}
      <motion.div
        className="absolute bg-[#e8291e] origin-left"
        style={{ top: '50%', left: '8vw', right: '8vw', height: '3px' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Context line above the divider */}
      <div className="absolute inset-0 flex items-center pl-[8vw] pr-[8vw]" style={{ paddingBottom: '12vh' }}>
        <motion.p
          className="font-body text-[#9a9a8e] tracking-widest uppercase"
          style={{ fontSize: '3vw', letterSpacing: '0.2em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          Hospice care is chronically underutilized.
        </motion.p>
      </div>

      {/* THE GAP. below the divider */}
      <div className="absolute inset-0 flex items-end pb-[6vh] pl-[6vw] pr-[6vw] overflow-hidden">
        <div className="overflow-hidden w-full">
          <motion.h1
            className="font-display uppercase text-[#f5f5f0] leading-none"
            style={{ fontSize: '22vw' }}
            initial={{ y: '110%' }}
            animate={phase >= 3 ? { y: 0 } : { y: '110%' }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          >
            THE GAP<span className="text-[#e8291e]">.</span>
          </motion.h1>
        </div>
      </div>
    </motion.div>
  );
}
