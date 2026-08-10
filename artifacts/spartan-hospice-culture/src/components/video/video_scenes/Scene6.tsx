import React from 'react';
import { motion } from 'framer-motion';

const Scene6: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Cinematic Logo Background Video (if available) or elegant gradient */}
      <motion.div
        className="absolute inset-0 z-0 mix-blend-screen opacity-50"
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      >
        <video 
          src={`${baseUrl}hero-video.mp4`}
          className="w-full h-full object-cover blur-[2px]"
          autoPlay 
          muted 
          playsInline
        />
        <div className="absolute inset-0 bg-black/50" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[90vw] mt-[2vh]">
        
        {/* The user's stamped logo as the main visual brand mark */}
        <motion.div
          className="w-[20vw] max-w-[300px] mb-[6vh] relative drop-shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        >
          <img 
            src={`${baseUrl}spartan-stamp-logo.png`} 
            alt="Spartan Coaching Logo"
            className="w-full h-auto object-contain"
          />
        </motion.div>

        <div className="flex flex-col items-center justify-center text-center">
          <motion.p
            className="font-sans font-light text-[2vw] tracking-[0.3em] text-[var(--color-brand-warm)] opacity-80 uppercase mb-[2vh]"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1 }}
          >
            That's
          </motion.p>
          
          <div className="overflow-hidden">
            <motion.h2
              className="font-display font-semibold text-[6vw] leading-none text-[var(--color-brand-white)] text-shadow-heavy"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.3 }}
            >
              Spartan Hospice Coaching!
            </motion.h2>
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default Scene6;
