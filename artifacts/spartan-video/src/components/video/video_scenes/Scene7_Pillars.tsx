import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const pillarsTexture = `${import.meta.env.BASE_URL}pillars-texture.png`;

export function Scene7_Pillars() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 2400),
      setTimeout(() => setPhase(3), 4200),
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
        className="absolute top-[7vh] left-0 right-0 text-center font-body text-[#9a9a8e] tracking-widest uppercase z-10"
        style={{ fontSize: '2.5vw', letterSpacing: '0.25em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        The Spartan Method
      </motion.p>

      <div className="absolute inset-0 flex flex-col justify-center items-center px-4 leading-[0.85] overflow-hidden">
        {/* DISCIPLINE */}
        <motion.h1
          className="font-display uppercase text-center w-full whitespace-nowrap overflow-hidden"
          style={{ fontSize: phase >= 2 ? '16vw' : '22vw' }}
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{
            clipPath: phase >= 1 ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
            color: phase >= 3 ? '#e8291e' : '#f5f5f0',
            fontSize: phase >= 2 ? '16vw' : '22vw',
          }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          DISCIPLINE.
        </motion.h1>

        {/* EMPATHY */}
        <motion.h1
          className="font-display uppercase text-center w-full whitespace-nowrap overflow-hidden"
          initial={{ opacity: 0, y: 55, fontSize: '20vw', color: '#f5f5f0' }}
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            y: phase >= 2 ? 0 : 55,
            fontSize: phase >= 3 ? '16vw' : '20vw',
            color: phase >= 3 ? '#e8291e' : '#f5f5f0',
          }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          EMPATHY.
        </motion.h1>

        {/* STRATEGY */}
        <motion.h1
          className="font-display text-[#e8291e] uppercase text-center w-full whitespace-nowrap overflow-hidden"
          style={{ fontSize: '16vw' }}
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
