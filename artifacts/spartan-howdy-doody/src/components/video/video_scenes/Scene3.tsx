import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate, LowerScrim } from './Beats';

/**
 * Scene 3 — The Indictment. (6.5s)
 * The donut box left behind at the nurses' station that evening.
 * Two beats that explicitly bridge from the family in Scene 2:
 *   1. "While that family waited —"
 *   2. "your rep delivered donuts." (red strike underneath)
 */
const Scene3: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;
  const t = useSceneClock();

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* The morning's cheer, abandoned by evening */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.07 }}
        animate={{ scale: 1 }}
        transition={{ scale: { duration: 6.5, ease: 'linear' } }}
      >
        <img
          src={`${baseUrl}assets/act3_donuts_left_behind.jpg`}
          alt="The donut box left behind on an empty nurses' station counter that evening"
          className="w-full h-full object-cover"
        />
        <LowerScrim />
      </motion.div>

      <Slate>That evening &middot; The nurses&rsquo; station</Slate>

      {/* Beat 1 — the bridge back to the family */}
      <Beat t={t} from={0.9} to={3.2} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.4vw] leading-[1.3] tracking-wide text-[var(--color-brand-warm)] text-shadow-heavy">
          While that family waited&nbsp;&mdash;
        </h2>
      </Beat>

      {/* Beat 2 — the accusation, red strike underneath */}
      <Beat t={t} from={3.8} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <div className="relative inline-block pb-[2vh]">
          <h2 className="font-display italic font-semibold text-[5vw] leading-[1.2] text-white text-shadow-heavy">
            your rep delivered donuts.
          </h2>
          <motion.div
            className="absolute bottom-0 left-0 h-[1vh] bg-[var(--color-brand-red)] shadow-[0_0_20px_rgba(218,41,28,0.55)]"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1], delay: 1.2 }}
          />
        </div>
      </Beat>
    </motion.div>
  );
};

export default Scene3;
