import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

// Scene 4 — Spartan's Answer
// "Not a conference. Not motivation." (dim) → "A practical, repeatable system." → "Built in the field. Built for hospice."
export function Scene4_Conversational() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),   // "Not a conference. Not motivation."
      setTimeout(() => setPhase(2), 2500),  // "A practical, repeatable system."
      setTimeout(() => setPhase(3), 4400),  // "Built in the field. Built for hospice."
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] flex flex-col justify-center px-[8vw]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(232,41,30,0.06) 0%, transparent 65%)' }}
      />

      {/* "Not a conference. / Not motivation." — appears then fades when phase 2 hits */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: phase >= 2 ? 0.18 : 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        {['Not a conference.', 'Not motivation.'].map((line, i) => (
          <p
            key={i}
            className="font-display uppercase leading-snug relative"
            style={{
              fontSize: 'clamp(28px, 5.5vw, 84px)',
              color: '#9a9a8e',
              textDecoration: phase >= 2 ? 'line-through' : 'none',
            }}
          >
            {line}
          </p>
        ))}
      </motion.div>

      {/* Separator */}
      <motion.div
        className="bg-[#e8291e] origin-left mb-8"
        style={{ height: '3px' }}
        initial={{ scaleX: 0, width: '100%' }}
        animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      />

      {/* "A practical, repeatable system." */}
      <div className="overflow-hidden mb-4">
        <motion.h2
          className="font-display uppercase text-[#f5f5f0] leading-none"
          style={{ fontSize: 'clamp(36px, 7.5vw, 114px)' }}
          initial={{ y: '110%' }}
          animate={phase >= 2 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 240, damping: 28 }}
        >
          A practical,{' '}
          <span style={{ color: '#e8291e' }}>repeatable</span> system.
        </motion.h2>
      </div>

      {/* "Built in the field. Built for hospice." */}
      <motion.p
        className="font-body text-[#9a9a8e] uppercase"
        style={{ fontSize: 'clamp(13px, 2.2vw, 34px)', letterSpacing: '0.14em' }}
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 1.0 }}
      >
        Built in the field. Built for hospice.
      </motion.p>
    </motion.div>
  );
}
