import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate, LowerScrim } from './Beats';

/**
 * Scene 5 — The better visit. (11s)
 * The slate rewinds to Scene 0's exact timestamp (Tuesday · 9:47 AM):
 * this is the same visit, done right. A rep and a nurse case manager go
 * through the patient list together. One present-tense hypothetical
 * frame held throughout; the payoff names the couple plainly:
 *   1. "This time, it goes differently."
 *   2. "One real question: 'Which patients are declining?'"
 *   3. "That question finds the couple upstairs. Weeks of help, instead of none."
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
        transition={{ duration: 11, ease: 'linear' }}
      >
        <img
          src={`${baseUrl}assets/act3_real_call.jpg`}
          alt="A hospice sales rep takes notes while a nurse case manager points at a printed patient list between them"
          className="w-full h-full object-cover object-[center_35%]"
        />
        <LowerScrim />
      </motion.div>

      <Slate>Tuesday &middot; 9:47 AM &middot; The better visit</Slate>

      {/* Beat 1 — the rewind: same timestamp as Scene 0, present tense held */}
      <Beat t={t} from={0.9} to={3.4} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-white text-shadow-heavy">
          This time, it goes differently.
        </h2>
      </Beat>

      {/* Beat 2 — the real clinical question, over the patient list */}
      <Beat t={t} from={4.0} to={6.8} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-white text-shadow-heavy">
          One real question:
          <br />
          <span className="font-display italic font-bold text-[4.4vw] text-[var(--color-brand-warm)]">
            &ldquo;Which patients are declining?&rdquo;
          </span>
        </h2>
      </Beat>

      {/* Beat 3 — the payoff: names the couple, makes "in time" concrete */}
      <Beat t={t} from={7.4} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <motion.div
          className="h-[0.7vh] w-[30vw] bg-[var(--color-brand-red)] mb-[2.4vh] origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1], delay: 0.3 }}
        />
        <h2 className="font-sans font-extrabold text-[4.2vw] leading-[1.2] text-white text-shadow-heavy">
          That question finds the couple upstairs.
        </h2>
        <p className="font-sans font-light text-[3vw] leading-[1.3] tracking-wide text-[var(--color-brand-warm)] text-shadow-heavy mt-[1.6vh]">
          Weeks of help, instead of none.
        </p>
      </Beat>
    </motion.div>
  );
};

export default Scene5;
