import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const statsBg = `${import.meta.env.BASE_URL}stats-bg.mp4`;

export function Scene1_ColdOpen() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),    // red line draws
      setTimeout(() => setPhase(2), 600),  // GAP. slams in
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
      transition={{ duration: 0.4 }}
    >
      {/* AI video clip as dark atmospheric background */}
      <video
        src={statsBg}
        className="absolute inset-0 w-full h-full object-cover opacity-15"
        autoPlay
        muted
        playsInline
        loop
      />
      <div className="absolute inset-0 bg-[#070707]/70" />

      {/* Red line draws left-to-right at vertical center */}
      <motion.div
        className="absolute bg-[#e8291e] h-[2px] origin-left"
        style={{ top: '50%', left: '8vw', right: '8vw' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* GAP. slams down from above */}
      <div className="absolute inset-0 flex items-center pl-[8vw] pr-[10vw] overflow-hidden">
        <div className="overflow-hidden w-full">
          <motion.h1
            className="font-display uppercase text-[#f5f5f0] leading-none"
            style={{ fontSize: '28vw' }}
            initial={{ y: '-110%', filter: 'blur(8px)' }}
            animate={phase >= 2 ? { y: 0, filter: 'blur(0px)' } : { y: '-110%', filter: 'blur(8px)' }}
            transition={{ type: 'spring', stiffness: 340, damping: 24 }}
          >
            GAP<span className="text-[#e8291e]">.</span>
          </motion.h1>
        </div>
      </div>
    </motion.div>
  );
}
