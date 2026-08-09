import { motion } from 'framer-motion';

export function Scene2_Stats() {
  const stat1 = "70% never get referred.".split(' ');
  const stat2 = "Not because they don't qualify.".split(' ');

  // Render per-character reveals grouped by word so lines wrap at word
  // boundaries instead of breaking mid-word.
  const renderWords = (words: string[], keyPrefix: string, baseDelay: number) => {
    let charOffset = 0;
    return words.map((word, wordIndex) => {
      const startOffset = charOffset;
      charOffset += word.length + 1; // +1 for the following space
      return (
        <span key={`${keyPrefix}-w${wordIndex}`} className="inline-flex whitespace-nowrap mr-[0.3em]">
          {word.split('').map((char, index) => (
            <motion.span
              key={`${keyPrefix}-w${wordIndex}-c${index}`}
              className="inline-block"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.05, delay: baseDelay + ((startOffset + index) * 0.04) }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      );
    });
  };

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
          {renderWords(stat1, 's1', 0.2)}
        </div>
        
        <div className="overflow-hidden flex flex-wrap mt-4 text-spartan-white/70">
          {renderWords(stat2, 's2', 2.0)}
        </div>
      </div>
    </motion.div>
  );
}
