import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const ethosBg = `${import.meta.env.BASE_URL}ethos-bg.mp4`;

export function Scene6_Ethos() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [setTimeout(() => setPhase(1), 600)];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const staggerChars = (text: string, delayOffset: number) =>
    text.split('').map((char, i) => (
      <span key={i} className="inline-block overflow-hidden relative">
        <motion.span
          className="inline-block"
          initial={{ y: '105%' }}
          animate={phase >= 1 ? { y: 0 } : { y: '105%' }}
          transition={{ type: 'spring', stiffness: 170, damping: 34, delay: delayOffset + i * 0.045 }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      </span>
    ));

  return (
    <motion.div
      className="absolute inset-0 z-10"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <video src={ethosBg} className="absolute inset-0 w-full h-full object-cover opacity-60" autoPlay muted playsInline loop />
      <div className="absolute inset-0 bg-[#070707]/55 mix-blend-multiply pointer-events-none" />

      <div className="absolute inset-0 flex flex-col justify-center px-[7vw] z-10" style={{ lineHeight: '0.9' }}>
        <div className="font-display text-[#f5f5f0] uppercase tracking-tight" style={{ fontSize: 'clamp(36px, 8vw, 120px)' }}>
          {staggerChars('You don\u2019t wing it', 0.1)}
        </div>
        <div className="font-display text-[#f5f5f0] uppercase tracking-tight" style={{ fontSize: 'clamp(36px, 8vw, 120px)' }}>
          {staggerChars('when the', 0.7)}
        </div>
        <div className="font-display uppercase tracking-tight" style={{ fontSize: 'clamp(36px, 8vw, 120px)', color: '#e8291e' }}>
          {staggerChars('stakes are this high.', 1.2)}
        </div>
      </div>
    </motion.div>
  );
}
