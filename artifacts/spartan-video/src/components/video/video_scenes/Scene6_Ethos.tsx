import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const ethosBg = `${import.meta.env.BASE_URL}ethos-bg.mp4`;

export function Scene6_Ethos() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const staggerChars = (text: string, delayOffset: number) => {
    return text.split('').map((char, i) => (
      <span key={i} className="inline-block overflow-hidden relative">
        <motion.span
          className="inline-block"
          initial={{ y: '100%' }}
          animate={phase >= 1 ? { y: 0 } : { y: '100%' }}
          transition={{ type: 'spring', stiffness: 350, damping: 28, delay: delayOffset + i * 0.03 }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      </span>
    ));
  };

  return (
    <motion.div
      className="absolute inset-0 z-10"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <video
        src={ethosBg}
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        autoPlay
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-[#070707]/40 mix-blend-multiply pointer-events-none" />

      <div className="absolute inset-0 flex flex-col justify-center px-[8vw] z-10 leading-[0.85]">
        <h1 className="text-[10vw] font-display text-[#f5f5f0] uppercase tracking-tight">
          {staggerChars("You do not wing it", 0.1)}
        </h1>
        <h1 className="text-[10vw] font-display text-[#f5f5f0] uppercase tracking-tight">
          {staggerChars("when the", 0.7)}
        </h1>
        <h1 className="text-[10vw] font-display text-[#e8291e] uppercase tracking-tight">
          {staggerChars("stakes are this high.", 1.1)}
        </h1>
      </div>
    </motion.div>
  );
}
