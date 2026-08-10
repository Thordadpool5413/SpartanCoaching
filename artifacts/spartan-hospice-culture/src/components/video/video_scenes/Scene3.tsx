import React from 'react';
import { motion } from 'framer-motion';

const Scene3: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="relative z-10 w-full max-w-7xl px-[4vw] flex flex-col items-center text-center">
        <motion.p 
          className="font-sans font-medium text-[2vw] text-brand-light/70 tracking-widest uppercase mb-[2vw]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
        >
          The person who asks the
        </motion.p>
        
        <motion.div 
          className="relative"
          initial={{ opacity: 0, rotateX: -90 }}
          animate={{ opacity: 1, rotateX: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
          style={{ perspective: 1000 }}
        >
          <h1 className="font-display text-[16vw] leading-[0.8] tracking-tighter text-transparent uppercase text-stroke-light relative z-10">
            HARD
          </h1>
          <motion.h1 
            className="font-display text-[16vw] leading-[0.8] tracking-tighter text-brand-red uppercase absolute inset-0 z-0 blur-[20px]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            HARD
          </motion.h1>
        </motion.div>

        <div className="overflow-hidden mt-[0.5vw]">
          <motion.h2 
            className="font-display text-[10vw] leading-[0.8] tracking-tighter text-brand-light uppercase"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.5 }}
          >
            DISCOVERY
          </motion.h2>
        </div>

        <div className="overflow-hidden">
          <motion.h2 
            className="font-display text-[10vw] leading-[0.8] tracking-tighter text-brand-dark uppercase text-stroke-red"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.7 }}
          >
            QUESTIONS.
          </motion.h2>
        </div>
      </div>
      
      {/* Searchlight effect sweeping across */}
      <motion.div 
        className="absolute top-0 w-[20vw] h-[150vh] bg-gradient-to-r from-transparent via-brand-light/10 to-transparent skew-x-[-30deg] mix-blend-overlay z-20 pointer-events-none"
        initial={{ left: "-50%" }}
        animate={{ left: "150%" }}
        transition={{ duration: 2.5, ease: "easeInOut", delay: 1.5 }}
      />
    </motion.div>
  );
};

export default Scene3;