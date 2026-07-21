import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Scene 7 — The Ethos Line (7s)
// "You do not wing it / when the stakes / are this high."
// Each line enters at a different speed — line 1 fast, line 2 slower, line 3 (red) slowest.
export function Scene7_Pillars() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),   // line 1
      setTimeout(() => setPhase(2), 1700),  // line 2
      setTimeout(() => setPhase(3), 3200),  // line 3 (red, slowest)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] flex flex-col items-center justify-center px-[8vw] text-center"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Pulsing red glow behind the text */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 50% 50%, rgba(232,41,30,0.08) 0%, transparent 55%)',
            'radial-gradient(ellipse at 50% 50%, rgba(232,41,30,0.16) 0%, transparent 55%)',
            'radial-gradient(ellipse at 50% 50%, rgba(232,41,30,0.08) 0%, transparent 55%)',
          ],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Line 1 — fast spring */}
      <div className="overflow-hidden mb-1">
        <motion.h1
          className="font-display uppercase text-[#f5f5f0] leading-none"
          style={{ fontSize: 'clamp(38px, 8.5vw, 130px)' }}
          initial={{ y: '110%' }}
          animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        >
          You do not wing it
        </motion.h1>
      </div>

      {/* Line 2 — medium spring */}
      <div className="overflow-hidden mb-1">
        <motion.h1
          className="font-display uppercase text-[#9a9a8e] leading-none"
          style={{ fontSize: 'clamp(38px, 8.5vw, 130px)' }}
          initial={{ y: '110%' }}
          animate={phase >= 2 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        >
          when the stakes
        </motion.h1>
      </div>

      {/* Line 3 — slow spring + scale, red */}
      <div className="overflow-hidden">
        <motion.h1
          className="font-display uppercase leading-none"
          style={{ fontSize: 'clamp(38px, 8.5vw, 130px)', color: '#e8291e' }}
          initial={{ y: '110%', scale: 0.92 }}
          animate={phase >= 3 ? { y: 0, scale: 1 } : { y: '110%', scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 130, damping: 22 }}
        >
          are this high.
        </motion.h1>
      </div>

      {/* Attribution — fades in after line 3 settles */}
      <motion.p
        className="font-body text-[#9a9a8e] uppercase mt-8"
        style={{ fontSize: 'clamp(11px, 1.6vw, 24px)', letterSpacing: '0.3em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.6, delay: 0.6 }}
      >
        — Spartan Coaching
      </motion.p>
    </motion.div>
  );
}
