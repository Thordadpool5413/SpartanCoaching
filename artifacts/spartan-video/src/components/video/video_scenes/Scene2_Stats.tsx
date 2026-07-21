import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

// Scene 2 — The Cause
// "Not a clinical failure." → "A sales failure." → "Conversations that never happened. Referrals never made."
export function Scene2_Stats() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),   // "Not a clinical failure."
      setTimeout(() => setPhase(2), 2800),  // "A sales failure." (replaces)
      setTimeout(() => setPhase(3), 5200),  // supporting detail
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 overflow-hidden bg-[#070707]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 55% 50%, rgba(232,41,30,0.05) 0%, transparent 65%)' }}
      />

      {/* Phase 1 — "Not a clinical failure." */}
      <motion.div
        className="absolute inset-0 flex items-center px-[8vw]"
        animate={{ opacity: phase === 1 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="overflow-hidden">
          <motion.h2
            className="font-display uppercase text-[#9a9a8e] leading-none"
            style={{ fontSize: 'clamp(36px, 8vw, 120px)' }}
            initial={{ y: '110%' }}
            animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            Not a clinical failure.
          </motion.h2>
        </div>
      </motion.div>

      {/* Phase 2 — "A sales failure." */}
      <motion.div
        className="absolute inset-0 flex flex-col items-start justify-center px-[8vw]"
        animate={{ opacity: phase >= 2 && phase < 3 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.p
          className="font-body text-[#9a9a8e] uppercase mb-4"
          style={{ fontSize: 'clamp(13px, 2.2vw, 32px)', letterSpacing: '0.18em' }}
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          The real problem
        </motion.p>
        <div className="overflow-hidden">
          <motion.h2
            className="font-display uppercase leading-none"
            style={{ fontSize: 'clamp(48px, 11vw, 170px)', color: '#e8291e' }}
            initial={{ y: '110%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '110%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            A sales failure.
          </motion.h2>
        </div>
      </motion.div>

      {/* Phase 3 — supporting detail */}
      <motion.div
        className="absolute inset-0 flex flex-col justify-center px-[8vw]"
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {[
          'Conversations that never happened.',
          'Referrals that were never made.',
          'Eligibility that was missed.',
        ].map((line, i) => (
          <motion.p
            key={i}
            className="font-body text-[#c8c8bc] leading-relaxed"
            style={{ fontSize: 'clamp(18px, 3.5vw, 54px)' }}
            initial={{ opacity: 0, x: -16 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
            transition={{ duration: 0.7, delay: i * 0.22, ease: EASE }}
          >
            {line}
          </motion.p>
        ))}
      </motion.div>
    </motion.div>
  );
}
