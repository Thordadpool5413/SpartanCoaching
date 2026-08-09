import { motion } from 'framer-motion';

export function Scene7_Pillars() {
  return (
    <motion.div 
      className="absolute inset-0 bg-spartan-bg flex items-center justify-center"
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6 }}
    >
      <motion.img 
        src={`${import.meta.env.BASE_URL}concrete.png`}
        className="absolute inset-0 w-full h-full object-cover opacity-30 z-0 mix-blend-overlay"
        animate={{ scale: [1, 1.05], opacity: [0.2, 0.4] }}
        transition={{ duration: 5, ease: "linear" }}
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center font-bebas text-[11vw] text-spartan-red leading-[0.9] tracking-wider uppercase max-h-[80vh] overflow-hidden">
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)", x: -50 }}
          animate={{ clipPath: "inset(0 0% 0 0)", x: 0, scale: 0.9 }}
          transition={{ 
            clipPath: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
            x: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
            scale: { duration: 1.5, ease: "easeOut", delay: 1.5 }
          }}
          className="drop-shadow-lg"
        >
          DISCIPLINE.
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 1.5 }}
          className="drop-shadow-lg"
        >
          EMPATHY.
        </motion.div>
        
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20, delay: 2.6 }}
          className="drop-shadow-lg"
        >
          STRATEGY.
        </motion.div>
      </div>
    </motion.div>
  );
}
