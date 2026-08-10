import React from 'react';
import { motion } from 'framer-motion';

const Scene4: React.FC<{ duration: number }> = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 w-full flex flex-col items-center text-center px-[2vw]">
        <motion.p 
          className="font-sans text-[2.5vw] text-brand-light/60 font-light tracking-widest uppercase mb-[2vw]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
        >
          The person who's willing to
        </motion.p>
        
        <div className="flex flex-wrap justify-center gap-x-[1.5vw] gap-y-[0.5vw] max-w-6xl">
          {["CHALLENGE", "THEMSELVES"].map((word, wordIndex) => (
            <div key={wordIndex} className="overflow-hidden flex">
              {word.split('').map((char, charIndex) => (
                <motion.span
                  key={charIndex}
                  className={`font-display text-[14vw] leading-[0.85] tracking-tighter uppercase ${wordIndex === 0 ? 'text-brand-light' : 'text-brand-red'}`}
                  initial={{ y: "100%", opacity: 0, rotateZ: 15 }}
                  animate={{ y: 0, opacity: 1, rotateZ: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.16, 1, 0.3, 1], 
                    delay: 1.0 + (wordIndex * 0.2) + (charIndex * 0.05) 
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Background intense vignette specifically for this scene */}
      <motion.div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.9)_80%)] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      />
    </motion.div>
  );
};

export default Scene4;