import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import spartanLogo from "@assets/spartan-logo.png";

export function Scene5_Outro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-[#080808]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="relative flex flex-col items-center">
        {/* Full Wordmark Logo */}
        <motion.img 
          src={spartanLogo}
          alt="Spartan Coaching"
          className="h-[12vh] object-contain mb-12 relative z-10 filter drop-shadow-2xl"
          initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Tagline */}
        <motion.div 
          className="h-[1px] bg-[#e8291e] w-[20vw] mb-8"
          initial={{ scaleX: 0 }}
          animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        <motion.p 
          className="text-[1.5vw] font-body text-white/60 tracking-[0.2em] uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        >
          Hospice Sales Consulting
        </motion.p>
      </div>
    </motion.div>
  );
}
