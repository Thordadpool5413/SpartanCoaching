import { motion } from 'framer-motion';

export function Scene1_ColdOpen() {
  const chars = "500,000.".split('');
  
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-spartan-bg"
      exit={{ opacity: 0, filter: "blur(10px)", scale: 1.1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Animated red line specific to this scene's entrance */}
      <motion.div 
        className="absolute top-1/2 left-1/2 h-[2px] bg-spartan-red -translate-y-1/2 -translate-x-1/2 z-0"
        initial={{ width: '0vw' }}
        animate={{ width: '100vw', opacity: [1, 1, 0] }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], times: [0, 0.6, 1] }}
      />
      
      <div className="relative z-10 flex text-[15vw] font-bebas leading-none tracking-tight">
        {chars.map((char, index) => (
          <motion.span
            key={index}
            className="inline-block overflow-hidden text-spartan-white drop-shadow-2xl"
            initial={{ clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)", y: '20%' }}
            animate={{ clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)", y: '0%' }}
            transition={{ 
              duration: 0.6, 
              ease: [0.16, 1, 0.3, 1], 
              delay: 0.8 + (index * 0.05) 
            }}
          >
            {char}
          </motion.span>
        ))}
      </div>
      
      <motion.div
        className="text-spartan-white/60 font-inter text-[2vw] font-medium tracking-wide mt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 2.2 }}
      >
        Americans die each year who qualified for hospice.
      </motion.div>
    </motion.div>
  );
}
