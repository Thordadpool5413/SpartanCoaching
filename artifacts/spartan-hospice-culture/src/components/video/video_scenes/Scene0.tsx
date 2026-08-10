import React from 'react';
import { motion } from 'framer-motion';

const Scene0: React.FC<{ duration: number }> = () => {
  const words = ["Hospice", "sales", "has", "to", "change."];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Studio wipe overlay */}
      <motion.div
        className="absolute inset-0 bg-[var(--color-brand-slateDark)] z-30 pointer-events-none"
        initial={{ scaleX: 1, transformOrigin: 'right' }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="flex flex-wrap justify-center gap-[1.5vw] px-[10vw] max-w-[80vw] relative z-10">
        {words.map((word, i) => (
          <motion.div
            key={i}
            className="overflow-hidden"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.3 + i * 0.1,
            }}
          >
            <h1 
              className={`font-display text-[8vw] leading-[1.1] tracking-tight ${
                word === "change." ? "text-[var(--color-brand-red)] font-semibold" : "text-[var(--color-brand-light)] font-light"
              }`}
            >
              {word}
            </h1>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Scene0;
