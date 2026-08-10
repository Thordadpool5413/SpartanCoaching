import React from 'react';
import { motion } from 'framer-motion';

const Scene2: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ x: "10vw", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center w-[90vw]">
        
        <div className="overflow-hidden mb-[1vh]">
          <motion.p
            className="font-sans font-bold text-[2.5vw] tracking-[0.2em] text-[var(--color-brand-white)] uppercase"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.7, 0, 0.1, 1], delay: 0.2 }}
          >
            It's about the person who brings their
          </motion.p>
        </div>

        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.6 }}
        >
          <h1 className="font-display font-black text-[25vw] leading-[0.8] tracking-tighter text-[var(--color-brand-red)] text-glow">
            GAME.
          </h1>
          
          {/* Slashes overlaying the text for hardcore feel */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
            animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <h1 className="font-display font-black text-[25vw] leading-[0.8] tracking-tighter text-[var(--color-brand-white)] mix-blend-overlay">
              GAME.
            </h1>
          </motion.div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Scene2;
