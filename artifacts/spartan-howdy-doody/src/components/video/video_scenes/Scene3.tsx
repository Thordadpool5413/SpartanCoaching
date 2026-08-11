import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate, LowerScrim } from './Beats';

/**
 * Scene 3 — Two floors up. (9s)
 * While the rep made small talk downstairs, a man was dying upstairs and
 * his wife sat with him — and no one had told them hospice could help.
 * Three plain beats, one at a time, in the narrator's clipped voice:
 *   1. "Two floors up, a man is dying."
 *   2. "His wife of 52 years sits with him."
 *   3. "No one told them hospice could help."
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
      {/* The wife at her dying husband's bedside */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.07 }}
        animate={{ scale: 1 }}
        transition={{ scale: { duration: 9, ease: 'linear' } }}
      >
        <img
          src={`${baseUrl}assets/act2_dying_alone.jpg`}
          alt="An elderly wife sits at her dying husband's bedside, holding his hand"
          className="w-full h-full object-cover object-[center_30%]"
        />
        <LowerScrim />
      </motion.div>

      <Slate>The same building &middot; Two floors up</Slate>

      {/* Beat 1 — establish what the image shows */}
      <Beat t={t} from={1.0} to={3.6} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-[var(--color-brand-warm)] text-shadow-heavy">
          Two floors up, a man is dying.
        </h2>
      </Beat>

      {/* Beat 2 — who is with him, made real by the relationship */}
      <Beat t={t} from={4.2} to={6.6} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-white text-shadow-heavy">
          His wife of 52 years sits with him.
        </h2>
      </Beat>

      {/* Beat 3 — the plain, factual gap */}
      <Beat t={t} from={7.2} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-extrabold text-[4.2vw] leading-[1.2] text-white text-shadow-heavy max-w-[86vw]">
          No one told them hospice could help.
        </h2>
      </Beat>
    </motion.div>
  );
};

export default Scene3;
