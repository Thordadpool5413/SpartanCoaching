import React from 'react';
import { motion } from 'framer-motion';

const Scene0: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ scale: 1.1, filter: 'blur(10px)', opacity: 0 }}
      animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0, filter: 'blur(5px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center justify-center text-center uppercase">
        <div className="overflow-hidden mb-[-2vh]">
          <motion.h1
            className="font-display font-black text-[14vw] leading-none tracking-tighter text-[var(--color-brand-white)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.1, 1], delay: 0.2 }}
          >
            HOSPICE SALES
          </motion.h1>
        </div>
        
        <div className="overflow-hidden flex items-center gap-[2vw]">
          <motion.span
            className="font-display font-bold text-[8vw] leading-none tracking-tight text-[var(--color-brand-gray)]"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.1, 1], delay: 0.4 }}
          >
            HAS TO
          </motion.span>
          <motion.span
            className="font-display font-black text-[10vw] leading-none tracking-tighter text-[var(--color-brand-red)] text-glow"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.8 }}
          >
            CHANGE.
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};

export default Scene0;
