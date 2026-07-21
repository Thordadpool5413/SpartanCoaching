import { motion } from 'framer-motion';
import { useScenePhases } from '@/lib/video';

const EASE = [0.16, 1, 0.3, 1] as const;

const SCHEDULE = [
  [300, 1],   // "Not a clinical failure."
  [2800, 2],  // "A sales failure." replaces
  [5500, 3],  // supporting detail
] as const;

// Scene 2 — The Cause (9s)
// Phase 1: "Not a clinical failure." — hard cut, large, gray
// Phase 2: "A SALES FAILURE." slams in with scale — red, dominant
// Phase 3: Three supporting lines fade up below
export function Scene2_Stats() {
  const phase = useScenePhases(SCHEDULE);

  return (
    <motion.div
      className="absolute inset-0 z-10 overflow-hidden bg-[#070707]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 55% 50%, rgba(232,41,30,0.06) 0%, transparent 65%)' }}
      />

      {/* Phase 1 — "Not a clinical failure." (hard, gray, instant) */}
      <motion.div
        className="absolute inset-0 flex items-center px-[8vw]"
        animate={{ opacity: phase === 1 ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.h2
          className="font-display uppercase text-[#6a6a60] leading-none"
          style={{ fontSize: 'clamp(32px, 7vw, 110px)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          Not a clinical failure.
        </motion.h2>
      </motion.div>

      {/* Phase 2 — "A SALES FAILURE." slams in large with scale */}
      <motion.div
        className="absolute inset-0 flex flex-col items-start justify-center px-[8vw]"
        animate={{ opacity: phase >= 2 && phase < 3 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="overflow-hidden">
          <motion.h2
            className="font-display uppercase leading-none"
            style={{ fontSize: 'clamp(52px, 12vw, 190px)', color: '#e8291e' }}
            initial={{ y: '110%', scale: 0.88 }}
            animate={phase >= 2 ? { y: 0, scale: 1 } : { y: '110%', scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            A sales failure.
          </motion.h2>
        </div>
      </motion.div>

      {/* Phase 3 — supporting detail, three lines stagger */}
      <motion.div
        className="absolute inset-0 flex flex-col justify-center px-[8vw]"
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
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
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.8, delay: i * 0.25, ease: EASE }}
          >
            {line}
          </motion.p>
        ))}
      </motion.div>
    </motion.div>
  );
}
