import React from 'react';
import { motion } from 'framer-motion';

const Scene1: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: "-10vw", filter: "blur(20px)" }}
      transition={{ duration: 1 }}
    >
      {/* Background Coffee Silhouette */}
      <motion.img 
        src={`${baseUrl}coffee-contrast.jpg`}
        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen"
        initial={{ scale: 1.2, x: 50 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 4, ease: "easeOut" }}
      />
      
      <div className="relative z-10 w-full max-w-6xl px-[4vw] text-left">
        <motion.div className="flex flex-col items-start gap-[0.5vw]">
          <motion.div className="overflow-hidden">
            <motion.p 
              className="font-sans font-semibold text-[2vw] text-brand-gray tracking-widest uppercase"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              It's not about who brings the best
            </motion.p>
          </motion.div>
          
          <motion.div className="overflow-hidden mt-[1vw]">
            <motion.h2 
              className="font-display text-[12vw] leading-none tracking-tighter text-brand-gray/50 uppercase"
              initial={{ y: "100%", rotate: 5 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            >
              DONUTS
            </motion.h2>
          </motion.div>
          
          <motion.div className="overflow-hidden flex items-center gap-[1.5vw]">
            <motion.span 
              className="font-display text-[6vw] text-brand-red uppercase"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "backOut", delay: 1.0 }}
            >
              OR
            </motion.span>
            <motion.h2 
              className="font-display text-[12vw] leading-none tracking-tighter text-brand-gray/50 uppercase"
              initial={{ y: "100%", rotate: -5 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
            >
              COFFEE.
            </motion.h2>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Hard strike-through line to emphasize "not about" */}
      <motion.div 
        className="absolute top-1/2 left-0 w-full h-[1vw] bg-brand-red z-20 origin-left mix-blend-difference"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: "circIn", delay: 2.2 }}
        style={{ y: '-50%', rotate: -5 }}
      />
    </motion.div>
  );
};

export default Scene1;