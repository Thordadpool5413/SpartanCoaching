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
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Cinematic Logo Background Video */}
      <motion.div
        className="absolute inset-0 z-0 mix-blend-screen opacity-80"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.8 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <video 
          src={`${baseUrl}hero-video.mp4`}
          className="w-full h-full object-cover"
          autoPlay 
          muted 
          playsInline
        />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[90vw] mt-[5vh]">
        
        {/* The user's stamped logo as the main visual brand mark */}
        <motion.div
          className="w-[20vw] max-w-[300px] mb-[4vh] relative drop-shadow-[0_0_30px_rgba(218,41,28,0.5)]"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.5 }}
        >
          <img 
            src={`${baseUrl}spartan-stamp-logo.png`} 
            alt="Spartan Coaching Logo"
            className="w-full h-auto object-contain"
          />
        </motion.div>

        <div className="flex flex-col items-center justify-center text-center">
          <motion.p
            className="font-sans font-bold text-[2vw] tracking-[0.3em] text-[var(--color-brand-gray)] uppercase mb-[1vh]"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 1 }}
          >
            That's
          </motion.p>
          
          <motion.h2
            className="font-display font-black text-[6vw] leading-none tracking-tighter text-[var(--color-brand-white)] uppercase"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 1.3 }}
          >
            Spartan Hospice Coaching!
          </motion.h2>
        </div>
      </div>

    </motion.div>
  );
};

export default Scene6;
