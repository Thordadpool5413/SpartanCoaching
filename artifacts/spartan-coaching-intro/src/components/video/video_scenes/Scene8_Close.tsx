import { motion } from 'framer-motion';

export function Scene8_Close() {
  return (
    <motion.div 
      className="absolute inset-0 bg-[#040404] flex flex-col items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.img
        src={`${import.meta.env.BASE_URL}spartan-logo-stamp.png`}
        className="absolute top-1/2 left-1/2 w-[50vh] h-[50vh] object-contain opacity-5 z-0"
        style={{ x: '-50%', y: '-50%' }}
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 0.05 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
      />
      
      <div className="relative z-10 flex flex-col items-center mt-10">
        <motion.div
          className="font-bebas text-[10vw] text-spartan-white leading-none tracking-tight mb-4 drop-shadow-xl"
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.0 }}
        >
          SPARTAN COACHING
        </motion.div>
        
        <motion.div
          className="font-inter text-[2vw] text-spartan-white/40 tracking-[0.2em] font-medium uppercase"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 2.5 }}
        >
          spartancoaching.com
        </motion.div>
      </div>
    </motion.div>
  );
}
