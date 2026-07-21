import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5_Fragments() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 4000),
      setTimeout(() => setPhase(3), 7500),
      setTimeout(() => setPhase(4), 11000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const staggerText = (text: string, active: boolean, dim: boolean) =>
    text.split('').map((char, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, filter: 'blur(6px)' }}
        animate={{ opacity: dim ? 0.15 : active ? 1 : 0, filter: active ? 'blur(0px)' : 'blur(6px)' }}
        transition={{ duration: 0.3, delay: i * 0.025 }}
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
        animate={{ background: ['radial-gradient(ellipse at 20% 50%, rgba(139,0,0,0.08) 0%, transparent 55%)', 'radial-gradient(ellipse at 80% 50%, rgba(139,0,0,0.07) 0%, transparent 55%)', 'radial-gradient(ellipse at 20% 50%, rgba(139,0,0,0.08) 0%, transparent 55%)'] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.p
        className="font-body text-[#9a9a8e] uppercase mb-12 relative z-10"
        style={{ fontSize: 'clamp(22px, 4vw, 60px)', letterSpacing: '0.16em' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2 }}
      >
        The missed moments look like this:
      </motion.p>

      <div className="flex flex-col gap-[5vh] relative z-10">
        <div className="font-body text-[#9a9a8e]" style={{ fontSize: 'clamp(44px, 7.5vw, 120px)' }}>
          {staggerText('A stalled referral.', phase >= 1, phase >= 4)}
        </div>
        <div className="font-body text-[#9a9a8e] pl-[3vw]" style={{ fontSize: 'clamp(38px, 6.5vw, 104px)' }}>
          {staggerText("A 'not yet' with no follow-up.", phase >= 2, phase >= 4)}
        </div>
        <div className="font-body text-[#9a9a8e] pl-[6vw]" style={{ fontSize: 'clamp(32px, 5.5vw, 90px)' }}>
          {staggerText('A family who was never asked.', phase >= 3, false)}
        </div>
      </div>
    </motion.div>
  );
}
