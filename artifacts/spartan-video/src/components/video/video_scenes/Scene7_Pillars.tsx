import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const pillarsTexture = `${import.meta.env.BASE_URL}pillars-texture.png`;

export function Scene7_Pillars() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-20 bg-[#070707]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
      transition={{ duration: 0.4 }}
    >
      <div 
        className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url(${pillarsTexture})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-[#070707] opacity-60" />

      <div className="absolute inset-0 flex flex-col justify-center items-center px-4 leading-[0.8] overflow-hidden">
        {/* DISCIPLINE */}
        <motion.h1 
          className="font-display text-[#f5f5f0] uppercase text-center w-full whitespace-nowrap overflow-hidden truncate"
          style={{ fontSize: phase >= 3 ? '15vw' : '22vw' }}
          initial={{ clipPath: 'inset(0 100% 0 0)', color: '#f5f5f0' }}
          animate={{ 
            clipPath: phase >= 1 ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
            color: phase >= 3 ? '#e8291e' : '#f5f5f0'
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          DISCIPLINE.
        </motion.h1>

        {/* EMPATHY */}
        {phase >= 2 && (
          <motion.h1 
            className="font-display uppercase text-center w-full whitespace-nowrap overflow-hidden truncate"
            style={{ fontSize: phase >= 3 ? '15vw' : '20vw' }}
            initial={{ opacity: 0, y: 40, color: '#f5f5f0' }}
            animate={{ 
              opacity: 1, 
              y: 0,
              color: phase >= 3 ? '#e8291e' : '#f5f5f0'
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            EMPATHY.
          </motion.h1>
        )}

        {/* STRATEGY */}
        {phase >= 3 && (
          <motion.h1 
            className="font-display text-[#e8291e] uppercase text-center w-full whitespace-nowrap text-[15vw] overflow-hidden truncate"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            STRATEGY.
          </motion.h1>
        )}
      </div>
    </motion.div>
  );
}
