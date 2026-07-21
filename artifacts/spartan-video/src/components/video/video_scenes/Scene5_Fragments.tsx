import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5_Fragments() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 2700), // fade top two
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const staggerText = (text: string, delayBase: number, active: boolean, dim: boolean) => {
    return text.split('').map((char, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ 
          opacity: dim ? 0.2 : active ? 1 : 0, 
          filter: active ? 'blur(0px)' : 'blur(4px)' 
        }}
        transition={{ duration: 0.2, delay: delayBase + i * 0.02 }}
      >
        {char}
      </motion.span>
    ));
  };

  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col justify-center pl-[25vw] bg-[#070707]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col gap-[3vh]">
        <h3 className="text-[3.5vw] font-body text-[#9a9a8e]">
          {staggerText("A stalled referral.", 0, phase >= 1, phase >= 4)}
        </h3>
        <h3 className="text-[3vw] font-body text-[#9a9a8e] pl-[2vw]">
          {staggerText("A 'not yet' without a follow-up.", 0, phase >= 2, phase >= 4)}
        </h3>
        <h3 className="text-[2.5vw] font-body text-[#9a9a8e] pl-[4vw]">
          {staggerText("A family who was never asked.", 0, phase >= 3, false)}
        </h3>
      </div>
    </motion.div>
  );
}
