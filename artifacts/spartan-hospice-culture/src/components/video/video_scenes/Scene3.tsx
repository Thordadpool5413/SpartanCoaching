import React from 'react';
import { motion } from 'framer-motion';

const Scene3: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ scale: 0.5, opacity: 0, filter: "blur(20px)" }}
      animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: "-10vh" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col w-[85vw]">
        <motion.p
          className="font-sans font-bold text-[2vw] tracking-[0.2em] text-[var(--color-brand-gray)] uppercase mb-[2vh]"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          The person who asks the
        </motion.p>
        
        <div className="flex flex-col leading-[0.9]">
          <div className="overflow-hidden">
            <motion.h1
              className="font-display font-black text-[12vw] tracking-tighter text-[var(--color-brand-white)]"
              initial={{ y: "100%", rotate: 5 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.7, 0, 0.1, 1], delay: 0.7 }}
            >
              HARD DISCOVERY
            </motion.h1>
          </div>
          
          <div className="overflow-hidden">
            <motion.h1
              className="font-display font-black text-[12vw] tracking-tighter text-[var(--color-brand-red)]"
              initial={{ y: "100%", rotate: -5 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.7, 0, 0.1, 1], delay: 0.9 }}
            >
              QUESTIONS.
            </motion.h1>
          </div>
        </div>

        {/* Animated red line accent */}
        <motion.div
          className="h-[1vh] bg-[var(--color-brand-red)] mt-[4vh] origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: [0.7, 0, 0.1, 1], delay: 1.2 }}
        />
      </div>
    </motion.div>
  );
};

export default Scene3;
