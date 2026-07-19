import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const spartanStamp = `${import.meta.env.BASE_URL}spartan-logo-stamp.png`;

const SPARK_COUNT = 12;

function Sparks({ active }: { active: boolean }) {
  return (
    <>
      {Array.from({ length: SPARK_COUNT }).map((_, i) => {
        const angle = (i / SPARK_COUNT) * 360;
        const rad = (angle * Math.PI) / 180;
        const dist = 28 + Math.random() * 12;
        const tx = Math.cos(rad) * dist;
        const ty = Math.sin(rad) * dist;
        const size = 4 + Math.floor(Math.random() * 8);

        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#e8291e] pointer-events-none"
            style={{
              width: size,
              height: size,
              top: '50%',
              left: '50%',
              marginTop: -size / 2,
              marginLeft: -size / 2,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
            animate={
              active
                ? { x: `${tx}vh`, y: `${ty}vh`, opacity: [0, 1, 0], scale: [1, 1.5, 0] }
                : { opacity: 0 }
            }
            transition={{ duration: 0.65 + Math.random() * 0.3, ease: 'easeOut', delay: Math.random() * 0.1 }}
          />
        );
      })}
    </>
  );
}

export function Scene4_CrestHero() {
  const [phase, setPhase] = useState(0);
  const [sparksKey, setSparksKey] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => { setPhase(1); setSparksKey(k => k + 1); }, 300),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 5500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20 bg-black/50"
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ opacity: 1, clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Crest glow — bigger, harder */}
        <motion.div
          className="absolute w-[55vh] h-[55vh] rounded-full bg-[#e8291e] blur-[80px]"
          initial={{ opacity: 0, scale: 0 }}
          animate={phase >= 1 ? { opacity: 0.55, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        {/* Secondary outer glow ring */}
        <motion.div
          className="absolute w-[80vh] h-[80vh] rounded-full bg-[#e8291e] blur-[120px]"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 0.18 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}
        />

        {/* Sparks on crest land */}
        <div key={sparksKey} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Sparks active={phase >= 1} />
        </div>

        {/* The Crest — hard spring impact */}
        <motion.img
          src={spartanStamp}
          alt="Spartan Crest"
          className="w-[58vh] h-[58vh] object-contain relative z-10"
          initial={{ scale: 0.3, opacity: 0, rotateX: 60 }}
          animate={
            phase >= 1
              ? { scale: 1, opacity: 1, rotateX: 0 }
              : { scale: 0.3, opacity: 0, rotateX: 60 }
          }
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          style={{ transformPerspective: 1200 }}
        />

        {/* Drifting bg text — ultra-faint texture only */}
        <motion.h1
          className="absolute text-[18vw] font-display font-black text-white/[0.035] uppercase whitespace-nowrap pointer-events-none"
          initial={{ x: '25%' }}
          animate={{ x: '-25%' }}
          transition={{ duration: 6, ease: 'linear' }}
        >
          SPARTAN COACHING
        </motion.h1>

        {/* Bold Statement + underline */}
        <motion.div
          className="absolute bottom-12 flex flex-col items-center px-8"
          initial={{ opacity: 0, y: 40 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        >
          <h2 className="text-[4vw] font-display uppercase tracking-widest text-[#e8291e] font-black">
            DOMINATE YOUR MARKET
          </h2>
          <motion.div
            className="h-[3px] bg-[#e8291e] w-full origin-left mt-2"
            initial={{ scaleX: 0 }}
            animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
