import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const gapTexture = `${import.meta.env.BASE_URL}gap-texture.png`;

export function Scene3_Gap() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),  // first half of line
      setTimeout(() => setPhase(2), 900),  // "clinical." in red
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center bg-[#070707]"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Grain texture background */}
      <div
        className="absolute inset-0 opacity-50 mix-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url(${gapTexture})` }}
      />
      <div className="absolute inset-0 bg-[#0d0d0b]/60" />

      {/* Text: slow vertical push in */}
      <motion.div
        className="relative z-10 px-[10vw] w-full"
        initial={{ y: 16 }}
        animate={{ y: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        <p className="font-body text-[#9a9a8e] font-light tracking-wide leading-snug text-center" style={{ fontSize: '5.5vw' }}>
          <motion.span
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            The gap is not{' '}
          </motion.span>
          <motion.span
            className="font-normal"
            style={{ color: '#e8291e' }}
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            clinical.
          </motion.span>
        </p>
      </motion.div>
    </motion.div>
  );
}
