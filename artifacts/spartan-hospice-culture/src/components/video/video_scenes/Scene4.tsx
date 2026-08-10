import React from 'react';
import { motion } from 'framer-motion';

const Scene4: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(15px)" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Dynamic structural background element */}
      <motion.div
        className="absolute inset-0 border-[1vw] border-[var(--color-brand-light)] opacity-5 z-0 m-[4vw]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      />
      
      <div className="flex flex-col items-center justify-center w-[85vw] text-center z-10">
        
        <motion.p
          className="font-sans text-[2.5vw] text-[var(--color-brand-lightMuted)] mb-[3vh]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          The person who's willing to
        </motion.p>
        
        <div className="overflow-hidden mb-[4vh]">
          <motion.h2
            className="font-display text-[8vw] font-bold text-[var(--color-brand-light)] leading-none"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1 }}
          >
            CHALLENGE THEMSELVES
          </motion.h2>
        </div>

        <motion.p
          className="font-sans text-[3vw] text-[var(--color-brand-light)]/90 font-medium max-w-[70vw] leading-[1.3]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.8 }}
        >
          to find the patient no one else is willing to take care of.
        </motion.p>

        {/* Accent Red Line acting as an underline indicator */}
        <motion.div
          className="w-[10vw] h-[4px] bg-[var(--color-brand-red)] mt-[4vh]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 2.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
};

export default Scene4;
