import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5_Fragments() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 5500),
      setTimeout(() => setPhase(4), 8000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const staggerText = (text: string, active: boolean, dim: boolean) =>
    text.split('').map((char, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, filter: 'blur(5px)' }}
        animate={{ opacity: dim ? 0.15 : active ? 1 : 0, filter: active ? 'blur(0px)' : 'blur(5px)' }}
        transition={{ duration: 0.28, delay: i * 0.022 }}
      >{char}</motion.span>
    ));

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col justify-center pl-[7vw] pr-[7vw] bg-[#070707]"
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ background: ['radial-gradient(ellipse at 20% 50%, rgba(139,0,0,0.07) 0%, transparent 55%)', 'radial-gradient(ellipse at 80% 50%, rgba(139,0,0,0.06) 0%, transparent 55%)', 'radial-gradient(ellipse at 20% 50%, rgba(139,0,0,0.07) 0%, transparent 55%)'] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.p
        className="font-body text-[#9a9a8e] uppercase mb-10 relative z-10"
        style={{ fontSize: 'clamp(13px, 2.4vw, 36px)', letterSpacing: '0.16em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.1 }}
      >
        The missed moments look like this:
      </motion.p>

      <div className="flex flex-col gap-[4vh] relative z-10">
        <div className="font-body text-[#9a9a8e]" style={{ fontSize: 'clamp(28px, 5.5vw, 84px)' }}>
          {staggerText('A stalled referral.', phase >= 1, phase >= 4)}
        </div>
        <div className="font-body text-[#9a9a8e] pl-[2vw]" style={{ fontSize: 'clamp(24px, 4.8vw, 72px)' }}>
          {staggerText("A 'not yet' with no follow-up.", phase >= 2, phase >= 4)}
        </div>
        <div className="font-body text-[#9a9a8e] pl-[4vw]" style={{ fontSize: 'clamp(20px, 4.2vw, 64px)' }}>
          {staggerText('A family who was never asked.', phase >= 3, false)}
        </div>
      </div>
    </motion.div>
  );
}
