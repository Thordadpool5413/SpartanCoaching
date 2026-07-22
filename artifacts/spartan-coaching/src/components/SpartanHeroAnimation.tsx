import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const spartanStamp = "/spartan-logo-stamp.png";

const SCENE_DURATIONS: Record<string, number> = {
  intro: 5000,
  buildup: 5000,
  kinetic: 5000,
  crestHero: 6000,
  outro: 4000,
};

function useHeroPlayer(onComplete?: () => void) {
  const sceneKeys = useRef(Object.keys(SCENE_DURATIONS)).current;
  const durationsArray = useRef(Object.values(SCENE_DURATIONS)).current;
  const totalScenes = sceneKeys.length;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [currentScene, setCurrentScene] = useState(0);
  // Increments each full loop so AnimatePresence sees a new key and re-mounts scenes
  const [loopCount, setLoopCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const isLast = currentScene >= totalScenes - 1;
      if (isLast) {
        // Full sequence completed — fire onComplete once, then restart from Scene 0
        onCompleteRef.current?.();
        setCurrentScene(0);
        setLoopCount((c) => c + 1);
      } else {
        setCurrentScene((prev) => prev + 1);
      }
    }, durationsArray[currentScene]);

    return () => clearTimeout(timer);
  }, [currentScene, loopCount, totalScenes, durationsArray]);

  const key = `${sceneKeys[currentScene]}_loop_${loopCount}`;

  return { currentSceneKey: key, sceneIndex: currentScene };
}

function Scene1_Intro() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1300),
    ];
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 1 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
      transition={{ duration: 0.25 }}>
      <div className="text-center px-8">
        <motion.h2 className="text-[2.5vw] text-white/55 tracking-[0.7em] uppercase font-light mb-5"
          initial={{ opacity: 0, y: -16 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
          transition={{ type: "spring", stiffness: 700, damping: 28 }}>
          Hospice Sales
        </motion.h2>
        <div className="overflow-hidden">
          <motion.h1 className="text-[9vw] text-white font-display font-black uppercase tracking-tight leading-[0.9]"
            initial={{ y: "110%" }} animate={phase >= 2 ? { y: 0 } : { y: "110%" }}
            transition={{ type: "spring", stiffness: 900, damping: 38 }}>
            IS NOT A
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1 className="text-[9vw] text-[#e8291e] font-display font-black uppercase tracking-tight leading-[0.9]"
            initial={{ y: "110%" }} animate={phase >= 2 ? { y: 0 } : { y: "110%" }}
            transition={{ type: "spring", stiffness: 900, damping: 38, delay: 0.04 }}>
            MYSTERY
          </motion.h1>
        </div>
        <motion.div className="h-[3px] bg-[#e8291e] mt-7 origin-left"
          initial={{ scaleX: 0 }}
          animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </motion.div>
  );
}

function Scene2_Buildup() {
  const [phase, setPhase] = useState(0);
  const [shockKey, setShockKey] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 150),
      setTimeout(() => { setPhase(2); setShockKey((k) => k + 1); }, 900),
      setTimeout(() => setPhase(3), 2800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 1 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: "blur(15px)" }}
      transition={{ duration: 0.3 }}>
      {[0, 1, 2].map((i) => (
        <motion.div key={`shock-${shockKey}-${i}`}
          className="absolute rounded-full border-2 border-[#e8291e] pointer-events-none"
          initial={{ width: "5vw", height: "5vw", opacity: 0.9 }}
          animate={{ width: "90vw", height: "90vw", opacity: 0 }}
          transition={{ duration: 0.7 + i * 0.18, delay: i * 0.12, ease: "easeOut" }} />
      ))}
      <motion.h1 className="text-[16vw] font-display font-black uppercase leading-none absolute select-none"
        style={{ color: "rgba(255,255,255,0.05)" }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}>
        IT IS A
      </motion.h1>
      <motion.h1 className="text-[20vw] font-display font-black uppercase text-[#e8291e] leading-none absolute mix-blend-screen"
        initial={{ opacity: 0, scale: 2.2, filter: "blur(40px)" }}
        animate={phase >= 2 ? { opacity: 1, scale: 1, filter: "blur(0px)" } : { opacity: 0, scale: 2.2, filter: "blur(40px)" }}
        transition={{ duration: 0.35, type: "spring", stiffness: 500, damping: 28 }}>
        PROMISE
      </motion.h1>
      <motion.div className="absolute bottom-16 left-16 h-[3px] bg-[#e8291e] origin-left"
        style={{ width: "40vw" }}
        initial={{ scaleX: 0 }}
        animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} />
    </motion.div>
  );
}

function ScanLine({ trigger }: { trigger: number }) {
  return (
    <motion.div key={trigger}
      className="absolute left-0 right-0 h-[1px] bg-white pointer-events-none z-30"
      style={{ top: "50%" }}
      initial={{ scaleX: 0, opacity: 0.5, originX: 0 }}
      animate={{ scaleX: 1, opacity: 0 }}
      transition={{ duration: 0.35, ease: "linear" }} />
  );
}

function Scene3_Kinetic() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1100),
      setTimeout(() => setPhase(3), 1900),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 z-10"
      initial={{ opacity: 0, x: "8%" }}
      animate={{ opacity: 1, x: "0%" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
      <div className="absolute inset-0 flex flex-col justify-center px-[8vw]">
        <div className="overflow-hidden mb-3">
          <motion.h1 className="text-[7.5vw] font-display font-black uppercase text-white leading-none"
            initial={{ y: "110%" }} animate={phase >= 1 ? { y: 0 } : { y: "110%" }}
            transition={{ type: "spring", stiffness: 700, damping: 32 }}>
            THE PROMISE IS SIMPLE:
          </motion.h1>
        </div>
        {phase >= 1 && <ScanLine trigger={1} />}
        <div className="overflow-hidden mb-3">
          <motion.h1 className="text-[7.5vw] font-display font-black uppercase text-[#e8291e] leading-none"
            initial={{ y: "110%" }} animate={phase >= 2 ? { y: 0 } : { y: "110%" }}
            transition={{ type: "spring", stiffness: 700, damping: 32 }}>
            WHEN A PERSON IS ELIGIBLE
          </motion.h1>
        </div>
        {phase >= 2 && <ScanLine trigger={2} />}
        <div className="overflow-hidden">
          <motion.h1 className="text-[7.5vw] font-display font-black uppercase text-white leading-none"
            initial={{ y: "110%" }} animate={phase >= 3 ? { y: 0 } : { y: "110%" }}
            transition={{ type: "spring", stiffness: 700, damping: 32 }}>
            THEY DESERVE CARE.
          </motion.h1>
        </div>
        {phase >= 3 && <ScanLine trigger={3} />}
        <motion.div className="absolute inset-0 bg-[#e8291e] z-20 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: [0, 0.75, 0] } : { opacity: 0 }}
          transition={{ duration: 0.4, times: [0, 0.3, 1] }} />
      </div>
    </motion.div>
  );
}

const SPARK_COUNT = 12;

function Sparks({ active }: { active: boolean }) {
  const sparks = useRef(
    Array.from({ length: SPARK_COUNT }, (_, i) => {
      const angle = (i / SPARK_COUNT) * 360;
      const rad = (angle * Math.PI) / 180;
      const dist = 28 + (i % 3) * 6;
      return {
        tx: Math.cos(rad) * dist,
        ty: Math.sin(rad) * dist,
        size: 4 + (i % 5) * 2,
      };
    })
  ).current;
  return (
    <>
      {sparks.map(({ tx, ty, size }, i) => (
        <motion.div key={i}
          className="absolute rounded-full bg-[#e8291e] pointer-events-none"
          style={{ width: size, height: size, top: "50%", left: "50%", marginTop: -size / 2, marginLeft: -size / 2 }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
          animate={active ? { x: `${tx}vh`, y: `${ty}vh`, opacity: [0, 1, 0], scale: [1, 1.5, 0] } : { opacity: 0 }}
          transition={{ duration: 0.65 + (i % 3) * 0.1, ease: "easeOut", delay: (i % 5) * 0.02 }} />
      ))}
    </>
  );
}

function Scene4_CrestHero() {
  const [phase, setPhase] = useState(0);
  const [sparksKey, setSparksKey] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => { setPhase(1); setSparksKey((k) => k + 1); }, 300),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50"
      initial={{ opacity: 0, clipPath: "circle(0% at 50% 50%)" }}
      animate={{ opacity: 1, clipPath: "circle(150% at 50% 50%)" }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div className="absolute w-[55vh] h-[55vh] rounded-full bg-[#e8291e] blur-[80px]"
          initial={{ opacity: 0, scale: 0 }}
          animate={phase >= 1 ? { opacity: 0.55, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }} />
        <motion.div className="absolute w-[80vh] h-[80vh] rounded-full bg-[#e8291e] blur-[120px]"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 0.18 } : { opacity: 0 }}
          transition={{ duration: 1.2 }} />
        <div key={sparksKey} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Sparks active={phase >= 1} />
        </div>
        <motion.img src={spartanStamp} alt="Spartan Crest"
          className="w-[58vh] h-[58vh] object-contain relative z-10"
          initial={{ scale: 0.3, opacity: 0, rotateX: 60 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1, rotateX: 0 } : { scale: 0.3, opacity: 0, rotateX: 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          style={{ transformPerspective: 1200 }} />
        <motion.h1 className="absolute text-[18vw] font-display font-black text-white/[0.035] uppercase whitespace-nowrap pointer-events-none"
          initial={{ x: "25%" }} animate={{ x: "-25%" }}
          transition={{ duration: 6, ease: "linear" }}>
          SPARTAN COACHING
        </motion.h1>
        <motion.div className="absolute bottom-12 flex flex-col items-center px-8"
          initial={{ opacity: 0, y: 40 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}>
          <h2 className="text-[4vw] font-display uppercase tracking-widest text-[#e8291e] font-black">
            DOMINATE YOUR MARKET
          </h2>
          <motion.div className="h-[3px] bg-[#e8291e] w-full origin-left mt-2"
            initial={{ scaleX: 0 }}
            animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function Scene5_Outro() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1600),
    ];
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-background"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}>
      <motion.div className="absolute inset-0 bg-[#e8291e] pointer-events-none"
        initial={{ opacity: 0.4 }} animate={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }} />
      <div className="relative flex flex-col items-center">
        <motion.img src={spartanStamp} alt="Spartan Coaching"
          className="w-[30vh] h-[30vh] object-contain mb-8 relative z-10"
          initial={{ scale: 1.6, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 1.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }} />
        <motion.div className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}>
          <h1 className="text-[4.5vw] font-display font-black uppercase tracking-[0.3em] text-white leading-none">
            SPARTAN COACHING
          </h1>
          <motion.div className="h-[3px] bg-[#e8291e] w-full origin-left mt-4 mb-4"
            initial={{ scaleX: 0 }}
            animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} />
          <motion.p className="text-[1.6vw] font-body text-white/55 tracking-[0.3em] uppercase"
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4 }}>
            Hospice Sales Consulting
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene1_Intro,
  buildup: Scene2_Buildup,
  kinetic: Scene3_Kinetic,
  crestHero: Scene4_CrestHero,
  outro: Scene5_Outro,
};

export function SpartanHeroAnimation({ onComplete }: { onComplete?: () => void }) {
  const { currentSceneKey, sceneIndex } = useHeroPlayer(onComplete);
  const baseKey = currentSceneKey.replace(/_loop_\d+$/, "");
  const SceneComponent = SCENE_COMPONENTS[baseKey];

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      {/* Persistent background glow orbs */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute w-[70vw] h-[70vw] rounded-full blur-[90px]"
          style={{ background: "radial-gradient(circle, #e8291e, transparent 65%)" }}
          animate={{
            x: ["-15%", "15%", "-8%", "-15%"],
            y: ["-15%", "8%", "-25%", "-15%"],
            scale: [1, 1.3, 0.85, 1],
            opacity: sceneIndex === 3 ? [0.55, 0.75, 0.55] : sceneIndex === 4 ? [0.05, 0.1, 0.05] : [0.25, 0.45, 0.25],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[50vw] h-[50vw] rounded-full blur-[70px] right-0 bottom-0"
          style={{ background: "radial-gradient(circle, #6b0d08, transparent 55%)" }}
          animate={{
            x: ["8%", "-25%", "15%", "8%"],
            y: ["8%", "-15%", "25%", "8%"],
            opacity: sceneIndex === 4 ? 0.08 : 0.22,
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Flash on scene change */}
      <motion.div
        key={`flash-${currentSceneKey}`}
        className="absolute inset-0 z-40 pointer-events-none bg-[#e8291e]"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      {/* Scan line */}
      <motion.div
        key={`scan-${currentSceneKey}`}
        className="absolute left-0 right-0 h-[2px] bg-white z-[41] pointer-events-none"
        style={{ top: 0 }}
        initial={{ top: 0, opacity: 0.7 }}
        animate={{ top: "100%", opacity: 0 }}
        transition={{ duration: 0.6, ease: "linear" }}
      />

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
