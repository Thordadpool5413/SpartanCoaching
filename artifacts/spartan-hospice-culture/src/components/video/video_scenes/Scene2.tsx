import React from 'react';
import { motion } from 'framer-motion';

const Scene2: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Cinematic Background Image */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.6 }}
        exit={{ scale: 0.95, opacity: 0, filter: "blur(10px)" }}
        transition={{ duration: 4.5, ease: "easeOut" }}
      >
        <img 
          src={`${baseUrl}assets/cinematic_hospital.jpg`} 
          alt="Cinematic Hospital" 
          className="w-full h-full object-cover"
        />
        {/* Dark vignette to focus on text */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/80" 
             style={{ background: 'radial-gradient(circle, transparent 20%, rgba(17,19,21,0.9) 100%)' }} />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center justify-center w-[95vw] text-center">
        
        <div className="overflow-hidden mb-[2vh]">
          <motion.p
            className="font-sans font-medium text-[4.5vw] tracking-[0.1em] text-[var(--color-brand-warm)] opacity-90 uppercase text-shadow-subtle"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          >
            It's about the person who brings their
          </motion.p>
        </div>

        <div className="overflow-hidden">
          <motion.h1
            className="font-display font-bold text-[24vw] leading-[0.85] text-[var(--color-brand-white)] text-shadow-heavy"
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1 }}
          >
            GAME.
          </motion.h1>
        </div>
        
        {/* Understated red accent to ground the word "GAME" */}
        <motion.div
          className="w-[20vw] h-[6px] bg-[var(--color-brand-red)] mt-[4vh] shadow-[0_0_10px_rgba(218,41,28,0.3)]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.6 }}
        />

      </div>
    </motion.div>
  );
};

export default Scene2;
