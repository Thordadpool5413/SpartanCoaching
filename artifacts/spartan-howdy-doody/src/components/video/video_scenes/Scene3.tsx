import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate, LowerScrim } from './Beats';

/**
 * Scene 3 — The cost of the unasked question. (9s)
 * Down the hall from the donut call: a wife alone at her dying husband's
 * bedside. Two beats, one at a time:
 *   1. Name what the image shows: this family is doing it alone.
 *   2. Tie it to the visit: nobody asked, so nobody told them hospice could help.
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
      {/* The family, alone — seen from the doorway the rep never reached */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.07 }}
        animate={{ scale: 1 }}
        transition={{ scale: { duration: 9, ease: 'linear' } }}
      >
        <img
          src={`${baseUrl}assets/act2_room_214.jpg`}
          alt="A wife sits alone holding her dying husband's hand in a hospital room, with no support"
          className="w-full h-full object-cover object-[center_40%]"
        />
        <LowerScrim />
      </motion.div>

      <Slate>Down the hall &middot; Room 214</Slate>

      {/* Beat 1 — name what you're looking at */}
      <Beat t={t} from={1.0} to={4.2} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-[var(--color-brand-warm)] text-shadow-heavy">
          This family is doing it alone.
        </h2>
      </Beat>

      {/* Beat 2 — the causal link back to the visit */}
      <Beat t={t} from={4.8} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-extrabold text-[4.2vw] leading-[1.2] text-white text-shadow-heavy max-w-[86vw]">
          Nobody asked about them.
          <br />
          So nobody told them hospice could help.
        </h2>
      </Beat>
    </motion.div>
  );
};

export default Scene3;
