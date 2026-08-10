import React from 'react';
import { motion } from 'framer-motion';

const Scene3: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex w-full h-full p-[10vw]">
        {/* Left side: Context */}
        <div className="w-1/3 h-full flex flex-col justify-center border-r border-[var(--color-brand-light)]/10 pr-[5vw]">
          <motion.p
            className="font-sans text-[2.5vw] text-[var(--color-brand-lightMuted)] leading-relaxed"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            The person who asks the
          </motion.p>
        </div>
        
        {/* Right side: Core message */}
        <div className="w-2/3 h-full flex flex-col justify-center pl-[5vw] gap-[2vh]">
          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
          >
            <h2 className="font-display text-[7vw] font-semibold text-[var(--color-brand-light)] leading-none">
              HARD
            </h2>
          </motion.div>
          
          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
          >
            <h2 className="font-display text-[7vw] font-semibold text-[var(--color-brand-light)] leading-none pl-[5vw]">
              DISCOVERY
            </h2>
          </motion.div>
          
          <motion.div
            className="overflow-hidden relative inline-block self-start"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 1.1 }}
          >
            <h2 className="font-display text-[7vw] font-semibold text-[var(--color-brand-light)] leading-none pl-[10vw]">
              QUESTIONS.
            </h2>
            <motion.div 
              className="absolute bottom-[10%] left-[10vw] w-full h-[20%] bg-[var(--color-brand-red)]/30 z-[-1]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 1, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Scene3;
