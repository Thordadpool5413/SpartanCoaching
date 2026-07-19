import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function ScanLine({ trigger }: { trigger: number }) {
  return (
    <motion.div
      key={trigger}
      className="absolute left-0 right-0 h-[1px] bg-white pointer-events-none z-30"
      style={{ top: '50%' }}
      initial={{ scaleX: 0, opacity: 0.5, originX: 0 }}
      animate={{ scaleX: 1, opacity: 0 }}
      transition={{ duration: 0.35, ease: 'linear' }}
    />
  );
}

export function Scene3_Kinetic() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1100),
      setTimeout(() => setPhase(3), 1900),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10"
      initial={{ opacity: 0, x: '8%' }}
      animate={{ opacity: 1, x: '0%' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 flex flex-col justify-center px-[8vw]">
        <div className="overflow-hidden mb-3">
          <motion.h1
            className="text-[7.5vw] font-display font-black uppercase text-white leading-none"
            initial={{ y: '110%' }}
            animate={phase >= 1 ? { y: 0 } : { y: '110%' }}
            transition={{ type: 'spring', stiffness: 700, damping: 32 }}
          >
            THE PROMISE IS SIMPLE:
          </motion.h1>
        </div>

        {phase >= 1 && <ScanLine trigger={1} />}

        <div className="overflow-hidden mb-3">
          <motion.h1
            className="text-[7.5vw] font-display font-black uppercase text-[#e8291e] leading-none"
            initial={{ y: '110%' }}
            animate={phase >= 2 ? { y: 0 } : { y: '110%' }}
            transition={{ type: 'spring', stiffness: 700, damping: 32 }}
          >
            WHEN A PERSON IS ELIGIBLE
          </motion.h1>
        </div>

        {phase >= 2 && <ScanLine trigger={2} />}

        <div className="overflow-hidden">
          <motion.h1
            className="text-[7.5vw] font-display font-black uppercase text-white leading-none"
            initial={{ y: '110%' }}
            animate={phase >= 3 ? { y: 0 } : { y: '110%' }}
            transition={{ type: 'spring', stiffness: 700, damping: 32 }}
          >
            THEY DESERVE CARE.
          </motion.h1>
        </div>

        {phase >= 3 && <ScanLine trigger={3} />}

        {/* Hard red flash exit */}
        <motion.div
          className="absolute inset-0 bg-[#e8291e] z-20 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: [0, 0.75, 0] } : { opacity: 0 }}
          transition={{ duration: 0.4, times: [0, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}
