import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
// Removed Lottie spinner to simplify transitions

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 24,
    filter: "blur(6px)",
  },
  in: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
  out: {
    opacity: 0,
    y: -24,
    filter: "blur(6px)",
  },
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 220,
  damping: 28,
  mass: 0.9,
  delay: 0.02,
};

export default function PageTransition({ children }: PageTransitionProps) {
  // No spinner overlay; keep clean spring+blur transition

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}
