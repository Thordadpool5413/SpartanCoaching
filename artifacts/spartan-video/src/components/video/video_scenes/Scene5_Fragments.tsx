import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5_Fragments() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 5500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const staggerText = (text: string, active: boolean, dim: boolean) => {
    return text.split('').map((char, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, filter: 'blur(6px)' }}
        animate={{
          opacity: dim ? 0.15 : active ? 1 : 0,
          filter: active ? 'blur(0px)' : 'blur(6px)',
        }}
        transition={{ duration: 0.3, delay: i * 0.024 }}
      >
        {char}
      </motion.span>
    ));
  };

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col justify-center pl-[10vw] pr-[10vw] bg-[#070707]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Animated dark gradient atmosphere */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 15% 40%, rgba(139,0,0,0.08) 0%, transparent 55%)',
            'radial-gradient(ellipse at 75% 60%, rgba(139,0,0,0.06) 0%, transparent 55%)',
            'radial-gradient(ellipse at 40% 30%, rgba(139,0,0,0.08) 0%, transparent 55%)',
            'radial-gradient(ellipse at 15% 40%, rgba(139,0,0,0.08) 0%, transparent 55%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Label */}
      <motion.p
        className="font-body text-[#9a9a8e] tracking-widest uppercase mb-10 relative z-10"
        style={{ fontSize: '2.4vw', letterSpacing: '0.22em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
      >
        The missed moments look like this:
      </motion.p>

      <div className="flex flex-col gap-[4vh] relative z-10">
        <h3 className="font-body text-[#9a9a8e]" style={{ fontSize: '5vw' }}>
          {staggerText('A stalled referral.', phase >= 1, phase >= 4)}
        </h3>
        <h3 className="font-body text-[#9a9a8e] pl-[2vw]" style={{ fontSize: '4.4vw' }}>
          {staggerText("A 'not yet' with no follow-up.", phase >= 2, phase >= 4)}
        </h3>
        <h3 className="font-body text-[#9a9a8e] pl-[4vw]" style={{ fontSize: '3.8vw' }}>
          {staggerText('A family who was never asked.', phase >= 3, false)}
        </h3>
      </div>
    </motion.div>
  );
}
