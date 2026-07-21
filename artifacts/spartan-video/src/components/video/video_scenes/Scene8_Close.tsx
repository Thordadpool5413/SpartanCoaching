import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const spartanLogo = `${import.meta.env.BASE_URL}spartan-logo.png`;

export function Scene8_Close() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 4400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#f5f0e8' }}
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.25) 100%)' }}
      />

      {/* Logo — dark logo on light background, unmissably large */}
      <motion.img
        src={spartanLogo}
        alt="Spartan Coaching"
        className="relative z-10 object-contain"
        style={{ width: 'min(68vw, 520px)', height: 'auto' }}
        initial={{ opacity: 0, scale: 1.04 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
      />

      {/* Red accent line */}
      <motion.div
        className="relative z-10 bg-[#e8291e] mt-8 origin-left"
        style={{ width: 'min(68vw, 520px)', height: '4px' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Tagline + URL on the light background */}
      <motion.div
        className="relative z-10 flex flex-col items-center mt-7 gap-3"
        initial={{ opacity: 0, y: 14 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      >
        <p
          className="font-body uppercase tracking-widest text-center"
          style={{ fontSize: 'clamp(18px, 3vw, 46px)', letterSpacing: '0.18em', color: '#1a1a16' }}
        >
          Hospice Growth Coaching
        </p>
        <p
          className="font-body uppercase tracking-widest text-center"
          style={{ fontSize: 'clamp(14px, 2.2vw, 34px)', letterSpacing: '0.16em', color: '#6b6b5e' }}
        >
          spartancoaching.com
        </p>
      </motion.div>
    </motion.div>
  );
}
