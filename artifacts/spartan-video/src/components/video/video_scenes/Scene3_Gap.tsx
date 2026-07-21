import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const gapTexture = `${import.meta.env.BASE_URL}gap-texture.png`;

export function Scene3_Gap() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center bg-[#070707]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
      transition={{ duration: 0.4 }}
    >
      <div 
        className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url(${gapTexture})` }}
      />
      
      <motion.div 
        className="text-center w-full z-10"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        <h2 className="text-[5vw] font-body text-[#9a9a8e] font-light tracking-wide">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1 }}
          >
            The gap is not
          </motion.span>{' '}
          <motion.span
            className="text-[#e8291e] font-normal"
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            clinical.
          </motion.span>
        </h2>
      </motion.div>
    </motion.div>
  );
}
