import React from 'react';
import { motion } from 'framer-motion';

const Scene1: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Cinematic Background Image - brought forward with higher opacity and sharper focus */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1, opacity: 0, filter: 'blur(4px)' }}
        animate={{ scale: 1.05, opacity: 0.75, filter: 'blur(0px)' }}
        exit={{ scale: 1.1, opacity: 0, filter: 'blur(10px)' }}
        transition={{
          scale: { duration: 5, ease: 'linear' },
          opacity: { duration: 1.2, ease: [0.33, 1, 0.68, 1] },
          filter: { duration: 1.2, ease: [0.33, 1, 0.68, 1] },
        }}
      >
        <img 
          src={`${baseUrl}assets/donuts_coffee.jpg`} 
          alt="Donuts and coffee" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/55 to-transparent" />
      </motion.div>

      {/* Typography - Left aligned */}
      <div className="relative z-10 flex flex-col justify-center w-[85vw] h-full">
        <motion.p
          className="font-sans font-light text-[4.5vw] tracking-wider text-[var(--color-brand-gray)] mb-[2vh] text-shadow-subtle"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
        >
          It's not about who brings the best
        </motion.p>
        
        <div className="flex flex-col gap-0 relative self-start">
          <div className="overflow-hidden pr-[4vw]">
            <motion.h2
              className="font-display font-semibold text-[13.5vw] leading-[1] text-[var(--color-brand-white)] text-shadow-heavy"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 1.0 }}
            >
              donuts
            </motion.h2>
          </div>
          
          <div className="flex items-center gap-[2.5vw] overflow-hidden -mt-[1vw] pr-[4vw] pb-[1vh]">
            <motion.span
              className="font-display italic text-[7.5vw] text-[var(--color-brand-gray)] text-shadow-subtle"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 1.4 }}
            >
              or
            </motion.span>
            
            <motion.h2
              className="font-display font-semibold text-[13.5vw] leading-[1] text-[var(--color-brand-white)] text-shadow-heavy"
              initial={{ y: "100%", opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 200, damping: 20, delay: 1.6 }}
            >
              coffee.
            </motion.h2>
          </div>

          {/* Decisive strike/underline moment */}
          <motion.div
            className="absolute bottom-0 left-0 h-[8px] bg-[var(--color-brand-red)] shadow-[0_0_15px_rgba(218,41,28,0.5)] z-20"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1], delay: 2.1 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Scene1;
