import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const statsBg = `${import.meta.env.BASE_URL}stats-bg.mp4`;

export function Scene2_Stats() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-20 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
      transition={{ duration: 0.4 }}
    >
      <video
        src={statsBg}
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        autoPlay
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-[#070707]/60" />

      {/* 1-frame flashes on phase change */}
      <motion.div
        className="absolute inset-0 bg-white z-50 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.15, 0] }}
        key={phase}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      />

      <div className="absolute inset-0 flex flex-col justify-center px-[10vw]">
        <div className="flex justify-between items-center w-full">
          <motion.div className="w-1/2">
            {phase === 1 && (
              <motion.p className="text-[3vw] text-[#9a9a8e] font-body"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                Americans
              </motion.p>
            )}
            {phase === 2 && (
              <motion.p className="text-[3vw] text-[#9a9a8e] font-body"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                die without hospice each year
              </motion.p>
            )}
            {phase === 3 && (
              <motion.p className="text-[3vw] text-[#9a9a8e] font-body"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                who would have qualified.
              </motion.p>
            )}
          </motion.div>

          <motion.div className="w-1/2 text-right">
            {phase === 1 && (
              <motion.h2 className="text-[12vw] font-display text-[#f5f5f0] leading-none"
                initial={{ opacity: 0, scale: 1.1, x: 40 }} animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                500,000
              </motion.h2>
            )}
            {phase === 2 && (
              <motion.h2 className="text-[12vw] font-display text-[#e8291e] leading-none"
                initial={{ opacity: 0, scale: 1.1, x: 40 }} animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                WITHOUT
              </motion.h2>
            )}
            {phase === 3 && (
              <motion.h2 className="text-[12vw] font-display text-[#f5f5f0] leading-none"
                initial={{ opacity: 0, scale: 1.1, x: 40 }} animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                QUALIFIED
              </motion.h2>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
