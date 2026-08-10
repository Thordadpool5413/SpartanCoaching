import React from 'react';
import { motion } from 'framer-motion';

const Scene5: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Background - Very soft, abstract warmth */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 3, ease: "easeOut" }}
      >
        <img 
          src={`${baseUrl}assets/cinematic_hospital.jpg`} 
          alt="Warmth" 
          className="w-full h-full object-cover blur-[30px] scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center justify-center">
        
        <motion.p
          className="font-sans font-medium text-[2.5vw] tracking-[0.4em] text-[var(--color-brand-warm)] opacity-70 uppercase mb-[2vh]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
        >
          That's
        </motion.p>
        
        <div className="overflow-hidden">
          <motion.h1
            className="font-display font-bold text-[16vw] leading-none text-[var(--color-brand-white)] text-shadow-heavy"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 1 }}
          >
            HOSPICE.
          </motion.h1>
        </div>

      </div>
    </motion.div>
  );
};

export default Scene5;
