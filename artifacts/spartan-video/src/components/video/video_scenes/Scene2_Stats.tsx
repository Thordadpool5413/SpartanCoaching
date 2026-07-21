import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const statsBg = `${import.meta.env.BASE_URL}stats-bg.mp4`;

const EASE = [0.16, 1, 0.3, 1] as const;

export function Scene2_Stats() {
  const [phase, setPhase] = useState(0);
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => { setPhase(1); setFlashKey(k => k + 1); }, 0),
      setTimeout(() => { setPhase(2); setFlashKey(k => k + 1); }, 1333),
      setTimeout(() => { setPhase(3); setFlashKey(k => k + 1); }, 2666),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const vis = (n: number) => ({ opacity: phase === n ? 1 : 0 });
  const FAST = { duration: 0.12, ease: 'easeOut' } as const;

  return (
    <motion.div
      className="absolute inset-0 z-10 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
      transition={{ duration: 0.4 }}
    >
      <video
        src={statsBg}
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        autoPlay muted playsInline loop
      />
      <div className="absolute inset-0 bg-[#070707]/60" />

      {/* Hard-cut white flash on each phase boundary */}
      <motion.div
        key={flashKey}
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ zIndex: 40 }}
        initial={{ opacity: 0.2 }}
        animate={{ opacity: 0 }}
        transition={FAST}
      />

      {/* All three stat groups always mounted — visibility animated by phase */}

      {/* Phase 1: 500,000 Americans */}
      <motion.div
        className="absolute inset-0 flex items-center px-[10vw]"
        animate={vis(1)}
        transition={FAST}
      >
        <div className="flex justify-between items-end w-full">
          <motion.p
            className="text-[3.5vw] font-body text-[#9a9a8e] leading-tight pb-[2vw] w-[40%]"
            animate={vis(1)}
            transition={FAST}
          >
            Americans die without<br />hospice each year
          </motion.p>
          <motion.h2
            className="font-display text-[#f5f5f0] leading-none text-right"
            style={{ fontSize: '14vw' }}
            animate={phase === 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          >
            500,000
          </motion.h2>
        </div>
      </motion.div>

      {/* Phase 2: die without hospice each year */}
      <motion.div
        className="absolute inset-0 flex items-center px-[10vw]"
        animate={vis(2)}
        transition={FAST}
      >
        <div className="w-full">
          <motion.h2
            className="font-display text-[#f5f5f0] uppercase leading-[0.9]"
            style={{ fontSize: '8vw' }}
            animate={phase === 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          >
            die without<br />
            <span className="text-[#e8291e]">hospice</span> each year
          </motion.h2>
        </div>
      </motion.div>

      {/* Phase 3: who would have qualified */}
      <motion.div
        className="absolute inset-0 flex items-center px-[10vw]"
        animate={vis(3)}
        transition={FAST}
      >
        <div className="w-full">
          <motion.h2
            className="font-display text-[#9a9a8e] uppercase leading-[0.9]"
            style={{ fontSize: '6vw' }}
            animate={phase === 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          >
            who would have<br />
            <span className="text-[#f5f5f0]">qualified.</span>
          </motion.h2>
        </div>
      </motion.div>
    </motion.div>
  );
}
