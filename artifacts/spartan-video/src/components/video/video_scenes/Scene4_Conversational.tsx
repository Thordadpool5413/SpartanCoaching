import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

// Scene 4 — Spartan's Answer (6s)
// "Not a conference. / Not motivation." → animated red lines draw across each → they fade out
// → "A practical, repeatable system." slams in → "Built in the field. Built for hospice."
export function Scene4_Conversational() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 250),   // negatives appear
      setTimeout(() => setPhase(2), 1100),  // strikethrough lines draw
      setTimeout(() => setPhase(3), 2000),  // negatives fade out
      setTimeout(() => setPhase(4), 2400),  // positive answer slams in
      setTimeout(() => setPhase(5), 4000),  // subline fades in
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

      {/* ── Negatives block — appears then gets struck through then fades ── */}
      <motion.div
        className="mb-8"
        animate={{ opacity: phase >= 3 ? 0 : phase >= 1 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {(['Not a conference.', 'Not motivation.'] as const).map((line, i) => (
          <div key={line} className="relative inline-block mb-2 block">
            <p
              className="font-display uppercase text-[#9a9a8e] leading-tight"
              style={{ fontSize: 'clamp(28px, 5.5vw, 84px)' }}
            >
              {line}
            </p>
            {/* Animated red strikethrough line drawn with scaleX */}
            <motion.div
              className="absolute bg-[#e8291e] origin-left pointer-events-none"
              style={{
                top: '50%',
                left: 0,
                right: 0,
                height: '3px',
                transform: 'translateY(-50%)',
              }}
              initial={{ scaleX: 0 }}
              animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.38, delay: i * 0.18, ease: EASE }}
            />
          </div>
        ))}
      </motion.div>

      {/* ── Positive answer ── */}
      <div className="overflow-hidden mb-5">
        <motion.h2
          className="font-display uppercase text-[#f5f5f0] leading-none"
          style={{ fontSize: 'clamp(34px, 7vw, 108px)' }}
          initial={{ y: '110%' }}
          animate={phase >= 4 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        >
          A practical,{' '}
          <span style={{ color: '#e8291e' }}>repeatable</span> system.
        </motion.h2>
      </div>

      {/* ── Subline ── */}
      <motion.p
        className="font-body text-[#9a9a8e] uppercase"
        style={{ fontSize: 'clamp(13px, 2.2vw, 34px)', letterSpacing: '0.14em' }}
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 1.0 }}
      >
        Built in the field. Built for hospice.
      </motion.p>
    </motion.div>
  );
}
