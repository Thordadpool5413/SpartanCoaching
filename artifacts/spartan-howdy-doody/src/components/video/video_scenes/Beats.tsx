import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Time-driven beat sequencer.
 *
 * Each scene gets a local clock (seconds since the scene mounted) and
 * declares its messages as <Beat from={} to={}> windows. AnimatePresence
 * guarantees a beat fully animates out when its window closes — so as long
 * as windows don't overlap, only one message can ever be on screen.
 */

export function useSceneClock(): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => {
      setT((performance.now() - start) / 1000);
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  return t;
}

interface BeatProps {
  t: number;
  from: number;
  to: number;
  children: React.ReactNode;
  className?: string;
}

/** A single message window. Enter: rise + fade. Exit: drift up + fade. */
export const Beat: React.FC<BeatProps> = ({ t, from, to, children, className }) => (
  <AnimatePresence>
    {t >= from && t < to && (
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

/** Shared top-left context slate, consistent across every scene. */
export const Slate: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0.5,
}) => (
  <motion.p
    className="absolute top-[6vh] left-[6vw] z-10 font-sans font-bold text-[1.6vw] tracking-[0.45em] uppercase text-white bg-black/55 backdrop-blur-sm px-[1.6vw] py-[1.2vh] border-l-[0.35vw] border-[var(--color-brand-red)]"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8, ease: 'easeOut', delay }}
  >
    {children}
  </motion.p>
);

/** Shared lower-third scrim so text always sits on a readable base. */
export const LowerScrim: React.FC = () => (
  <div className="absolute inset-x-0 bottom-0 h-[44vh] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
);
