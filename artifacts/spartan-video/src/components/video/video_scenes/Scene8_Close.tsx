import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const spartanLogo = `${import.meta.env.BASE_URL}spartan-logo.png`;

export function Scene8_Close() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 3400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#070707] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Subtle background radial glow — single layer, no stamp */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 50% 55%, rgba(90,0,0,0.12) 0%, transparent 60%)',
            'radial-gradient(ellipse at 50% 45%, rgba(60,0,0,0.08) 0%, transparent 55%)',
            'radial-gradient(ellipse at 50% 55%, rgba(90,0,0,0.12) 0%, transparent 60%)',
          ],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Single logo — large, clear, centered */}
      <motion.img
        src={spartanLogo}
        alt="Spartan Coaching"
        className="relative z-10 object-contain"
        style={{ width: '44vw', height: 'auto', maxWidth: '700px' }}
        initial={{ opacity: 0, scale: 1.04 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      />

      {/* Red accent line */}
      <motion.div
        className="relative z-10 bg-[#e8291e] mt-8 origin-left"
        style={{ width: '44vw', maxWidth: '700px', height: '3px' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Tagline + URL */}
      <motion.div
        className="relative z-10 flex flex-col items-center mt-6 gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <p className="font-body text-[#f5f5f0] tracking-[0.2em] uppercase text-center" style={{ fontSize: '2.4vw' }}>
          Hospice Growth Coaching
        </p>
        <p className="font-body text-[#9a9a8e] tracking-[0.18em] uppercase text-center" style={{ fontSize: '1.8vw' }}>
          spartancoaching.com
        </p>
      </motion.div>
    </motion.div>
  );
}
