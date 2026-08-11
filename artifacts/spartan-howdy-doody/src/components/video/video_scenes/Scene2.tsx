import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate, LowerScrim } from './Beats';

/**
 * Scene 2 — The people the donut call never reaches. (9s)
 * Hard cut from the donut party to a wife alone at her dying husband's
 * bedside. Two beats, one at a time:
 *   1. Name what the image shows: no nurse, no support, no hospice.
 *   2. Land the stat: most patients who need hospice never get it.
 */
const Scene2: React.FC<{ duration: number }> = () => {
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
      {/* The family, alone — warmth drains from the frame */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ scale: { duration: 9, ease: 'linear' } }}
      >
        <motion.img
          src={`${baseUrl}assets/act2_family_alone.jpg`}
          alt="A wife sits alone at her dying husband's bedside, with no hospice support"
          className="w-full h-full object-cover object-[center_30%]"
          initial={{ filter: 'saturate(1.3) brightness(1.12) sepia(0.15)' }}
          animate={{ filter: 'saturate(0.75) brightness(1.0) sepia(0)' }}
          transition={{ duration: 2.6, ease: [0.4, 0, 0.6, 1], delay: 0.5 }}
        />
        <LowerScrim />
      </motion.div>

      <Slate>Across town &middot; The same morning</Slate>

      {/* Beat 1 — name what you're looking at */}
      <Beat t={t} from={1.0} to={4.2} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.4vw] leading-[1.3] tracking-wide text-[var(--color-brand-warm)] text-shadow-heavy">
          No nurse. No support. No hospice.
        </h2>
      </Beat>

      {/* Beat 2 — the stat, biggest line in the scene */}
      <Beat t={t} from={4.8} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-extrabold text-[4.6vw] leading-[1.15] text-white text-shadow-heavy max-w-[80vw]">
          Most patients who need hospice
          <br />
          never get it.
        </h2>
      </Beat>
    </motion.div>
  );
};

export default Scene2;
