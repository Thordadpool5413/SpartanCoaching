import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const gapTexture = `${import.meta.env.BASE_URL}gap-texture.png`;

export function Scene4_Conversational() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col justify-center pl-[7vw] pr-[7vw] bg-[#070707]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-cover bg-center" style={{ backgroundImage: `url(${gapTexture})` }} />
      <motion.div className="absolute inset-0 bg-white pointer-events-none" style={{ zIndex: 50 }}
        initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.22 }} />

      <motion.p
        className="font-body text-[#9a9a8e] uppercase relative z-10 mb-8"
        style={{ fontSize: 'clamp(13px, 2.4vw, 36px)', letterSpacing: '0.12em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.1 }}
      >
        Referrals are won or lost in conversation.
      </motion.p>

      <div className="overflow-hidden relative z-10">
        <motion.h2
          className="font-display text-[#f5f5f0] leading-none uppercase"
          style={{ fontSize: 'clamp(56px, 13vw, 195px)' }}
          initial={{ y: '105%' }}
          animate={phase >= 2 ? { y: 0 } : { y: '105%' }}
          transition={{ type: 'spring', stiffness: 170, damping: 32 }}
        >
          Conversation<span style={{ color: '#e8291e' }}>.</span>
        </motion.h2>
      </div>
    </motion.div>
  );
}
