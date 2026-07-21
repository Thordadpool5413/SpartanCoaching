import { motion } from 'framer-motion';
import { useScenePhases } from '@/lib/video';

const EASE = [0.16, 1, 0.3, 1] as const;

const SCHEDULE = [
  [400,  1],  // first two lines
  [1400, 2],  // second line
  [3000, 3],  // red separator
  [4200, 4],  // "They qualified."
] as const;

// Scene 1 — The Reality
// "Every year, hundreds of thousands of Americans die without hospice care. They qualified."
export function Scene1_ColdOpen() {
  const phase = useScenePhases(SCHEDULE);

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707] overflow-hidden flex flex-col justify-center px-[8vw]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 40% 50%, rgba(232,41,30,0.06) 0%, transparent 65%)' }}
      />

      {/* "Every year, hundreds of thousands" */}
      <div className="overflow-hidden mb-2">
        <motion.p
          className="font-body text-[#9a9a8e] leading-snug"
          style={{ fontSize: 'clamp(18px, 3.5vw, 52px)' }}
          initial={{ y: '110%' }}
          animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        >
          Every year, hundreds of thousands of Americans
        </motion.p>
      </div>

      {/* "die without hospice care." */}
      <div className="overflow-hidden mb-8">
        <motion.p
          className="font-body text-[#c8c8bc] leading-snug"
          style={{ fontSize: 'clamp(18px, 3.5vw, 52px)' }}
          initial={{ y: '110%' }}
          animate={phase >= 2 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        >
          die without hospice care.
        </motion.p>
      </div>

      {/* Red separator */}
      <motion.div
        className="bg-[#e8291e] origin-left mb-8"
        style={{ height: '3px', width: '100%' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
      />

      {/* "They qualified." */}
      <div className="overflow-hidden">
        <motion.h1
          className="font-display uppercase leading-none"
          style={{ fontSize: 'clamp(52px, 12vw, 190px)', color: '#e8291e' }}
          initial={{ y: '110%' }}
          animate={phase >= 4 ? { y: 0 } : { y: '110%' }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        >
          They qualified.
        </motion.h1>
      </div>
    </motion.div>
  );
}
