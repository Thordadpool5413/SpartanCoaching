import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const statsBg = `${import.meta.env.BASE_URL}stats-bg.mp4`;
const EASE = [0.16, 1, 0.3, 1] as const;

export function Scene2_Stats() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 2800),
      setTimeout(() => setPhase(3), 5200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const vis = (n: number) => ({ opacity: phase === n ? 1 : 0, transition: { duration: 0.3 } });

  return (
    <motion.div
      className="absolute inset-0 z-10 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <video
        src={statsBg}
        className="absolute inset-0 w-full h-full object-cover opacity-25"
        autoPlay muted playsInline loop
      />
      <div className="absolute inset-0 bg-[#070707]/65" />

      {/* Phase 1: big number */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-[8vw]"
        animate={vis(1)}
      >
        <motion.h2
          className="font-display text-[#f5f5f0] leading-none text-center"
          style={{ fontSize: '24vw' }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          500,000
        </motion.h2>
        <motion.p
          className="font-body text-[#9a9a8e] tracking-widest uppercase mt-6 text-center"
          style={{ fontSize: '3vw', letterSpacing: '0.18em' }}
          initial={{ opacity: 0, y: 14 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
        >
          Americans per year
        </motion.p>
      </motion.div>

      {/* Phase 2: the loss */}
      <motion.div
        className="absolute inset-0 flex items-center px-[10vw]"
        animate={vis(2)}
      >
        <motion.h2
          className="font-display text-[#f5f5f0] uppercase leading-[0.9]"
          style={{ fontSize: '9vw' }}
          initial={{ opacity: 0, y: 28 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          die without<br />
          <span className="text-[#e8291e]">hospice care</span>
        </motion.h2>
      </motion.div>

      {/* Phase 3: the qualifier */}
      <motion.div
        className="absolute inset-0 flex items-center px-[10vw]"
        animate={vis(3)}
      >
        <motion.h2
          className="font-display text-[#9a9a8e] uppercase leading-[0.9]"
          style={{ fontSize: '7vw' }}
          initial={{ opacity: 0, y: 22 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          who would have<br />
          <span className="text-[#f5f5f0]">qualified for it.</span>
        </motion.h2>
      </motion.div>
    </motion.div>
  );
}
