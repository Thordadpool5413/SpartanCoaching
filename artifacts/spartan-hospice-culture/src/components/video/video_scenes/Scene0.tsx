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

      {/* Typography */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="overflow-hidden mb-[1.5vh]">
          <motion.h1
            className="font-sans font-medium text-[5.5vw] tracking-[0.2em] text-[var(--color-brand-warm)] text-shadow-subtle uppercase"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          >
            Hospice Sales
          </motion.h1>
        </div>
        
        <div className="overflow-hidden">
          <motion.h2
            className="font-display font-semibold italic text-[11.5vw] leading-none text-[var(--color-brand-white)] text-shadow-heavy"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
          >
            has to change.
          </motion.h2>
        </div>
      </div>
      
      {/* Subtle line accent */}
      <motion.div
        className="absolute bottom-[15vh] w-[2px] h-[12vh] bg-gradient-to-b from-white/60 to-transparent"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 1.5 }}
        style={{ originY: 0 }}
      />
    </motion.div>
  );
};

export default Scene0;
