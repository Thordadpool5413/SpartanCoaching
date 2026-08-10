import React from 'react';
import { motion } from 'framer-motion';

const Scene0: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;
  
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Cinematic Background Image */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1, filter: 'blur(10px)', opacity: 0 }}
        animate={{ scale: 1.03, filter: 'blur(0px)', opacity: 0.6 }}
        exit={{ scale: 1, filter: 'blur(15px)', opacity: 0 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <img 
          src={`${baseUrl}assets/hospice_professional.jpg`} 
          alt="Hospice Professional" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </motion.div>

      {/* Typography — fade in only, no slide-up, no overflow-hidden clipping */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full px-[5vw]">
        <motion.h1
          className="font-sans font-medium text-[3.6vw] tracking-[0.22em] text-[var(--color-brand-warm)] text-shadow-subtle uppercase mb-[1.8vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.5 }}
        >
          Hospice Sales
        </motion.h1>
        
        <motion.h2
          className="font-display font-semibold italic text-[8.8vw] leading-[1.15] text-[var(--color-brand-white)] text-shadow-heavy whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 1.0 }}
        >
          has to change.
        </motion.h2>
      </div>
      
      {/* Subtle line accent */}
      <motion.div
        className="absolute bottom-[15vh] w-[2px] h-[12vh] bg-gradient-to-b from-white/60 to-transparent"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 1.8 }}
        style={{ originY: 0 }}
      />
    </motion.div>
  );
};

export default Scene0;
