import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 4 — The Leadership Callout.
 * The image is the indictment: a sales manager giving a thumbs-up to a
 * donut-drop activity report, calling it a great week. The hollow praise
 * appears first — then the challenge lines cut through it, one at a time.
 */
const Scene4: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

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
        initial={{ scale: 1.06, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          scale: { duration: 11, ease: 'linear' },
          opacity: { duration: 1.0, ease: 'easeOut' },
        }}
      >
        <motion.img
          src={`${baseUrl}assets/act2_leaders_approve.jpg`}
          alt="A sales manager gives a thumbs-up over a donut-drop activity report"
          className="w-full h-full object-cover object-[center_30%]"
          initial={{ filter: 'saturate(1.05) brightness(1.05)' }}
          animate={{ filter: 'saturate(0.65) brightness(0.85)' }}
          transition={{ duration: 1.6, ease: [0.4, 0, 0.6, 1], delay: 3.2 }}
        />
        {/* Scrim deepens when the challenge starts */}
        <motion.div
          className="absolute inset-x-0 bottom-0 h-[48vh] bg-gradient-to-t from-black/85 via-black/45 to-transparent"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 3.2 }}
        />
      </motion.div>

      {/* Slate: where this scene takes place */}
      <motion.p
        className="absolute top-[6vh] left-[6vw] z-10 font-sans font-bold text-[1.8vw] tracking-[0.45em] uppercase text-[var(--color-brand-warm)] text-shadow-subtle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.95 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
      >
        Monday &middot; The sales meeting
      </motion.p>

      {/* Beat 1: the hollow praise — appears, then gets struck through */}
      <div className="absolute inset-x-0 bottom-[7vh] z-10 px-[6vw]">
        <motion.div
          className="relative inline-block"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: [0, 1, 1, 0], y: [16, 0, 0, -10] }}
          transition={{ duration: 3.4, times: [0, 0.15, 0.85, 1], delay: 0.9, ease: 'easeOut' }}
        >
          <h2 className="font-display italic font-bold text-[4.6vw] leading-[1.2] text-white text-shadow-heavy">
            &ldquo;Another great week, team!&rdquo;
          </h2>
          {/* Red strike through the praise — this is NOT a job well done */}
          <motion.div
            className="absolute top-1/2 left-0 h-[0.9vh] bg-[var(--color-brand-red)] shadow-[0_0_18px_rgba(218,41,28,0.6)]"
            initial={{ width: 0 }}
            animate={{ width: '102%' }}
            transition={{ duration: 0.45, ease: [0.7, 0, 0.3, 1], delay: 2.9 }}
          />
        </motion.div>

        {/* Beat 2: the challenge — replaces the praise, escalating */}
        <motion.h2
          className="absolute bottom-[9.5vh] left-[6vw] font-sans font-semibold text-[3.4vw] leading-[1.3] text-[var(--color-brand-warm)] text-shadow-subtle"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: [0, 1, 1, 0], y: [16, 0, 0, -10] }}
          transition={{ duration: 3.2, times: [0, 0.16, 0.84, 1], delay: 4.6, ease: 'easeOut' }}
        >
          Leaders &mdash; donuts went out.
          <br />
          Patients went unfound. Why do you accept this?
        </motion.h2>

        {/* Beat 3: the consequence — biggest, holds to the end */}
        <motion.div
          className="absolute bottom-[7vh] left-[6vw]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 8.2 }}
        >
          <h2 className="font-display font-bold text-[5vw] leading-[1.15] text-white text-shadow-heavy">
            Families are running out of time.
          </h2>
          <motion.div
            className="h-[0.9vh] bg-[var(--color-brand-red)] mt-[1.8vh] origin-left"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.7, 0, 0.3, 1], delay: 9.2 }}
            style={{ width: '30vw' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Scene4;
