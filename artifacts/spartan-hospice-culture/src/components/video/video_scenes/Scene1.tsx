import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SceneProps {
  duration: number;
}

const Scene1 = forwardRef<HTMLDivElement, SceneProps>(({ duration }, ref) => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-start w-full h-full px-[10vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background Image Reveal */}
      <motion.div
        className="absolute inset-0 z-0 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat origin-center"
          style={{ backgroundImage: `url(${baseUrl}coffee-donuts.jpg)` }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 4, ease: "easeOut" }}
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/70 to-transparent" />
      </motion.div>

      <div className="relative z-10 max-w-[60vw]">
        <motion.p
          className="text-4xl md:text-6xl font-sans font-light leading-tight text-brand-grayLight"
          initial={{ opacity: 0, x: -40, filter: "blur(5px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          It's not about who brings the best <br/>
          <span className="font-medium text-brand-light">donuts</span> or <span className="font-medium text-brand-light">coffee</span>.
        </motion.p>
      </div>
    </motion.div>
  );
});

Scene1.displayName = 'Scene1';
export default Scene1;
