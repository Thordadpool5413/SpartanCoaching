import React from 'react';
import { motion } from 'framer-motion';

const Scene6: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* End card dark overlay to make it completely focus on the logo */}
      <motion.div 
        className="absolute inset-0 bg-[var(--color-brand-slateDark)]/80 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      
      <div className="flex flex-col items-center justify-center w-full z-10">
        
        {/* Subtle, restrained logo reveal */}
        <motion.div
          className="w-[25vw] max-w-[400px] mb-[6vh] relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        >
          <img 
            src={`${baseUrl}spartan-stamp-logo.png`} 
            alt="Spartan Coaching Logo"
            className="w-full h-auto object-contain drop-shadow-2xl"
          />
        </motion.div>

        {/* Clean Typographic Lockup */}
        <div className="overflow-hidden flex flex-col items-center">
          <motion.p
            className="font-sans text-[2.5vw] text-[var(--color-brand-lightMuted)] mb-[1vh]"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
          >
            That's
          </motion.p>
          <motion.h2
            className="font-display text-[6vw] font-bold text-[var(--color-brand-light)] tracking-wide uppercase"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.4 }}
          >
            Spartan Hospice Coaching!
          </motion.h2>
        </div>
      </div>
      
      {/* Elegant light sweep at the end to settle the frame */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-transparent via-[var(--color-brand-light)] to-transparent opacity-0 z-20 pointer-events-none"
        animate={{
          opacity: [0, 0.05, 0],
          x: ['-100%', '100%']
        }}
        transition={{ duration: 2.5, ease: "easeInOut", delay: 2 }}
      />
    </motion.div>
  );
};

export default Scene6;
