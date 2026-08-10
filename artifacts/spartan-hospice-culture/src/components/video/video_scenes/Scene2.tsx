import React from 'react';
import { motion } from 'framer-motion';

const Scene2: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center justify-center text-center z-10 w-[80vw]">
        <motion.p
          className="font-sans text-[3vw] text-[var(--color-brand-lightMuted)] font-light tracking-wide mb-[1vh]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        >
          It's about the person who brings their
        </motion.p>
        
        <div className="relative">
          {/* Subtle glow behind "game" */}
          <motion.div
            className="absolute inset-0 bg-[var(--color-brand-light)]/5 blur-2xl rounded-full"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          />
          <motion.h1
            className="font-display text-[12vw] font-bold text-[var(--color-brand-light)] leading-none relative z-10 tracking-tight"
            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          >
            GAME.
          </motion.h1>
          
          <motion.div
            className="absolute -bottom-[2vh] left-0 h-[4px] bg-[var(--color-brand-red)] z-20"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.4 }}
          />
        </div>
      </div>
      
      {/* Background sweep overlay local to scene */}
      <motion.div
        className="absolute top-0 right-0 w-[50vw] h-full bg-[var(--color-brand-light)]/5 z-0"
        initial={{ x: "100%", skewX: -20 }}
        animate={{ x: "-50vw", skewX: -20 }}
        transition={{ duration: 3, ease: "linear" }}
      />
    </motion.div>
  );
};

export default Scene2;
