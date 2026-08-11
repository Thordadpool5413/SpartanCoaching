import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate, LowerScrim } from './Beats';

/**
 * Scene 2 — The visit ends. (8s)
 * Direct consequence of Scene 1: the rep waves goodbye in the lobby,
 * leaving with a smile and nothing else. Two beats, one at a time:
 *   1. "Twenty minutes. All small talk."
 *   2. "Not one question about a single patient." (red underline)
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
      {/* The rep leaves, all smiles, empty-handed of substance */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ scale: { duration: 8, ease: 'linear' } }}
      >
        <motion.img
          src={`${baseUrl}assets/act2_visit_ends.jpg`}
          alt="The sales rep waves goodbye in the medical center lobby, leaving with a smile"
          className="w-full h-full object-cover object-[center_30%]"
          initial={{ filter: 'saturate(1.12) brightness(1.05)' }}
          animate={{ filter: 'saturate(0.8) brightness(0.95)' }}
          transition={{ duration: 2.4, ease: [0.4, 0, 0.6, 1], delay: 3.6 }}
        />
        <LowerScrim />
      </motion.div>

      <Slate>Tuesday &middot; 10:07 AM &middot; The visit ends</Slate>

      {/* Beat 1 — how long it lasted, what it was */}
      <Beat t={t} from={1.0} to={3.8} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-white text-shadow-heavy">
          Twenty minutes. All small talk.
        </h2>
      </Beat>

      {/* Beat 2 — the actual failure, named. Red underline. */}
      <Beat t={t} from={4.4} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <div className="relative inline-block pb-[2vh]">
          <h2 className="font-sans font-extrabold text-[4.2vw] leading-[1.2] text-white text-shadow-heavy">
            Not one question about
            <br />
            a single patient.
          </h2>
          <motion.div
            className="absolute bottom-0 left-0 h-[0.9vh] bg-[var(--color-brand-red)] shadow-[0_0_20px_rgba(218,41,28,0.55)]"
            initial={{ width: 0 }}
            animate={{ width: '58%' }}
            transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1], delay: 1.0 }}
          />
        </div>
      </Beat>
    </motion.div>
  );
};

export default Scene2;
