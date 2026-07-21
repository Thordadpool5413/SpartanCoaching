import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const spartanLogo  = `${import.meta.env.BASE_URL}spartan-logo.png`;
const spartanStamp = `${import.meta.env.BASE_URL}spartan-logo-stamp.png`;

export function Scene8_Close() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),   // logo settles in
      setTimeout(() => setPhase(2), 2000),  // red line clips
      setTimeout(() => setPhase(3), 3000),  // tagline + URL
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
      {/* Subtle background radial glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 50% 55%, rgba(90,0,0,0.10) 0%, transparent 60%)',
            'radial-gradient(ellipse at 50% 45%, rgba(60,0,0,0.07) 0%, transparent 55%)',
            'radial-gradient(ellipse at 50% 55%, rgba(90,0,0,0.10) 0%, transparent 60%)',
          ],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Faint stamp watermark */}
      <img
        src={spartanStamp}
        alt=""
        aria-hidden
        className="absolute object-contain pointer-events-none select-none opacity-[0.035]"
        style={{ width: '75vh', height: '75vh', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />

      {/* Primary logo */}
      <motion.img
        src={spartanLogo}
        alt="Spartan Coaching"
        className="relative z-10 object-contain"
        style={{ width: '32vw', height: 'auto' }}
        initial={{ opacity: 0, scale: 1.06 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
      />

      {/* Red accent line */}
      <motion.div
        className="relative z-10 bg-[#e8291e] h-[2px] mt-6 origin-left"
        style={{ width: '28vw' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Tagline + URL */}
      <motion.div
        className="relative z-10 flex flex-col items-center mt-5 gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <p
          className="font-body text-[#f5f5f0] tracking-[0.2em] uppercase text-center"
          style={{ fontSize: '1.6vw' }}
        >
          Hospice Growth Coaching
        </p>
        <p
          className="font-body text-[#9a9a8e] tracking-[0.2em] uppercase text-center"
          style={{ fontSize: '1.2vw' }}
        >
          spartancoaching.com
        </p>
      </motion.div>
    </motion.div>
  );
}
