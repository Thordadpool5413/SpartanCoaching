import { motion } from 'framer-motion';

export function Scene2_Stats() {
  const stat1 = "70% never get referred.".split('');
  const stat2 = "Not because they don't qualify.".split('');

  return (
    <motion.div 
      className="absolute inset-0 bg-spartan-bg flex flex-col justify-center px-[10vw]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background Image */}
      <motion.img 
        src={`${import.meta.env.BASE_URL}clinical-bg.png`}
        className="absolute inset-0 w-full h-full object-cover opacity-30 z-0"
        initial={{ scale: 1.05 }}
        animate={{ scale: 1.15 }}
        transition={{ duration: 6, ease: "linear" }}
      />
      
      <div className="relative z-10 font-bebas text-[8vw] leading-[0.9] text-spartan-white">
        <div className="overflow-hidden flex flex-wrap">
          {stat1.map((char, index) => (
            <motion.span
              key={`s1-${index}`}
              className="inline-block"
              style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.05, delay: 0.2 + (index * 0.04) }}
            >
              {char}
            </motion.span>
          ))}
        </div>
        
        <div className="overflow-hidden flex flex-wrap mt-4 text-spartan-white/70">
          {stat2.map((char, index) => (
            <motion.span
              key={`s2-${index}`}
              className="inline-block"
              style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.05, delay: 2.0 + (index * 0.04) }}
            >
              {char}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
