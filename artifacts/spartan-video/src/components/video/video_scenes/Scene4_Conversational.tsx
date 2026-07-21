import { motion } from 'framer-motion';
import { useScenePhases } from '@/lib/video';

const EASE = [0.16, 1, 0.3, 1] as const;

const SCHEDULE = [
  [200,  1],  // "HOSPICE SALES"
  [900,  2],  // "IS NOT A MYSTERY."
  [3000, 3],  // "IT IS A PROMISE." (red, slams in)
] as const;

// Scene 4 — The Reframe (6s)
// Pivot from "the gap exists" → "it is fixable"
// "HOSPICE SALES / IS NOT A MYSTERY." → "IT IS A PROMISE."
// Directly from the Spartan Coaching brand voice / website hero.
export function Scene4_Conversational() {
  const phase = useScenePhases(SCHEDULE);

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] flex flex-col justify-center px-[8vw]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* Subtle red glow that intensifies when the promise lands */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: phase >= 3
            ? 'radial-gradient(ellipse at 50% 55%, rgba(232,41,30,0.18) 0%, transparent 65%)'
            : 'radial-gradient(ellipse at 50% 55%, rgba(232,41,30,0.04) 0%, transparent 65%)',
        }}
        transition={{ duration: 0.9 }}
      />

      {/* "HOSPICE SALES" */}
      <div className="overflow-hidden">
        <motion.h1
          className="font-display uppercase text-[#f5f5f0] leading-none"
          style={{ fontSize: 'clamp(48px, 11vw, 168px)' }}
          initial={{ y: '110%' }}
          animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        >
          Hospice sales
        </motion.h1>
      </div>

      {/* "IS NOT A MYSTERY." */}
      <div className="overflow-hidden mb-6">
        <motion.h1
          className="font-display uppercase text-[#9a9a8e] leading-none"
          style={{ fontSize: 'clamp(48px, 11vw, 168px)' }}
          initial={{ y: '110%' }}
          animate={phase >= 2 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          is not a mystery.
        </motion.h1>
      </div>

      {/* "IT IS A PROMISE." — red, slams in with scale punch */}
      <div className="overflow-hidden">
        <motion.h1
          className="font-display uppercase leading-none"
          style={{ fontSize: 'clamp(52px, 12vw, 188px)', color: '#e8291e' }}
          initial={{ y: '110%', scale: 0.88 }}
          animate={phase >= 3 ? { y: 0, scale: 1 } : { y: '110%', scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        >
          It is a promise.
        </motion.h1>
      </div>
    </motion.div>
  );
}
