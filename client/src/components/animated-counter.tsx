import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export default function AnimatedCounter({
  value,
  duration = 0.8,
  className = "",
  suffix = "",
}: AnimatedCounterProps) {
  const prevValue = useRef(value);
  const spring = useSpring(value, {
    mass: 0.8,
    stiffness: 75,
    damping: 25,
  });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    if (prevValue.current !== value) {
      spring.set(value);
      prevValue.current = value;
    }
  }, [spring, value]);

  return (
    <span className={className}>
      <motion.span>{display}</motion.span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}