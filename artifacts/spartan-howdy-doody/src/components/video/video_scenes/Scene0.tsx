import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scene 0 — Cold open: The Rep Arrives.
 * A pink donut box lands on a nurses' station counter. Cheerful, oblivious.
 * Warm, bright register — the satire begins before a single word is spoken.
 */
const Scene0: React.FC<{ duration: number }> = () => {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="absolute inset-0 flex items-end justify-start z-10 bg-[var(--color-brand-black)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
    >
      {/* The donut box — warm, bright, a little too cheerful */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: 1.02, opacity: 0.9 }}
        exit={{ scale: 1, opacity: 0 }}
        transition={{
          scale: { duration: 6, ease: 'linear' },
          opacity: { duration: 1.4, ease: 'easeOut' },
        }}
      >
        <img
          src={`${baseUrl}assets/donut_box.jpg`}
          alt="Donut box arriving at the nurses' station"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />
      </motion.div>

      {/* Small, wry kicker — sets the scene like a documentary slate */}
      <div className="relative z-10 w-full px-[6vw] pb-[9vh]">
        <motion.p
          className="font-sans font-medium text-[2.2vw] tracking-[0.45em] uppercase text-[var(--color-brand-warm)] text-shadow-subtle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.95 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 1.2 }}
        >
          9:47 AM &mdash; The Nurses' Station
        </motion.p>

        <motion.h1
          className="font-display italic font-semibold text-[5.8vw] leading-[1.2] text-[var(--color-brand-white)] text-shadow-heavy mt-[1.5vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 2.0 }}
        >
          The rep has arrived.
        </motion.h1>
      </div>
    </motion.div>
  );
};

export default Scene0;
