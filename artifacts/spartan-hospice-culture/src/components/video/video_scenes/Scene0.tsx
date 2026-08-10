import React from 'react';
import { motion } from 'framer-motion';

const Scene0: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center text-center"
      initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="overflow-hidden flex flex-col items-center">
        <motion.h1 
          className="font-display text-[10vw] leading-[0.8] tracking-tighter text-brand-red uppercase"
          initial={{ y: "100%", opacity: 0, rotateX: 45 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          HOSPICE SALES
        </motion.h1>
        <motion.h2 
          className="font-display text-[7vw] leading-[0.9] tracking-tight text-brand-light mt-[1vw] uppercase"
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
        >
          HAS TO CHANGE.
        </motion.h2>
      </div>
      
      {/* Decorative vertical line */}
      <motion.div 
        className="w-[0.5vw] h-[15vh] bg-brand-red mt-[4vw] origin-top"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, ease: "circOut", delay: 1.2 }}
      />
    </motion.div>
  );
};

export default Scene0;