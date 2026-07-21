import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const gapTexture = `${import.meta.env.BASE_URL}gap-texture.png`;

export function Scene3_Gap() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center bg-[#070707]"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center" style={{ backgroundImage: `url(${gapTexture})` }} />
      <div className="absolute inset-0 bg-[#0d0d0b]/65" />

      <motion.div
        className="relative z-10 px-[7vw] w-full"
        initial={{ y: 32 }}
        animate={{ y: 0 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      >
        <div className="font-display uppercase text-center leading-[1.0]" style={{ fontSize: 'clamp(72px, 13vw, 210px)' }}>
          <motion.div
            className="block text-[#9a9a8e]"
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            This gap isn't
          </motion.div>
          <motion.div
            className="block text-[#9a9a8e]"
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
          >
            a clinical failure.
          </motion.div>
          <motion.div
            className="block mt-8"
            style={{ color: '#e8291e' }}
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
          >
            It's a sales failure.
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
