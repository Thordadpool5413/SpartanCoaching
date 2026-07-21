import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const spartanLogo = `${import.meta.env.BASE_URL}spartan-logo.png`;

export function Scene8_Close() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),    // logo visible immediately
      setTimeout(() => setPhase(2), 2400),
      setTimeout(() => setPhase(3), 3800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#f0ebe0' }}
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Soft vignette around edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.22) 100%)' }}
      />

      {/* Logo — large, immediate, on warm cream background */}
      <motion.img
        src={spartanLogo}
        alt="Spartan Coaching"
        className="relative z-10 object-contain"
        style={{ width: 'min(72vw, 600px)', height: 'auto' }}
        initial={{ opacity: 0, scale: 1.06 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />

      {/* Spartan red accent line */}
      <motion.div
        className="relative z-10 bg-[#e8291e] mt-8 origin-left"
        style={{ width: 'min(72vw, 600px)', height: '5px' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Tagline + URL */}
      <motion.div
        className="relative z-10 flex flex-col items-center mt-8 gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <p
          className="font-body uppercase text-center"
          style={{ fontSize: 'clamp(22px, 4vw, 60px)', letterSpacing: '0.14em', color: '#1a1a14' }}
        >
          Hospice Growth Coaching
        </p>
        <p
          className="font-body uppercase text-center"
          style={{ fontSize: 'clamp(18px, 3vw, 46px)', letterSpacing: '0.12em', color: '#6b6050' }}
        >
          spartancoaching.com
        </p>
      </motion.div>
    </motion.div>
  );
}
