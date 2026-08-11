import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 5 — The Pivot: what changing the delivery actually looks like.
 * The red-graded frame shows a rep in a real clinical conversation —
 * charts, case manager, no donuts. The demand lands over real work.
 */
const Scene5: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'linear' }}
    >
      {/* Real sales work, red-graded — wipes in hard from the left */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1], delay: 0.15 }}
      >
        <motion.img
          src={`${baseUrl}assets/act2_real_work.jpg`}
          alt="A hospice sales professional in a focused clinical conversation with a case manager"
          className="w-full h-full object-cover object-[center_25%]"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 7.5, ease: 'linear' }}
        />
        {/* Lower-third scrim keeps the conversation visible up top */}
        <div className="absolute inset-x-0 bottom-0 h-[46vh] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
      </motion.div>

      {/* Slate: this is the replacement for the Howdy Doody call */}
      <motion.p
        className="absolute top-[6vh] right-[6vw] z-10 font-sans font-bold text-[1.8vw] tracking-[0.45em] uppercase text-white text-shadow-subtle text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.95 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 1.0 }}
      >
        The other kind of sales call
      </motion.p>

      {/* The demand — punches into the lower third */}
      <div className="absolute inset-x-0 bottom-[7vh] z-10 flex flex-col items-start px-[6vw]">
        <motion.h2
          className="font-sans font-extrabold text-[4.6vw] leading-[1.12] uppercase tracking-tight text-white text-shadow-heavy"
          initial={{ opacity: 0, scale: 1.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 0.85, 0.15, 1], delay: 1.6 }}
          style={{ transformOrigin: 'left bottom' }}
        >
          It&rsquo;s time to change how
          <br />
          hospice sales is delivered.
        </motion.h2>

        {/* Red rule slams underneath */}
        <motion.div
          className="h-[0.7vh] w-[34vw] bg-[var(--color-brand-red)] mt-[2.6vh] origin-left"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.7, 0, 0.3, 1], delay: 2.9 }}
        />

        {/* Kicker — the alternative to donuts */}
        <motion.p
          className="font-sans font-medium text-[2vw] tracking-[0.35em] uppercase text-[var(--color-brand-warm)] text-shadow-subtle mt-[2.6vh]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 4.0 }}
        >
          Not with donuts. With clinical fluency.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Scene5;
