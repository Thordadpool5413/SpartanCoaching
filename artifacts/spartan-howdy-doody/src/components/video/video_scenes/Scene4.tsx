import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate } from './Beats';

/**
 * Scene 4 — Back at the office. (9.5s)
 * The empty visit gets treated as a success — donut box on the desk, a
 * warm handshake. The copy indicts the broken habit, never the people
 * pictured. The slate carries the place; the lines carry the verdict:
 *   1. "That visit counts as a win."
 *   2. "Donuts delivered. Box checked."
 *   3. "No one ever went upstairs."  ← pays off Scene 3, sets up Scene 5
 */
const Scene4: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;
  const t = useSceneClock();

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* The manager congratulating the rep, donuts on the desk between them */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ scale: { duration: 9.5, ease: 'linear' } }}
      >
        <motion.img
          src={`${baseUrl}assets/act3_manager_praise.jpg`}
          alt="A sales manager congratulates the rep in the office, an open box of donuts on the desk between them"
          className="w-full h-full object-cover object-[center_35%]"
          initial={{ filter: 'saturate(1.05) brightness(1.0)' }}
          animate={{ filter: 'saturate(0.72) brightness(0.85)' }}
          transition={{ duration: 1.8, ease: [0.4, 0, 0.6, 1], delay: 4.2 }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[48vh] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
      </motion.div>

      <Slate>Friday &middot; 4:15 PM &middot; The sales office</Slate>

      {/* Beat 1 — the empty visit is treated as a success */}
      <Beat t={t} from={0.9} to={3.6} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-white text-shadow-heavy">
          That visit counts as a win.
        </h2>
      </Beat>

      {/* Beat 2 — what actually happened, in the narrator's clipped register */}
      <Beat t={t} from={4.2} to={6.8} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-white text-shadow-heavy">
          Donuts delivered. Box checked.
        </h2>
      </Beat>

      {/* Beat 3 — the plain verdict; points straight back to the couple in Scene 3 */}
      <Beat t={t} from={7.4} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <div className="relative inline-block pb-[2vh]">
          <h2 className="font-sans font-extrabold text-[4.4vw] leading-[1.15] text-white text-shadow-heavy">
            No one ever went upstairs.
          </h2>
          <motion.div
            className="absolute bottom-0 left-0 h-[0.9vh] bg-[var(--color-brand-red)] shadow-[0_0_18px_rgba(218,41,28,0.55)]"
            initial={{ width: 0 }}
            animate={{ width: '64%' }}
            transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1], delay: 1.0 }}
          />
        </div>
      </Beat>
    </motion.div>
  );
};

export default Scene4;
