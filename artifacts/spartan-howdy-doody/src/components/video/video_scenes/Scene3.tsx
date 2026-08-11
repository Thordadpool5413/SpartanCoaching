import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate, LowerScrim } from './Beats';

/**
 * Scene 3 — The cost of the empty visit. (9s)
 * While the rep was making small talk downstairs, a husband was dying
 * upstairs — and his wife is facing it alone. Two beats, one at a time:
 *   1. Establish the human stakes: upstairs, a husband is dying.
 *   2. The causal link: his wife is alone because no one asked who needed help.
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
      {/* The wife alone at her dying husband's bedside — the visit that never happened */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.07 }}
        animate={{ scale: 1 }}
        transition={{ scale: { duration: 9, ease: 'linear' } }}
      >
        <img
          src={`${baseUrl}assets/act2_dying_alone.jpg`}
          alt="An elderly wife sits alone at her dying husband's bedside, holding his hand, with no support"
          className="w-full h-full object-cover object-[center_30%]"
        />
        <LowerScrim />
      </motion.div>

      <Slate>The same building &middot; Upstairs</Slate>

      {/* Beat 1 — establish what the image shows */}
      <Beat t={t} from={1.0} to={4.2} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-[var(--color-brand-warm)] text-shadow-heavy">
          Upstairs, a husband is dying.
        </h2>
      </Beat>

      {/* Beat 2 — the causal link back to the small-talk visit */}
      <Beat t={t} from={4.8} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-extrabold text-[4.2vw] leading-[1.2] text-white text-shadow-heavy max-w-[86vw]">
          His wife is facing it alone &mdash;
          <br />
          because no one asked who needed help.
        </h2>
      </Beat>
    </motion.div>
  );
};

export default Scene3;
