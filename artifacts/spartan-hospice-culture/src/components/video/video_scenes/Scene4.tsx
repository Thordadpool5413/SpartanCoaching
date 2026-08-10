import React from 'react';
import { motion } from 'framer-motion';

const Scene4: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* Cinematic Background Image - Patient care */}
      <motion.div 
        className="absolute inset-0 z-0 origin-center"
        initial={{ scale: 1.05, opacity: 0, filter: 'blur(5px)' }}
        animate={{ scale: 1, opacity: 0.65, filter: 'blur(0px)' }}
        exit={{ scale: 0.95, opacity: 0, filter: 'blur(15px)' }}
        transition={{ duration: 6.5, ease: "easeOut" }}
      >
        <img 
          src={`${baseUrl}assets/patient_care.jpg`} 
          alt="Patient Care" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </motion.div>

      {/* Typography - Centered, solemn */}
      <div className="relative z-10 flex flex-col items-center text-center w-[95vw]">
        
        <motion.p
          className="font-sans font-medium text-[3.8vw] tracking-wider text-[var(--color-brand-warm)] opacity-100 mb-[4vh] text-shadow-subtle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 1 }}
        >
          The person who's willing to find the patient
        </motion.p>
        
        <div className="overflow-hidden mb-[4vh]">
          <motion.h1
            className="font-display font-semibold italic text-[16.5vw] leading-none text-[var(--color-brand-white)] text-shadow-heavy"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 1.5 }}
          >
            no one else
          </motion.h1>
        </div>

        <motion.p
          className="font-sans font-medium text-[3.8vw] tracking-wider text-[var(--color-brand-warm)] opacity-100 text-shadow-subtle"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 2.2 }}
        >
          is willing to take care of.
        </motion.p>

      </div>
    </motion.div>
  );
};

export default Scene4;
