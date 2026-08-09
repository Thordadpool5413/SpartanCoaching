import { motion } from 'framer-motion';

export function Scene3_Gap() {
  return (
    <motion.div 
      className="absolute inset-0 bg-spartan-bg flex flex-col items-center justify-center"
      // Entrance handled by clip-path circle expand
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(150% at 50% 50%)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.img 
        src={`${import.meta.env.BASE_URL}dark-grain.png`}
        className="absolute inset-0 w-full h-full object-cover opacity-20 z-0"
        animate={{ y: ['0%', '-5%'], opacity: [0.1, 0.2] }}
        transition={{ duration: 5, ease: "linear" }}
      />
      
      {/* Upward push wrapper */}
      <motion.div 
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ y: '10vh' }}
        animate={{ y: '0vh' }}
        transition={{ duration: 4, ease: "easeOut" }}
      >
        <motion.h2 
          className="font-bebas text-[10vw] text-spartan-white/50 leading-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          The gap is not
        </motion.h2>
        
        <motion.h1 
          className="font-bebas text-[18vw] text-spartan-red leading-none -mt-4 drop-shadow-2xl"
          initial={{ scale: 1.5, opacity: 0, filter: "blur(20px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
        >
          clinical.
        </motion.h1>
      </motion.div>
    </motion.div>
  );
}
