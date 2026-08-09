import { motion } from 'framer-motion';

export function Scene4_Conversational() {
  return (
    <motion.div 
      className="absolute inset-0 bg-[#0c0c0c] flex flex-col justify-center px-[10vw]"
      exit={{ x: '-10vw', opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.img 
        src={`${import.meta.env.BASE_URL}dark-grain.png`}
        className="absolute inset-0 w-full h-full object-cover opacity-15 z-0"
        initial={{ x: '5%' }}
        animate={{ x: '0%' }}
        transition={{ duration: 4, ease: "linear" }}
      />

      <div className="relative z-10">
        <motion.p 
          className="font-inter font-medium text-[2vw] text-spartan-white/50 tracking-wider uppercase"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          It is
        </motion.p>
        
        <div className="flex items-baseline mt-2">
          <motion.h1 
            className="font-bebas text-[8vw] text-spartan-white leading-none"
            initial={{ opacity: 0, y: 50, rotateX: 90 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
            style={{ transformOrigin: "bottom" }}
          >
            conversational
          </motion.h1>
          <motion.span 
            className="font-bebas text-[8vw] text-spartan-red leading-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300, delay: 1.6 }}
          >
            .
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
