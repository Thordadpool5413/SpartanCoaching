import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2_Buildup() {
  const [phase, setPhase] = useState(0);
  const [shockKey, setShockKey] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 150),
      setTimeout(() => { setPhase(2); setShockKey(k => k + 1); }, 900),
      setTimeout(() => setPhase(3), 2800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'blur(15px)' }}
      transition={{ duration: 0.3 }}
    >
      {/* Shockwave rings on PROMISE impact */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={`shock-${shockKey}-${i}`}
          className="absolute rounded-full border-2 border-[#e8291e] pointer-events-none"
          initial={{ width: '5vw', height: '5vw', opacity: 0.9 }}
          animate={{ width: '90vw', height: '90vw', opacity: 0 }}
          transition={{ duration: 0.7 + i * 0.18, delay: i * 0.12, ease: 'easeOut' }}
        />
      ))}

      {/* "IT IS A" ghost — barely visible */}
      <motion.h1
        className="text-[16vw] font-display font-black uppercase leading-none absolute select-none"
        style={{ color: 'rgba(255,255,255,0.05)' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        IT IS A
      </motion.h1>

      {/* "PROMISE" — full-screen, blinding red impact */}
      <motion.h1
        className="text-[20vw] font-display font-black uppercase text-[#e8291e] leading-none absolute mix-blend-screen"
        initial={{ opacity: 0, scale: 2.2, filter: 'blur(40px)' }}
        animate={
          phase >= 2
            ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
            : { opacity: 0, scale: 2.2, filter: 'blur(40px)' }
        }
        transition={{ duration: 0.35, type: 'spring', stiffness: 500, damping: 28 }}
      >
        PROMISE
      </motion.h1>

      {/* Bottom red rule */}
      <motion.div
        className="absolute bottom-16 left-16 h-[3px] bg-[#e8291e] origin-left"
        style={{ width: '40vw' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
}
