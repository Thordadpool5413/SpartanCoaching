import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

// Scene 7 — The Ethos Line (manifesto pull quote)
// "You do not wing it / when the stakes / are this high." — slow, weighted, cinematic
export function Scene7_Pillars() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // line 1
      setTimeout(() => setPhase(2), 2000),  // line 2
      setTimeout(() => setPhase(3), 3400),  // line 3 (red)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] flex flex-col items-center justify-center px-[8vw] text-center"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* Persistent red glow behind text */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 50% 50%, rgba(232,41,30,0.08) 0%, transparent 55%)',
            'radial-gradient(ellipse at 50% 50%, rgba(232,41,30,0.14) 0%, transparent 55%)',
            'radial-gradient(ellipse at 50% 50%, rgba(232,41,30,0.08) 0%, transparent 55%)',
          ],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* "You do not wing it" */}
      <div className="overflow-hidden mb-2">
        <motion.h1
          className="font-display uppercase text-[#f5f5f0] leading-none"
          style={{ fontSize: 'clamp(40px, 9vw, 136px)' }}
          initial={{ y: '110%' }}
          animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 180, damping: 28 }}
        >
          You do not wing it
        </motion.h1>
      </div>

      {/* "when the stakes" */}
      <div className="overflow-hidden mb-2">
        <motion.h1
          className="font-display uppercase text-[#c8c8bc] leading-none"
          style={{ fontSize: 'clamp(40px, 9vw, 136px)' }}
          initial={{ y: '110%' }}
          animate={phase >= 2 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 180, damping: 28 }}
        >
          when the stakes
        </motion.h1>
      </div>

      {/* "are this high." — red */}
      <div className="overflow-hidden">
        <motion.h1
          className="font-display uppercase leading-none"
          style={{ fontSize: 'clamp(40px, 9vw, 136px)', color: '#e8291e' }}
          initial={{ y: '110%' }}
          animate={phase >= 3 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 180, damping: 28 }}
        >
          are this high.
        </motion.h1>
      </div>

      {/* Spartan Coaching attribution */}
      <motion.p
        className="font-body text-[#9a9a8e] uppercase mt-10"
        style={{ fontSize: 'clamp(11px, 1.8vw, 26px)', letterSpacing: '0.3em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.4, delay: 0.4 }}
      >
        — Spartan Coaching
      </motion.p>
    </motion.div>
  );
}
