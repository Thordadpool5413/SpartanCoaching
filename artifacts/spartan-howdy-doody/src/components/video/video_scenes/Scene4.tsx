import React from 'react';
import { motion } from 'framer-motion';
import { useSceneClock, Beat, Slate } from './Beats';

/**
 * Scene 4 — The celebration. (9.5s)
 * Back at the office, the manager congratulates the rep for that visit —
 * donut box right there on the desk. Three beats, one at a time:
 *   1. Name what the image shows: that visit gets a handshake.
 *   2. The hollow verdict — "Great work." — struck through in red.
 *   3. The challenge to leaders: what you celebrate is what you get.
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
          alt="A smiling sales manager shakes the rep's hand in the office, an open box of donuts on the desk between them"
          className="w-full h-full object-cover object-[center_35%]"
          initial={{ filter: 'saturate(1.05) brightness(1.0)' }}
          animate={{ filter: 'saturate(0.72) brightness(0.85)' }}
          transition={{ duration: 1.8, ease: [0.4, 0, 0.6, 1], delay: 4.0 }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[48vh] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
      </motion.div>

      <Slate>Friday &middot; Back at the office</Slate>

      {/* Beat 1 — that visit gets celebrated */}
      <Beat t={t} from={0.9} to={3.6} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <h2 className="font-sans font-light text-[3.6vw] leading-[1.3] tracking-wide text-white text-shadow-heavy">
          And that visit? It gets a handshake.
        </h2>
      </Beat>

      {/* Beat 2 — the hollow verdict, struck through in red */}
      <Beat t={t} from={4.2} to={6.9} className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <div className="relative inline-block">
          <h2 className="font-display italic font-bold text-[4.6vw] leading-[1.2] text-white text-shadow-heavy">
            Donuts delivered. &ldquo;Great work.&rdquo;
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
          Leaders &mdash; what you celebrate
          <br />
          is what you get.
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
