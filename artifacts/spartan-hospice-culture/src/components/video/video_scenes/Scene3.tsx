import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene3 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-end w-full h-full px-[10vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background Image Reveal */}
      <motion.div
        className="absolute inset-0 z-0 origin-right"
        initial={{ clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' }}
        animate={{ clipPath: 'polygon(0% 0, 100% 0, 100% 100%, 0% 100%)' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat origin-center"
          style={{ backgroundImage: `url(${baseUrl}discovery-questions.jpg)` }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 4, ease: "easeOut" }}
        />
        {/* Dark gradient overlay for text readability on right */}
        <div className="absolute inset-0 bg-gradient-to-l from-brand-dark via-brand-dark/80 to-brand-dark/20" />
      </motion.div>

      <div className="relative z-10 max-w-[55vw] text-right flex flex-col items-end">
        <motion.div
          className="w-16 h-1 bg-brand-red mb-6"
          initial={{ width: 0 }}
          animate={{ width: 64 }}
          transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
        />
        <motion.p
          className="text-4xl md:text-6xl font-sans font-light leading-tight text-brand-grayLight"
          initial={{ opacity: 0, y: 30, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          The person who asks the <br/>
          <span className="font-medium text-brand-light">hard discovery questions.</span>
        </motion.p>
      </div>
    </motion.div>
  );
});

Scene3.displayName = 'Scene3';
export default Scene3;
