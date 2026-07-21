import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const gapTexture = `${import.meta.env.BASE_URL}gap-texture.png`;

export function Scene3_Gap() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center bg-[#070707]"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url(${gapTexture})` }}
      />
      <div className="absolute inset-0 bg-[#0d0d0b]/65" />

      <motion.div
        className="relative z-10 px-[10vw] w-full"
        initial={{ y: 24 }}
        animate={{ y: 0 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <p className="font-display text-[#9a9a8e] uppercase leading-[1.0] text-center" style={{ fontSize: '7vw' }}>
          <motion.span
            className="block"
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            This gap isn't
          </motion.span>
          <motion.span
            className="block"
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
          >
            a clinical failure.
          </motion.span>
          <motion.span
            className="block mt-4"
            style={{ color: '#e8291e' }}
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          >
            It's a sales failure.
          </motion.span>
        </p>
      </motion.div>
    </motion.div>
  );
}
