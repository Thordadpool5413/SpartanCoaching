import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const spartanLogo = `${import.meta.env.BASE_URL}spartan-logo.png`;

export function Scene8_Close() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 4400),
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
      {/* Soft vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.18) 100%)' }}
      />

      {/* Logo */}
      <motion.img
        src={spartanLogo}
        alt="Spartan Coaching"
        className="relative z-10 object-contain"
        style={{ width: 'min(60vw, 480px)', height: 'auto' }}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />

      {/* Red accent line */}
      <motion.div
        className="relative z-10 bg-[#e8291e] mt-6 origin-left"
        style={{ width: 'min(60vw, 480px)', height: '4px' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Tagline */}
      <motion.p
        className="relative z-10 font-body uppercase text-center mt-5"
        style={{ fontSize: 'clamp(13px, 2.4vw, 36px)', letterSpacing: '0.14em', color: '#1a1a14' }}
        initial={{ opacity: 0, y: 12 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 1.0 }}
      >
        Hospice Growth Coaching · spartancoaching.com
      </motion.p>

      {/* CTA Button */}
      <motion.a
        href="/request-access"
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 mt-6 font-body uppercase tracking-widest text-center cursor-pointer"
        style={{
          fontSize: 'clamp(13px, 2.2vw, 32px)',
          letterSpacing: '0.12em',
          backgroundColor: '#e8291e',
          color: '#ffffff',
          padding: 'clamp(10px, 1.4vw, 20px) clamp(20px, 2.8vw, 42px)',
          display: 'inline-block',
          textDecoration: 'none',
        }}
        initial={{ opacity: 0, y: 14 }}
        animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 1.0 }}
        whileHover={{ backgroundColor: '#c0201a', scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        Request More Information →
      </motion.a>
    </motion.div>
  );
}
