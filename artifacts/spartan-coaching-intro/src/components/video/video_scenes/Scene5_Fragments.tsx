import { motion } from 'framer-motion';

export function Scene5_Fragments() {
  const line1 = "A stalled referral.".split('');
  const line2 = "A family who was never asked.".split('');
  const line3 = "A conversation that never happened.".split('');

  return (
    <motion.div 
      className="absolute inset-0 bg-spartan-bg flex flex-col justify-center px-[10vw]"
      exit={{ scale: 1.5, filter: "blur(20px)", opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeIn" }}
    >
      <div className="relative z-10 flex flex-col gap-[3vh] font-inter text-[3.5vw] font-medium tracking-tight text-spartan-white">
        
        {/* Line 1 */}
        <motion.div 
          className="flex flex-wrap overflow-hidden"
          animate={{ opacity: [1, 1, 0.2] }}
          transition={{ duration: 4, times: [0, 0.5, 1] }}
        >
          {line1.map((char, index) => (
            <motion.span
              key={`l1-${index}`}
              className="inline-block"
              style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1, delay: 0.5 + (index * 0.03) }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Line 2 */}
        <motion.div 
          className="flex flex-wrap overflow-hidden"
          animate={{ opacity: [1, 1, 0.2] }}
          transition={{ duration: 4, times: [0, 0.6, 1], delay: 1 }}
        >
          {line2.map((char, index) => (
            <motion.span
              key={`l2-${index}`}
              className="inline-block"
              style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1, delay: 1.8 + (index * 0.03) }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Line 3 */}
        <motion.div className="flex flex-wrap overflow-hidden text-spartan-red">
          {line3.map((char, index) => (
            <motion.span
              key={`l3-${index}`}
              className="inline-block"
              style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1, delay: 3.5 + (index * 0.03) }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

      </div>
    </motion.div>
  );
}
