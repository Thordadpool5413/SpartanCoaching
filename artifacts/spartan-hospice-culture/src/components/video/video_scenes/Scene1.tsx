import React from 'react';
import { motion } from 'framer-motion';

const Scene1: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Cinematic Background Image - zooming in slowly to show moving past the old way */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1, opacity: 0, filter: 'blur(5px)' }}
        animate={{ scale: 1.1, opacity: 0.5, filter: 'blur(2px)' }}
        exit={{ scale: 1.15, opacity: 0, filter: 'blur(15px)' }}
        transition={{ duration: 5, ease: "linear" }}
      >
        <img 
          src={`${baseUrl}assets/donuts_coffee.jpg`} 
          alt="Donuts and coffee" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </motion.div>

      {/* Typography - Left aligned for editorial feel */}
      <div className="relative z-10 flex flex-col justify-center w-[85vw] h-full">
        <motion.p
          className="font-sans font-light text-[3vw] tracking-wider text-[var(--color-brand-gray)] mb-[2vh]"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
        >
          It's not about who brings the best
        </motion.p>
        
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden">
            <motion.h2
              className="font-display font-semibold text-[9vw] leading-[0.9] text-[var(--color-brand-white)] text-shadow-heavy"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.0 }}
            >
              donuts
            </motion.h2>
          </div>
          
          <div className="flex items-center gap-[2vw] overflow-hidden">
            <motion.span
              className="font-display italic text-[5vw] text-[var(--color-brand-gray)] text-shadow-subtle"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 1.6 }}
            >
              or
            </motion.span>
            
            <motion.h2
              className="font-display font-semibold text-[9vw] leading-[0.9] text-[var(--color-brand-white)] text-shadow-heavy"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.8 }}
            >
              coffee.
            </motion.h2>
          </div>
        </div>

        {/* Minimalist accent */}
        <motion.div
          className="w-[10vw] h-[2px] bg-[var(--color-brand-red)] mt-[6vh] opacity-80"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 2.2 }}
          style={{ originX: 0 }}
        />
      </div>
    </motion.div>
  );
};

export default Scene1;
