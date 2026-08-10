import React from 'react';
import { motion } from 'framer-motion';

const Scene6: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-brand-dark"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center w-full">
        
        {/* THAT'S HOSPICE. */}
        <motion.div 
          className="absolute flex items-center justify-center w-full"
          initial={{ opacity: 1, scale: 0.8, filter: "blur(0px)" }}
          animate={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
          transition={{ duration: 0.6, ease: "easeInOut", delay: 1.5 }}
        >
          <h2 className="font-display text-[12vw] leading-none tracking-tighter text-brand-light uppercase">
            THAT'S HOSPICE.
          </h2>
        </motion.div>

        {/* LOGO REVEAL */}
        <motion.div 
          className="absolute flex flex-col items-center justify-center w-full"
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 1.7 }}
        >
          {/* Main Spartan Lockup */}
          <motion.img 
            src={`${baseUrl}spartan-logo.png`}
            alt="Spartan Coaching"
            className="w-auto h-[40vh] object-contain mb-[2vw] mix-blend-screen drop-shadow-[0_0_30px_rgba(185,28,28,0.4)]"
            initial={{ filter: "brightness(2) contrast(1.5) blur(10px)" }}
            animate={{ filter: "brightness(1) contrast(1) blur(0px)" }}
            transition={{ duration: 1, ease: "easeOut", delay: 1.8 }}
          />

          {/* Stamp behind or to the side */}
          <motion.img 
            src={`${baseUrl}spartan-logo-stamp.png`}
            alt="Stamp"
            className="absolute w-auto h-[70vh] object-contain opacity-20 mix-blend-screen pointer-events-none z-[-1]"
            initial={{ scale: 3, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: -5, opacity: 0.15 }}
            transition={{ duration: 0.5, ease: "circIn", delay: 1.6 }}
          />
        </motion.div>

      </div>

      {/* Impact flash */}
      <motion.div 
        className="absolute inset-0 bg-brand-red mix-blend-screen z-50 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 1.5 }}
      />
    </motion.div>
  );
};

export default Scene6;