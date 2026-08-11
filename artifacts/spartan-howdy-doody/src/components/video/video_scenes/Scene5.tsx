import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate, LowerScrim } from './Beats';

/**
 * Scene 5 — The visit that should have happened. (9s)
 * A hospice sales rep and a nurse case manager go through the patient
 * list together — a real clinical conversation. Three beats:
 *   1. Set up the contrast: this is the visit that should have happened.
 *   2. The hero question, spoken over the patient list.
 *   3. The payoff: that question finds the husband upstairs.
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
      {/* Rep taking notes while the case manager points at the patient list */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 9, ease: 'linear' }}
      >
        <img
          src={`${baseUrl}assets/act3_real_call.jpg`}
          alt="A hospice sales rep takes notes while a nurse case manager points at a printed patient list between them"
          className="w-full h-full object-cover object-[center_35%]"
        />
        <LowerScrim />
      </motion.div>

      <Slate>The visit that should have happened</Slate>

      {/* Beat 1 — set up the contrast with the donut call */}
      <Beat t={t} from={0.9} to={3.4} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-white text-shadow-heavy">
          No donuts. Just one real question&nbsp;&mdash;
        </h2>
      </Beat>

      {/* Beat 2 — the hero question, over the patient list */}
      <Beat t={t} from={4.0} to={6.6} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-display italic font-bold text-[4.6vw] leading-[1.2] text-[var(--color-brand-warm)] text-shadow-heavy">
          &ldquo;Which of your patients
          <br />
          are declining?&rdquo;
        </h2>
      </Beat>

      {/* Beat 3 — the payoff: this is what reaches the family upstairs */}
      <Beat t={t} from={7.2} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <motion.div
          className="h-[0.7vh] w-[30vw] bg-[var(--color-brand-red)] mb-[2.4vh] origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1], delay: 0.3 }}
        />
        <h2 className="font-sans font-extrabold text-[4.2vw] leading-[1.2] text-white text-shadow-heavy">
          That question finds the husband
          <br />
          upstairs &mdash; and his wife.
        </h2>
      </Beat>
    </motion.div>
  );
};

export default Scene5;
