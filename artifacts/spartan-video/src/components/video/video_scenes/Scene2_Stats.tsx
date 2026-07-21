import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const statsBg = `${import.meta.env.BASE_URL}stats-bg.mp4`;
const EASE = [0.16, 1, 0.3, 1] as const;

export function Scene2_Stats() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 3200),
      setTimeout(() => setPhase(3), 6200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const vis = (n: number) => ({ opacity: phase === n ? 1 : 0, transition: { duration: 0.35 } });

  return (
    <motion.div
      className="absolute inset-0 z-10 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <video src={statsBg} className="absolute inset-0 w-full h-full object-cover opacity-20" autoPlay muted playsInline loop />
      <div className="absolute inset-0 bg-[#070707]/70" />

      {/* Phase 1 — number */}
      <motion.div className="absolute inset-0 flex flex-col items-center justify-center" animate={vis(1)}>
        <motion.h2
          className="font-display text-[#f5f5f0] leading-none text-center"
          style={{ fontSize: 'clamp(80px, 20vw, 300px)' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          500,000
        </motion.h2>
        <motion.p
          className="font-body text-[#9a9a8e] uppercase text-center mt-5"
          style={{ fontSize: 'clamp(14px, 2.6vw, 38px)', letterSpacing: '0.14em' }}
          initial={{ opacity: 0, y: 14 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
        >
          Americans per year
        </motion.p>
      </motion.div>

      {/* Phase 2 — die without */}
      <motion.div className="absolute inset-0 flex items-center px-[7vw]" animate={vis(2)}>
        <motion.h2
          className="font-display text-[#f5f5f0] uppercase leading-[0.9]"
          style={{ fontSize: 'clamp(52px, 11vw, 165px)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          die without<br />
          <span style={{ color: '#e8291e' }}>hospice care</span>
        </motion.h2>
      </motion.div>

      {/* Phase 3 — qualifier */}
      <motion.div className="absolute inset-0 flex items-center px-[7vw]" animate={vis(3)}>
        <motion.h2
          className="font-display uppercase leading-[0.9]"
          style={{ fontSize: 'clamp(40px, 8.5vw, 130px)', color: '#9a9a8e' }}
          initial={{ opacity: 0, y: 24 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          who would have<br />
          <span style={{ color: '#f5f5f0' }}>qualified for it.</span>
        </motion.h2>
      </motion.div>
    </motion.div>
  );
}
