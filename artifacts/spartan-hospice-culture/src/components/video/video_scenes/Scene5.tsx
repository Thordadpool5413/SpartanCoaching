import React from 'react';
import { motion } from 'framer-motion';

const Scene5: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)" }}
      transition={{ duration: 2, ease: "easeInOut" }}
    >
      {/* Respectful, understated patient light background */}
      <motion.img 
        src={`${baseUrl}patient-light.jpg`}
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 0.6 }}
        transition={{ duration: 6, ease: "easeOut" }}
      />
      
      <div className="relative z-10 w-full max-w-5xl px-[4vw] text-left flex flex-col items-start drop-shadow-2xl">
        <motion.p 
          className="font-sans font-light text-[4vw] text-brand-light leading-tight"
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 1 }}
        >
          ...to find the <span className="font-semibold text-white">patient</span><br/>
          <motion.span 
            className="text-brand-light/60 text-[3vw] mt-[1vw] block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 2.5 }}
          >
            no one else is willing<br/>to take care of.
          </motion.span>
        </motion.p>
      </div>

      {/* Very slow moving dust/light particles for reverence */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20 blur-sm"
            style={{
              width: Math.random() * 10 + 2,
              height: Math.random() * 10 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100 - Math.random() * 50],
              x: [0, (Math.random() - 0.5) * 50],
              opacity: [0, Math.random() * 0.5 + 0.2, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default Scene5;