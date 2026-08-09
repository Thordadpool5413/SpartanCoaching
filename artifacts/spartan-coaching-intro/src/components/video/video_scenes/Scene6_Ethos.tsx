import { motion } from 'framer-motion';

export function Scene6_Ethos() {
  const words = [
    { text: "You do not", color: "text-spartan-white" },
    { text: "wing it", color: "text-spartan-white" },
    { text: "when the stakes", color: "text-spartan-white" },
    { text: "are this high.", color: "text-spartan-red" }
  ];

  return (
    <motion.div 
      className="absolute inset-0 bg-spartan-bg flex flex-col items-center justify-center text-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.img 
        src={`${import.meta.env.BASE_URL}ethos-bg.png`}
        className="absolute inset-0 w-full h-full object-cover z-0"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.6 }}
        transition={{ duration: 6, ease: "easeOut" }}
      />
      
      <div className="relative z-10 flex flex-col items-center font-bebas text-[9vw] leading-[0.85] tracking-tight uppercase">
        {words.map((line, lineIndex) => (
          <div key={`line-${lineIndex}`} className={`flex overflow-hidden ${line.color}`}>
            {line.text.split('').map((char, charIndex) => (
              <motion.span
                key={`char-${lineIndex}-${charIndex}`}
                className="inline-block drop-shadow-2xl"
                style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
                initial={{ clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)", y: '50%' }}
                animate={{ clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)", y: '0%' }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.16, 1, 0.3, 1], 
                  // Calculate global delay based on previous characters
                  delay: 1.0 + (lineIndex * 0.4) + (charIndex * 0.03) 
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
