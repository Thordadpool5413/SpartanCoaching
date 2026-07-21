import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

// Scene 6 — The Stakes (emotional payoff)
// "When a rep closes that gap — / a patient stops managing their own pain. / A family stops being alone."
export function Scene6_Ethos() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),   // "When a rep closes that gap —"
      setTimeout(() => setPhase(2), 2800),  // "a patient stops managing their own pain."
      setTimeout(() => setPhase(3), 5200),  // "A family stops being alone."
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const lines: [string, string][] = [
    ['When a rep closes that gap \u2014', '#9a9a8e'],
    ['a patient stops managing their own pain.', '#f5f5f0'],
    ['A family stops being alone.', '#e8291e'],
  ];

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] flex flex-col justify-center px-[8vw]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* Warm glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 40% 55%, rgba(232,41,30,0.08) 0%, transparent 60%)' }}
      />

      {/* Label */}
      <motion.p
        className="font-body text-[#9a9a8e] uppercase mb-10"
        style={{ fontSize: 'clamp(13px, 2.2vw, 32px)', letterSpacing: '0.22em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.0 }}
      >
        What actually changes.
      </motion.p>

      <div className="flex flex-col gap-[2.5vh]">
        {lines.map(([text, color], i) => (
          <div key={i} className="overflow-hidden">
            <motion.p
              className="font-display uppercase leading-tight"
              style={{ fontSize: 'clamp(24px, 5vw, 76px)', color }}
              initial={{ y: '110%' }}
              animate={phase >= i + 1 ? { y: 0 } : { y: '110%' }}
              transition={{ type: 'spring', stiffness: 220, damping: 30, delay: i === 0 ? 0 : 0 }}
            >
              {text}
            </motion.p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
