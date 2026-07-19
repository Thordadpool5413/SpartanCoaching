import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const spartanStamp = `${import.meta.env.BASE_URL}spartan-logo-stamp.png`;

export function Scene4_CrestHero() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-20 bg-black/40"
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ opacity: 1, clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Crest glow */}
        <motion.div
          className="absolute w-[50vh] h-[50vh] rounded-full bg-[#e8291e] blur-[120px]"
          initial={{ opacity: 0, scale: 0 }}
          animate={phase >= 1 ? { opacity: 0.4, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        {/* The Crest */}
        <motion.img 
          src={spartanStamp}
          alt="Spartan Crest"
          className="w-[60vh] h-[60vh] object-contain relative z-10"
          initial={{ scale: 0.5, opacity: 0, rotateX: 45 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1, rotateX: 0 } : { scale: 0.5, opacity: 0, rotateX: 45 }}
          transition={{ duration: 2, type: "spring", stiffness: 100, damping: 20 }}
          style={{ transformPerspective: 1000 }}
        />

        {/* Subtle drifting text behind crest */}
        <motion.h1 
          className="absolute text-[18vw] font-display font-black text-white/5 uppercase whitespace-nowrap"
          initial={{ x: "20%" }}
          animate={{ x: "-20%" }}
          transition={{ duration: 10, ease: "linear" }}
        >
          SPARTAN COACHING
        </motion.h1>

        {/* Bold Statement */}
        <motion.div 
          className="absolute bottom-24 flex flex-col items-center"
          initial={{ opacity: 0, y: 50 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-[3vw] font-display uppercase tracking-widest text-[#e8291e] font-bold">
            DOMINATE YOUR MARKET
          </h2>
        </motion.div>
      </div>
    </motion.div>
  );
}
