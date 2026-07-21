import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const spartanLogo     = `${import.meta.env.BASE_URL}spartan-logo.png`;
const spartanStamp    = `${import.meta.env.BASE_URL}spartan-logo-stamp.png`;

export function Scene8_Close() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 2800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#070707] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background layer: slow animated dark gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 50% 60%, rgba(100,0,0,0.12) 0%, transparent 60%)',
            'radial-gradient(ellipse at 50% 40%, rgba(80,0,0,0.08) 0%, transparent 55%)',
            'radial-gradient(ellipse at 50% 60%, rgba(100,0,0,0.12) 0%, transparent 60%)',
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Faint stamp watermark behind everything */}
      <img
        src={spartanStamp}
        alt=""
        className="absolute object-contain pointer-events-none select-none"
        style={{
          width: '80vh',
          height: '80vh',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.04,
        }}
      />

      {/* Hero: full logo image (spartan-logo.png) */}
      <motion.img
        src={spartanLogo}
        alt="Spartan Coaching"
        className="relative z-10 object-contain"
        style={{ width: '28vw', height: 'auto', marginBottom: '2.5vw' }}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      />

      {/* Red accent line clips in */}
      <motion.div
        className="relative z-10 bg-[#e8291e] h-[2px] origin-left"
        style={{ width: '24vw' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* URL */}
      <motion.p
        className="relative z-10 font-body text-[#9a9a8e] tracking-[0.25em] uppercase mt-[1.5vw]"
        style={{ fontSize: '1.4vw' }}
        initial={{ opacity: 0, y: 8 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        spartancoaching.com
      </motion.p>
    </motion.div>
  );
}
