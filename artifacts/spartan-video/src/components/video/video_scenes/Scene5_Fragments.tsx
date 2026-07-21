import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5_Fragments() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 1100),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 2900),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const staggerText = (text: string, active: boolean, dim: boolean) => {
    return text.split('').map((char, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{
          opacity: dim ? 0.18 : active ? 1 : 0,
          filter: active ? 'blur(0px)' : 'blur(4px)',
        }}
        transition={{ duration: 0.2, delay: i * 0.018 }}
      >
        {char}
      </motion.span>
    ));
  };

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col justify-center pl-[22vw] bg-[#070707]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background layer: animated dark gradient mesh */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 15% 40%, rgba(139,0,0,0.09) 0%, transparent 55%), radial-gradient(ellipse at 85% 70%, rgba(8,7,7,0.6) 0%, transparent 50%)',
            'radial-gradient(ellipse at 75% 25%, rgba(139,0,0,0.07) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(8,7,7,0.6) 0%, transparent 50%)',
            'radial-gradient(ellipse at 40% 65%, rgba(139,0,0,0.09) 0%, transparent 55%), radial-gradient(ellipse at 60% 20%, rgba(8,7,7,0.6) 0%, transparent 50%)',
            'radial-gradient(ellipse at 15% 40%, rgba(139,0,0,0.09) 0%, transparent 55%), radial-gradient(ellipse at 85% 70%, rgba(8,7,7,0.6) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="flex flex-col gap-[3vh] relative z-10">
        <h3 className="text-[3.5vw] font-body text-[#9a9a8e]">
          {staggerText('A stalled referral.', phase >= 1, phase >= 4)}
        </h3>
        <h3 className="text-[3vw] font-body text-[#9a9a8e] pl-[2vw]">
          {staggerText("A 'not yet' without a follow-up.", phase >= 2, phase >= 4)}
        </h3>
        <h3 className="text-[2.5vw] font-body text-[#9a9a8e] pl-[4vw]">
          {staggerText('A family who was never asked.', phase >= 3, false)}
        </h3>
      </div>
    </motion.div>
  );
}
