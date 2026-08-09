import { motion } from 'framer-motion';
import { useScenePhases } from '@/lib/video';

const EASE = [0.16, 1, 0.3, 1] as const;
const spartanLogo = `${import.meta.env.BASE_URL}spartan-logo.png`;

const SCHEDULE = [
  [350,  1],  // logo slam — delayed past the white-flash transition so the slam is visible
  [1500, 2],  // red line draws
  [2400, 3],  // tagline fades in
  [3500, 4],  // credentials reveal
  [4600, 5],  // CTA button
] as const;

// Scene 8 — Close (7s)
// Logo SLAMS in from above with a hard spring impact, then line draws, tagline fades,
// Nick's credentials appear, then CTA appears.
export function Scene8_Close() {
  const phase = useScenePhases(SCHEDULE);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#f0ebe0' }}
      initial={{ opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* Midground drifting pattern */}
      <motion.div
        className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-gradient-to-bl from-[#e8291e]/5 to-transparent rounded-full pointer-events-none z-0 blur-3xl"
        animate={{ x: [50, -50, 50], y: [50, -50, 50] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Soft edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(0,0,0,0.14) 100%)' }}
      />

      {/* Logo — slams down from above */}
      <motion.img
        src={spartanLogo}
        alt="Spartan Coaching"
        className="relative z-10 object-contain"
        style={{ width: 'min(58vw, 460px)', height: 'auto' }}
        initial={{ y: '-60%', scale: 0.72, opacity: 0 }}
        animate={phase >= 1 ? { y: 0, scale: 1, opacity: 1 } : { y: '-60%', scale: 0.72, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      />

      {/* Red accent line */}
      <motion.div
        className="relative z-10 bg-[#e8291e] origin-left mt-6"
        style={{ width: 'min(58vw, 460px)', height: '4px' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.75, ease: EASE }}
      />

      {/* Tagline */}
      <motion.p
        className="relative z-10 font-body uppercase text-center mt-5"
        style={{
          fontSize: 'clamp(12px, 2.2vw, 32px)',
          letterSpacing: '0.14em',
          color: '#3a2e20',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.85 }}
      >
        Hospice Growth Coaching · spartancoaching.com
      </motion.p>

      {/* Founder credentials */}
      <motion.p
        className="relative z-10 font-body text-center mt-3"
        style={{
          fontSize: 'clamp(10px, 1.7vw, 24px)',
          letterSpacing: '0.06em',
          color: '#6b5c44',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
        transition={{ duration: 0.85 }}
      >
        Nick Lynch &nbsp;·&nbsp; 12+ years hospice-specific &nbsp;·&nbsp; 500+ reps coached
      </motion.p>

      {/* CTA button */}
      <motion.div
        className="relative z-10 mt-6 font-body uppercase text-center"
        style={{
          fontSize: 'clamp(12px, 2vw, 28px)',
          letterSpacing: '0.12em',
          backgroundColor: '#e8291e',
          color: '#ffffff',
          padding: 'clamp(10px, 1.3vw, 18px) clamp(20px, 2.8vw, 40px)',
          display: 'inline-block',
        }}
        initial={{ opacity: 0, y: 14 }}
        animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 0.9 }}
      >
        Book a Strategy Call →
      </motion.div>
    </motion.div>
  );
}
