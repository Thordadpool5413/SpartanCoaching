import React from 'react';
import { motion } from 'framer-motion';

const Scene3: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Cinematic Background Image - Deep conversation */}
      <motion.div 
        className="absolute inset-0 z-0 origin-right"
        initial={{ scale: 1.15, opacity: 0, x: '5vw' }}
        animate={{ scale: 1.05, opacity: 0.7, x: 0 }}
        exit={{ scale: 1, opacity: 0, filter: "blur(10px)" }}
        transition={{ duration: 5, ease: "easeOut" }}
      >
        <img 
          src={`${baseUrl}assets/deep_conversation.jpg`} 
          alt="Deep conversation" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-black/10" />
      </motion.div>

      {/* Typography - Right aligned */}
      <div className="relative z-10 flex flex-col items-end w-[85vw] h-full justify-center text-right">
        <motion.p
          className="font-sans font-light text-[2.5vw] tracking-widest text-[var(--color-brand-warm)] opacity-80 uppercase mb-[3vh]"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
        >
          The person who asks the
        </motion.p>
        
        <div className="flex flex-col items-end leading-[1.1]">
          <div className="overflow-hidden">
            <motion.h1
              className="font-display font-semibold text-[8vw] text-[var(--color-brand-white)] text-shadow-heavy"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
            >
              hard discovery
            </motion.h1>
          </div>
          
          <div className="overflow-hidden">
            <motion.h1
              className="font-display font-semibold italic text-[8vw] text-[var(--color-brand-white)] text-shadow-heavy"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.5 }}
            >
              questions.
            </motion.h1>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Scene3;
