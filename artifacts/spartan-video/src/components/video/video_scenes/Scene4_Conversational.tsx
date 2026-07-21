import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const gapTexture = `${import.meta.env.BASE_URL}gap-texture.png`;

export function Scene4_Conversational() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 2000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col justify-center pl-[10vw] pr-[10vw] bg-[#070707]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="absolute inset-0 opacity-12 mix-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url(${gapTexture})` }}
      />

      {/* White flash on entry */}
      <motion.div
        className="absolute inset-0 bg-white z-50 pointer-events-none"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />

      <motion.p
        className="font-body text-[#9a9a8e] tracking-widest uppercase relative z-10 mb-8"
        style={{ fontSize: '2.8vw', letterSpacing: '0.18em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
      >
        Referrals are won or lost in conversation.
      </motion.p>

      <div className="overflow-hidden relative z-10">
        <motion.h2
          className="font-display text-[#f5f5f0] leading-none uppercase"
          style={{ fontSize: '12vw' }}
          initial={{ y: '100%' }}
          animate={phase >= 2 ? { y: 0 } : { y: '100%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        >
          Conversation<span className="text-[#e8291e]">.</span>
        </motion.h2>
      </div>
    </motion.div>
  );
}
