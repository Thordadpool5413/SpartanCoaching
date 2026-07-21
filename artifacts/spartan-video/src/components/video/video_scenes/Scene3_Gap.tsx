import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

// Scene 3 — The Specific Gaps
// "Reps with good values and no system." / "Leaders reviewing numbers they can't change." / "Teams with no shared playbook."
export function Scene3_Gap() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // header
      setTimeout(() => setPhase(2), 1800),  // line 1
      setTimeout(() => setPhase(3), 3600),  // line 2
      setTimeout(() => setPhase(4), 5600),  // line 3
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const gaps = [
    'Reps with good values — and no system.',
    "Leaders reviewing numbers they can't change.",
    'Teams with no shared playbook to run.',
  ];

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] flex flex-col justify-center px-[8vw]"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(232,41,30,0.07) 0%, transparent 60%)' }}
      />

      {/* "The gaps are specific." */}
      <motion.p
        className="font-body text-[#9a9a8e] uppercase mb-10"
        style={{ fontSize: 'clamp(13px, 2.2vw, 32px)', letterSpacing: '0.2em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.0 }}
      >
        The gaps are specific.
      </motion.p>

      {/* Three gap lines */}
      <div className="flex flex-col gap-[3.5vh]">
        {gaps.map((line, i) => (
          <div key={i} className="overflow-hidden">
            <motion.p
              className="font-display uppercase leading-tight"
              style={{
                fontSize: 'clamp(24px, 5vw, 76px)',
                color: phase >= i + 2 ? '#f5f5f0' : '#f5f5f0',
              }}
              initial={{ y: '110%' }}
              animate={phase >= i + 2 ? { y: 0 } : { y: '110%' }}
              transition={{ type: 'spring', stiffness: 240, damping: 30 }}
            >
              <span style={{ color: '#e8291e', marginRight: '0.3em' }}>—</span>
              {line}
            </motion.p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
