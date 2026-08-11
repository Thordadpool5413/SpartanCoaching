import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate, LowerScrim } from './Beats';

/**
 * Scene 5 — The Pivot: what real hospice sales work looks like. (8s)
 * Warm, hopeful daylight — a rep and a case manager over a patient chart.
 * Two beats, one at a time:
 *   1. The demand: change how hospice sales is delivered.
 *   2. The alternative: not with donuts — with clinical fluency.
 */
const Scene5: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;
  const t = useSceneClock();

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'linear' }}
    >
      {/* Real sales work — warm daylight, no red grade */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: 'linear' }}
      >
        <img
          src={`${baseUrl}assets/act3_real_work_clean.jpg`}
          alt="A hospice sales professional and a nurse case manager reviewing a patient chart together"
          className="w-full h-full object-cover object-[center_25%]"
        />
        <LowerScrim />
      </motion.div>

      <Slate>The other kind of sales call</Slate>

      {/* Beat 1 — the demand */}
      <Beat t={t} from={1.0} to={4.4} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-extrabold text-[4.4vw] leading-[1.15] uppercase tracking-tight text-white text-shadow-heavy">
          It&rsquo;s time to change how
          <br />
          hospice sales is delivered.
        </h2>
      </Beat>

      {/* Beat 2 — the alternative, red rule above it */}
      <Beat t={t} from={5.0} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <motion.div
          className="h-[0.7vh] w-[30vw] bg-[var(--color-brand-red)] mb-[2.4vh] origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1], delay: 0.4 }}
        />
        <h2 className="font-sans font-bold text-[3.6vw] leading-[1.25] text-white text-shadow-heavy">
          Not with donuts.
          <br />
          <span className="text-[var(--color-brand-warm)]">With clinical fluency.</span>
        </h2>
      </Beat>
    </motion.div>
  );
};

export default Scene5;
