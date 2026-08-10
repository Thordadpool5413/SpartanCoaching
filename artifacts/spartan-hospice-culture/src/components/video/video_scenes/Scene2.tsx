import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene2 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center w-full h-full"
      initial={{ opacity: 0, x: '10vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center w-full">
        <motion.p 
          className="text-3xl md:text-5xl font-sans font-medium text-brand-light uppercase tracking-widest mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          It's about the person who
        </motion.p>
        
        <div className="relative">
          <motion.h2 
            className="text-[14vw] font-display uppercase tracking-tighter leading-[0.8] text-brand-light text-center glitch-text"
            data-text="BRINGS THEIR GAME."
            initial={{ scale: 0.8, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ 
              delay: 0.5, 
              duration: 1, 
              type: "spring", 
              stiffness: 200, 
              damping: 20 
            }}
          >
            BRINGS THEIR GAME.
          </motion.h2>
          
          {/* Intense background glow behind the text */}
          <motion.div 
            className="absolute top-1/2 left-1/2 w-full h-full bg-brand-red rounded-full mix-blend-screen blur-[100px] -z-10"
            style={{ x: '-50%', y: '-50%' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.5 }}
            transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
});

Scene2.displayName = 'Scene2';
export default Scene2;