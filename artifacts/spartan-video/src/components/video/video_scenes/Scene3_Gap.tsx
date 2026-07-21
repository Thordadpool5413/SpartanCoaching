import { motion } from 'framer-motion';
import { useScenePhases } from '@/lib/video';

const EASE = [0.16, 1, 0.3, 1] as const;

const SCHEDULE = [
  [300, 1],   // REPS
  [3500, 2],  // LEADERS
  [7000, 3],  // TEAMS
] as const;

// Scene 3 — The Specific Gaps (10s)
// Three sequential full-screen beats: key word LARGE, descriptor below.
// REPS → LEADERS → TEAMS — each gets its own moment before the next replaces it.
export function Scene3_Gap() {
  const phase = useScenePhases(SCHEDULE);

  const beats = [
    { key: 'REPS',    sub: 'with good values. And no system.',        phase: 1 },
    { key: 'LEADERS', sub: "reviewing numbers they can't change.",    phase: 2 },
    { key: 'TEAMS',   sub: 'with no shared playbook to run.',         phase: 3 },
  ];

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] overflow-hidden"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 35% 55%, rgba(232,41,30,0.07) 0%, transparent 65%)' }}
      />

      {beats.map((beat) => (
        <motion.div
          key={beat.key}
          className="absolute inset-0 flex flex-col justify-center px-[8vw]"
          animate={{ opacity: phase === beat.phase ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Key word — large display, slams in */}
          <div className="overflow-hidden mb-4">
            <motion.h1
              className="font-display text-[#f5f5f0] uppercase leading-none"
              style={{ fontSize: 'clamp(72px, 18vw, 280px)' }}
              initial={{ y: '105%' }}
              animate={phase >= beat.phase ? { y: 0 } : { y: '105%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              {beat.key}
              <span style={{ color: '#e8291e' }}>.</span>
            </motion.h1>
          </div>

          {/* Red underline */}
          <motion.div
            className="bg-[#e8291e] origin-left mb-6"
            style={{ height: '3px', width: '45%' }}
            initial={{ scaleX: 0 }}
            animate={phase >= beat.phase ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
          />

          {/* Descriptor — body font, fades up */}
          <motion.p
            className="font-body text-[#9a9a8e]"
            style={{ fontSize: 'clamp(18px, 3.8vw, 58px)' }}
            initial={{ opacity: 0, y: 14 }}
            animate={phase >= beat.phase ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
          >
            {beat.sub}
          </motion.p>
        </motion.div>
      ))}
    </motion.div>
  );
}
