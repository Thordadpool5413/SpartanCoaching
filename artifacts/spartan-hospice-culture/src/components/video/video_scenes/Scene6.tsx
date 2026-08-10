import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene6 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-w-[90vw]">
        
        {/* The Stamp Logo slamming down */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center -z-10"
          initial={{ scale: 3, opacity: 0, rotate: -15, filter: "blur(10px)" }}
          animate={{ scale: 1, opacity: 0.8, rotate: -5, filter: "blur(0px)" }}
          transition={{ duration: 0.8, type: "spring", damping: 15, stiffness: 100 }}
        >
          <img 
            src={`${baseUrl}spartan-stamp-logo.png`} 
            alt="Spartan Coaching" 
            className="w-[70vw] max-w-[800px] h-auto object-contain drop-shadow-2xl"
          />
        </motion.div>

        {/* The required exact script text */}
        <div className="flex flex-col items-center justify-end h-full pb-[15vh]">
          <div className="overflow-hidden">
            <motion.h2 
              className="text-3xl md:text-5xl font-sans font-medium uppercase tracking-[0.2em] text-brand-light mb-4 drop-shadow-2xl"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              That's
            </motion.h2>
          </div>

          <div className="overflow-hidden">
            <motion.h1 
              className="text-[8vw] font-display uppercase tracking-tight leading-none text-brand-light drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
              initial={{ y: '100%', opacity: 0, rotateX: 45 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{ delay: 1.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              Spartan <span className="text-brand-red">Hospice</span> Coaching!
            </motion.h1>
          </div>
        </div>

      </div>
      
      {/* Heavy impact flash effect when stamp hits */}
      <motion.div
        className="absolute inset-0 bg-brand-red mix-blend-overlay pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.5, ease: "easeOut", times: [0, 0.1, 1] }}
      />
    </motion.div>
  );
});

Scene6.displayName = 'Scene6';
export default Scene6;