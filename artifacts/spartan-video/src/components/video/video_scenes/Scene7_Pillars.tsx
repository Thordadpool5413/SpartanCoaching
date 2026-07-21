import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const pillarsTexture = `${import.meta.env.BASE_URL}pillars-texture.png`;

export function Scene7_Pillars() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="absolute inset-0 opacity-35 mix-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url(${pillarsTexture})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-[#070707] opacity-55" />

      {/* Label */}
      <motion.p
        className="absolute top-[8vh] left-0 right-0 text-center font-body text-[#9a9a8e] tracking-widest uppercase z-10"
        style={{ fontSize: '1.5vw', letterSpacing: '0.3em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        The Spartan method
      </motion.p>

      <div className="absolute inset-0 flex flex-col justify-center items-center px-4 leading-[0.82] overflow-hidden">
        {/* DISCIPLINE */}
        <motion.h1
          className="font-display text-[#f5f5f0] uppercase text-center w-full whitespace-nowrap overflow-hidden"
          style={{ fontSize: phase >= 2 ? '14vw' : '20vw' }}
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{
            clipPath: phase >= 1 ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
            color: phase >= 3 ? '#e8291e' : '#f5f5f0',
            fontSize: phase >= 2 ? '14vw' : '20vw',
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          DISCIPLINE.
        </motion.h1>

        {/* EMPATHY */}
        <motion.h1
          className="font-display uppercase text-center w-full whitespace-nowrap overflow-hidden"
          initial={{ opacity: 0, y: 50, fontSize: '18vw', color: '#f5f5f0' }}
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            y: phase >= 2 ? 0 : 50,
            fontSize: phase >= 3 ? '14vw' : '18vw',
            color: phase >= 3 ? '#e8291e' : '#f5f5f0',
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          EMPATHY.
        </motion.h1>

        {/* STRATEGY */}
        <motion.h1
          className="font-display text-[#e8291e] uppercase text-center w-full whitespace-nowrap overflow-hidden"
          style={{ fontSize: '14vw' }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: phase >= 3 ? 1 : 0,
            scale: phase >= 3 ? 1 : 0.85,
          }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        >
          STRATEGY.
        </motion.h1>
      </div>
    </motion.div>
  );
}
