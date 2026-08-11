import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate } from './Beats';

/**
 * Scene 4 — The Leadership Callout. (12s)
 * The image is the indictment: a sales manager giving a thumbs-up over a
 * donut-drop activity report. Three beats, strictly one at a time:
 *   1. The hollow praise — then a red strike through it.
 *   2. The rebuttal: donuts went out, patients went unfound.
 *   3. The challenge, held to the end: leaders, why do you accept this?
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
      {/* Leadership celebrating the donut call as a job well done */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ scale: { duration: 12, ease: 'linear' } }}
      >
        <motion.img
          src={`${baseUrl}assets/act2_leaders_approve.jpg`}
          alt="A sales manager gives a thumbs-up over a donut-drop activity report"
          className="w-full h-full object-cover object-[center_30%]"
          initial={{ filter: 'saturate(1.05) brightness(1.05)' }}
          animate={{ filter: 'saturate(0.6) brightness(0.8)' }}
          transition={{ duration: 1.6, ease: [0.4, 0, 0.6, 1], delay: 4.0 }}
        />
        {/* Scrim deepens when the rebuttal starts */}
        <motion.div
          className="absolute inset-x-0 bottom-0 h-[48vh] bg-gradient-to-t from-black/90 via-black/45 to-transparent"
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 4.0 }}
        />
      </motion.div>

      <Slate>Monday &middot; The sales meeting</Slate>

      {/* Beat 1 — the hollow praise, struck through in red before it exits */}
      <Beat t={t} from={0.9} to={4.4} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <div className="relative inline-block">
          <h2 className="font-display italic font-bold text-[4.6vw] leading-[1.2] text-white text-shadow-heavy">
            &ldquo;Another great week, team!&rdquo;
          </h2>
          <motion.div
            className="absolute top-1/2 left-0 h-[0.9vh] bg-[var(--color-brand-red)] shadow-[0_0_18px_rgba(218,41,28,0.6)]"
            initial={{ width: 0 }}
            animate={{ width: '102%' }}
            transition={{ duration: 0.45, ease: [0.7, 0, 0.3, 1], delay: 1.9 }}
          />
        </div>
      </Beat>

      {/* Beat 2 — the rebuttal */}
      <Beat t={t} from={5.0} to={8.4} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-semibold text-[3.6vw] leading-[1.3] text-white text-shadow-heavy">
          A great week? Donuts went out.
          <br />
          Patients went unfound.
        </h2>
      </Beat>

      {/* Beat 3 — the challenge, biggest, holds to the end */}
      <Beat t={t} from={9.0} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-display font-bold text-[5vw] leading-[1.15] text-white text-shadow-heavy">
          Leaders &mdash; why do you
          <br />
          accept this?
        </h2>
        <motion.div
          className="h-[0.9vh] bg-[var(--color-brand-red)] mt-[1.8vh] origin-left"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.7, 0, 0.3, 1], delay: 0.9 }}
          style={{ width: '28vw' }}
        />
      </Beat>
    </motion.div>
  );
};

export default Scene4;
