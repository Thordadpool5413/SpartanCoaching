import React from 'react';
import { motion } from 'framer-motion';

const Scene5: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ scale: 3, opacity: 0, filter: "blur(20px)" }}
      transition={{ duration: 0.8, ease: [0.7, 0, 0.1, 1] }}
    >
      <div className="flex flex-col items-center justify-center">
        
        <motion.p
          className="font-sans font-bold text-[3vw] tracking-[0.3em] text-[var(--color-brand-red)] uppercase mb-[1vh]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          That's
        </motion.p>
        
        <div className="overflow-hidden">
          <motion.h1
            className="font-display font-black text-[22vw] leading-none tracking-tighter text-[var(--color-brand-white)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.1, 1], delay: 0.6 }}
          >
            HOSPICE.
          </motion.h1>
        </div>

        {/* Impact shockwave */}
        <motion.div
          className="absolute inset-0 border-[2px] border-[var(--color-brand-red)] rounded-full pointer-events-none"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
        />

      </div>
    </motion.div>
  );
};

export default Scene5;
