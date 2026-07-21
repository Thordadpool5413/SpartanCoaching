import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

// Scene 5 — The Three Pillars (with real meaning)
// DISCIPLINE / EMPATHY / STRATEGY, each with a concrete sentence from the website
export function Scene5_Fragments() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),   // DISCIPLINE
      setTimeout(() => setPhase(2), 3000),  // EMPATHY
      setTimeout(() => setPhase(3), 5800),  // STRATEGY
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const pillars = [
    {
      name: 'Discipline',
      body: "The system that holds on Tuesday when caring isn't enough.",
      phase: 1,
    },
    {
      name: 'Empathy',
      body: "The skill that hears what\u2019s underneath \u201Cnot yet.\u201D",
      phase: 2,
    },
    {
      name: 'Strategy',
      body: 'Knowing which five accounts in your territory actually refer.',
      phase: 3,
    },
  ];

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(232,41,30,0.07) 0%, transparent 60%)' }}
      />

      {/* One pillar visible at a time */}
      {pillars.map((pillar, i) => (
        <motion.div
          key={pillar.name}
          className="absolute inset-0 flex flex-col justify-center px-[8vw]"
          animate={{ opacity: phase === pillar.phase ? 1 : 0 }}
          transition={{ duration: 0.45 }}
        >
          {/* Pillar label */}
          <motion.p
            className="font-body text-[#9a9a8e] uppercase mb-4"
            style={{ fontSize: 'clamp(13px, 2.2vw, 32px)', letterSpacing: '0.22em' }}
            initial={{ opacity: 0 }}
            animate={phase >= pillar.phase ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {`0${i + 1} · The ${pillar.name} Pillar`}
          </motion.p>

          {/* Pillar name — large display */}
          <div className="overflow-hidden mb-6">
            <motion.h2
              className="font-display uppercase leading-none text-[#f5f5f0]"
              style={{ fontSize: 'clamp(56px, 13vw, 200px)' }}
              initial={{ y: '110%' }}
              animate={phase >= pillar.phase ? { y: 0 } : { y: '110%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            >
              {pillar.name}
              <span style={{ color: '#e8291e' }}>.</span>
            </motion.h2>
          </div>

          {/* Red line */}
          <motion.div
            className="bg-[#e8291e] origin-left mb-6"
            style={{ height: '3px', width: '50%' }}
            initial={{ scaleX: 0 }}
            animate={phase >= pillar.phase ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          />

          {/* Body sentence */}
          <motion.p
            className="font-body text-[#c8c8bc] leading-snug"
            style={{ fontSize: 'clamp(18px, 3.5vw, 52px)', maxWidth: '80%' }}
            initial={{ opacity: 0, y: 12 }}
            animate={phase >= pillar.phase ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
          >
            {pillar.body}
          </motion.p>
        </motion.div>
      ))}
    </motion.div>
  );
}
