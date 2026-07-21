import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const pillarsTexture = `${import.meta.env.BASE_URL}pillars-texture.png`;

export function Scene7_Pillars() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 3300),
      setTimeout(() => setPhase(3), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[#070707]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 opacity-35 mix-blend-overlay bg-cover bg-center" style={{ backgroundImage: `url(${pillarsTexture})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-[#070707] opacity-55" />

      <motion.p
        className="absolute top-[6vh] left-0 right-0 text-center font-body text-[#9a9a8e] uppercase tracking-widest z-10"
        style={{ fontSize: 'clamp(13px, 2.4vw, 36px)', letterSpacing: '0.24em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.3 }}
      >
        The Spartan Method
      </motion.p>

      <div className="absolute inset-0 flex flex-col justify-center items-center px-4 overflow-hidden" style={{ lineHeight: '0.86' }}>
        <motion.h1
          className="font-display uppercase text-center w-full whitespace-nowrap overflow-hidden"
          style={{ fontSize: phase >= 2 ? 'clamp(48px, 10vw, 150px)' : 'clamp(64px, 14vw, 210px)' }}
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{
            clipPath: phase >= 1 ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
            color: phase >= 3 ? '#e8291e' : '#f5f5f0',
          }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          DISCIPLINE.
        </motion.h1>

        <motion.h1
          className="font-display uppercase text-center w-full whitespace-nowrap overflow-hidden"
          style={{ fontSize: phase >= 3 ? 'clamp(48px, 10vw, 150px)' : 'clamp(56px, 12vw, 180px)' }}
          initial={{ opacity: 0, y: 50 }}
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            y: phase >= 2 ? 0 : 50,
            color: phase >= 3 ? '#e8291e' : '#f5f5f0',
          }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          EMPATHY.
        </motion.h1>

        <motion.h1
          className="font-display uppercase text-center w-full whitespace-nowrap overflow-hidden"
          style={{ fontSize: 'clamp(48px, 10vw, 150px)', color: '#e8291e' }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, scale: phase >= 3 ? 1 : 0.85 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        >
          STRATEGY.
        </motion.h1>
      </div>
    </motion.div>
  );
}
