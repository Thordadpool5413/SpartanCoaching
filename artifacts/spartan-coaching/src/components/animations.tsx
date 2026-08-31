import { useRef, useEffect, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function FadeIn({ children, className, delay = 0, duration = 0.4 }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const reduce = prefersReducedMotion();

  if (reduce) {
    return (
      <div ref={ref} data-testid="animation-fade-in" className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      data-testid="animation-fade-in"
      className={className}
      initial={false}
      animate={isInView ? { opacity: 1 } : undefined}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface SlideUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function SlideUp({ children, className, delay = 0, duration = 0.4 }: SlideUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const reduce = prefersReducedMotion();

  if (reduce) {
    return (
      <div ref={ref} data-testid="animation-slide-up" className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      data-testid="animation-slide-up"
      className={className}
      initial={false}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface SlideUpFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export function SlideUpFade({
  children,
  className,
  delay = 0,
  duration = 0.5,
  yOffset = 24,
}: SlideUpFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const reduce = prefersReducedMotion();

  if (reduce) {
    return (
      <div ref={ref} data-testid="animation-slide-up-fade" className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      data-testid="animation-slide-up-fade"
      className={className}
      initial={false}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface SlideInProps {
  children: React.ReactNode;
  className?: string;
  direction?: "left" | "right";
  delay?: number;
  duration?: number;
}

export function SlideIn({
  children,
  className,
  direction = "left",
  delay = 0,
  duration = 0.6,
}: SlideInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const reduce = prefersReducedMotion();
  const xOffset = direction === "left" ? -40 : 40;

  if (reduce) {
    return (
      <div ref={ref} data-testid="animation-slide-in" className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      data-testid="animation-slide-in"
      className={className}
      initial={false}
      animate={isInView ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

interface ScaleInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function ScaleIn({ children, className, delay = 0, duration = 0.5 }: ScaleInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const reduce = prefersReducedMotion();

  if (reduce) {
    return (
      <div ref={ref} data-testid="animation-scale-in" className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      data-testid="animation-scale-in"
      className={className}
      initial={false}
      animate={isInView ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.06,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const reduce = prefersReducedMotion();

  if (reduce) {
    return (
      <div ref={ref} data-testid="animation-stagger-container" className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      data-testid="animation-stagger-container"
      className={className}
      initial={false}
      animate={isInView ? "visible" : undefined}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const reduce = prefersReducedMotion();
  if (reduce) {
    return (
      <div data-testid="animation-stagger-item" className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      data-testid="animation-stagger-item"
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 1.5,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);
  const reduce = prefersReducedMotion();

  useEffect(() => {
    if (!isInView) return undefined;
    if (reduce) {
      setDisplayValue(target);
      return undefined;
    }
    const controls = animate(motionValue, target, {
      duration,
      ease: "easeOut",
    });
    return controls.stop;
  }, [isInView, target, duration, motionValue, reduce]);

  useEffect(() => {
    if (reduce) return undefined;
    const unsubscribe = rounded.on("change", (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [rounded, reduce]);

  return (
    <span ref={ref} data-testid="animation-counter" className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = "currentColor",
  className,
}: ProgressRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div ref={ref} data-testid="animation-progress-ring" className={className}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          opacity={0.15}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={
            isInView
              ? { strokeDashoffset }
              : { strokeDashoffset: circumference }
          }
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </div>
  );
}

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
}

export function TypewriterText({ text, speed = 40, className }: TypewriterTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!isInView) return;
    setDisplayedText("");
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [isInView, text, speed]);

  return (
    <span ref={ref} data-testid="animation-typewriter" className={className}>
      {displayedText}
    </span>
  );
}

interface PulsingDotProps {
  className?: string;
}

export function PulsingDot({ className }: PulsingDotProps) {
  return (
    <span
      data-testid="animation-pulsing-dot"
      className={cn("relative inline-flex h-2.5 w-2.5", className)}
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
    </span>
  );
}
