import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const statsBg = `${import.meta.env.BASE_URL}stats-bg.mp4`;

export function Scene1_ColdOpen() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <video src={statsBg} className="absolute inset-0 w-full h-full object-cover opacity-10" autoPlay muted playsInline loop />
      <div className="absolute inset-0 bg-[#070707]/80" />

      {/* Red line */}
      <motion.div
        className="absolute bg-[#e8291e] origin-left"
        style={{ top: '52%', left: '7vw', right: '7vw', height: '4px' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Context line — above divider */}
      <div className="absolute inset-0 flex items-center pl-[7vw] pr-[7vw]" style={{ paddingBottom: '10vh' }}>
        <motion.p
          className="font-body text-[#9a9a8e] uppercase"
          style={{ fontSize: 'clamp(24px, 4.5vw, 68px)', letterSpacing: '0.12em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        >
          Hospice care is chronically underutilized.
        </motion.p>
      </div>

      {/* THE GAP. — below divider, fills screen */}
      <div className="absolute inset-0 flex items-end pb-[3vh] pl-[5vw] overflow-hidden">
        <div className="overflow-hidden w-full">
          <motion.h1
            className="font-display uppercase text-[#f5f5f0] leading-none"
            style={{ fontSize: 'clamp(120px, 26vw, 420px)' }}
            initial={{ y: '110%' }}
            animate={phase >= 3 ? { y: 0 } : { y: '110%' }}
            transition={{ type: 'spring', stiffness: 170, damping: 30 }}
          >
            THE GAP<span style={{ color: '#e8291e' }}>.</span>
          </motion.h1>
        </div>
      </div>
    </motion.div>
  );
}
