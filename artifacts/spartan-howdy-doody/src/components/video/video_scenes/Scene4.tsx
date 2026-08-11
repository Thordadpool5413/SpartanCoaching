import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate } from './Beats';

/**
 * Scene 4 — The scoreboard. (9.5s)
 * No faces — the indictment is the metric itself: a weekly activity
 * report full of checked boxes next to the donut box. Three beats:
 *   1. Back at the office, that visit counts as a win.
 *   2. "A great week." — struck through in red.
 *   3. The challenge to leaders: the scoreboard measures the wrong thing.
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
      {/* The activity report — checked boxes, donut box in frame, no people */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ scale: { duration: 9.5, ease: 'linear' } }}
      >
        <motion.img
          src={`${baseUrl}assets/act3_activity_report.jpg`}
          alt="A weekly activity report covered in green checkmarks on a desk next to a donut box"
          className="w-full h-full object-cover"
          initial={{ filter: 'saturate(1.0) brightness(1.0)' }}
          animate={{ filter: 'saturate(0.7) brightness(0.82)' }}
          transition={{ duration: 1.6, ease: [0.4, 0, 0.6, 1], delay: 3.6 }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[48vh] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
      </motion.div>

      <Slate>Friday &middot; The activity report</Slate>

      {/* Beat 1 — the visit becomes a win on paper */}
      <Beat t={t} from={0.9} to={3.6} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-white text-shadow-heavy">
          Back at the office, that visit counts as a win.
        </h2>
      </Beat>

      {/* Beat 2 — the hollow verdict, struck through in red */}
      <Beat t={t} from={4.2} to={6.9} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <div className="relative inline-block">
          <h2 className="font-display italic font-bold text-[4.6vw] leading-[1.2] text-white text-shadow-heavy">
            Boxes checked. &ldquo;A great week.&rdquo;
          </h2>
          <motion.div
            className="absolute top-1/2 left-0 h-[0.9vh] bg-[var(--color-brand-red)] shadow-[0_0_18px_rgba(218,41,28,0.6)]"
            initial={{ width: 0 }}
            animate={{ width: '102%' }}
            transition={{ duration: 0.45, ease: [0.7, 0, 0.3, 1], delay: 1.3 }}
          />
        </div>
      </Beat>

      {/* Beat 3 — the challenge to leadership, held to the end */}
      <Beat t={t} from={7.5} to={999} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-display font-bold text-[4.8vw] leading-[1.15] text-white text-shadow-heavy">
          Leaders &mdash; this scoreboard
          <br />
          measures the wrong thing.
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
