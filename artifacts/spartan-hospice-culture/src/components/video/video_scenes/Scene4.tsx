import React from 'react';
import { motion } from 'framer-motion';

const Scene4: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, y: "10vh" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center text-center w-[90vw] max-w-[1200px]">
        
        <motion.p
          className="font-sans font-medium text-[3vw] tracking-wider text-[var(--color-brand-gray)] uppercase mb-[4vh]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        >
          The person who's willing to find the patient
        </motion.p>
        
        <div className="relative mb-[4vh]">
          <motion.h1
            className="font-display font-black text-[16vw] leading-none tracking-tighter text-[var(--color-brand-white)]"
            initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1 }}
          >
            NO ONE ELSE
          </motion.h1>
          {/* subtle red echo */}
          <motion.h1
            className="absolute inset-0 font-display font-black text-[16vw] leading-none tracking-tighter text-[var(--color-brand-red)] z-[-1] opacity-50 blur-[20px]"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 4, ease: "linear", delay: 1 }}
          >
            NO ONE ELSE
          </motion.h1>
        </div>

        <motion.p
          className="font-sans font-medium text-[3vw] tracking-wider text-[var(--color-brand-gray)] uppercase"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.8 }}
        >
          is willing to take care of.
        </motion.p>

      </div>
    </motion.div>
  );
};

export default Scene4;
