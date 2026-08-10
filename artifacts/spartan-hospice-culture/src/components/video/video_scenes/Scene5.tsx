import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene5 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      {/* Background Image Reveal - Slow & Emotional */}
      <motion.div
        className="absolute inset-0 z-0 origin-center"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 5, ease: "easeOut" }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat mix-blend-screen"
          style={{ backgroundImage: `url(${baseUrl}patient-care.jpg)`, opacity: 0.6 }}
        />
        {/* Soft radial gradient to focus center */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-brand-dark)_100%)]" />
        <div className="absolute inset-0 bg-brand-dark/40" />
      </motion.div>

      <div className="relative z-10 max-w-[70vw] text-center flex flex-col items-center">
        <motion.p
          className="text-4xl md:text-5xl font-sans font-light leading-snug text-brand-light text-shadow-md"
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 1, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          ...to find the patient <br/>
          no one else is willing <br/>
          <span className="font-medium italic">to take care of.</span>
        </motion.p>
      </div>
    </motion.div>
  );
});

Scene5.displayName = 'Scene5';
export default Scene5;
