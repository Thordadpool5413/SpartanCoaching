import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;
const spartanLogo = `${import.meta.env.BASE_URL}spartan-logo.png`;

// Scene 8 — Close
// Logo on cream background, tagline, "Book a Strategy Call" CTA → /contact
export function Scene8_Close() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),     // logo (immediate)
      setTimeout(() => setPhase(2), 1600),  // red line
      setTimeout(() => setPhase(3), 2600),  // tagline
      setTimeout(() => setPhase(4), 3800),  // CTA button
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#f0ebe0' }}
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* Soft edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(0,0,0,0.16) 100%)' }}
      />

      {/* Logo */}
      <motion.img
        src={spartanLogo}
        alt="Spartan Coaching"
        className="relative z-10 object-contain"
        style={{ width: 'min(58vw, 460px)', height: 'auto' }}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Red accent line */}
      <motion.div
        className="relative z-10 bg-[#e8291e] origin-left mt-6"
        style={{ width: 'min(58vw, 460px)', height: '4px' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.85, ease: EASE }}
      />

      {/* Tagline */}
      <motion.p
        className="relative z-10 font-body uppercase text-center mt-5"
        style={{
          fontSize: 'clamp(12px, 2.2vw, 32px)',
          letterSpacing: '0.14em',
          color: '#3a2e20',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.9 }}
      >
        Hospice Growth Coaching · spartancoaching.com
      </motion.p>

      {/* CTA button — "Book a Strategy Call" → /contact */}
      <motion.a
        href="/contact"
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 mt-6 font-body uppercase text-center cursor-pointer"
        style={{
          fontSize: 'clamp(12px, 2vw, 28px)',
          letterSpacing: '0.12em',
          backgroundColor: '#e8291e',
          color: '#ffffff',
          padding: 'clamp(10px, 1.3vw, 18px) clamp(20px, 2.8vw, 40px)',
          display: 'inline-block',
          textDecoration: 'none',
        }}
        initial={{ opacity: 0, y: 14 }}
        animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 0.9 }}
        whileHover={{ backgroundColor: '#c0201a', scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Book a Strategy Call →
      </motion.a>
    </motion.div>
  );
}
