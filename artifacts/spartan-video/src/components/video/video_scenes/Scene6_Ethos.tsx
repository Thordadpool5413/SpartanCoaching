import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

// Scene 6 — The Stakes (8s) — emotional payoff, slow fades (no spring)
// "When a rep closes that gap — / a patient stops managing their own pain. / A family stops being alone."
export function Scene6_Ethos() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // label
      setTimeout(() => setPhase(2), 1400),  // line 1
      setTimeout(() => setPhase(3), 3400),  // line 2
      setTimeout(() => setPhase(4), 5600),  // line 3 (red)
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
      {/* Warm red glow — pulses slowly */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 40% 55%, rgba(232,41,30,0.07) 0%, transparent 60%)',
            'radial-gradient(ellipse at 40% 55%, rgba(232,41,30,0.13) 0%, transparent 60%)',
            'radial-gradient(ellipse at 40% 55%, rgba(232,41,30,0.07) 0%, transparent 60%)',
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* "What actually changes." — small label */}
      <motion.p
        className="font-body text-[#9a9a8e] uppercase mb-10"
        style={{ fontSize: 'clamp(12px, 2vw, 28px)', letterSpacing: '0.22em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.4 }}
      >
        What actually changes.
      </motion.p>

      {/* Line 1 — setup, gray, slow fade */}
      <motion.p
        className="font-display uppercase text-[#6a6a60] leading-tight mb-3"
        style={{ fontSize: 'clamp(22px, 4.5vw, 68px)' }}
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2.0, ease: 'easeOut' }}
      >
        When a rep closes that gap —
      </motion.p>

      {/* Line 2 — patient, white, slower */}
      <motion.p
        className="font-display uppercase text-[#f5f5f0] leading-tight mb-3"
        style={{ fontSize: 'clamp(22px, 4.5vw, 68px)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
      >
        a patient stops managing their own pain.
      </motion.p>

      {/* Line 3 — family, red, slowest */}
      <motion.p
        className="font-display uppercase leading-tight"
        style={{ fontSize: 'clamp(22px, 4.5vw, 68px)', color: '#e8291e' }}
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 2.6, ease: 'easeOut' }}
      >
        A family stops being alone.
      </motion.p>
    </motion.div>
  );
}
