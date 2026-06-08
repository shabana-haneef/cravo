import React from 'react';
import { motion } from 'framer-motion';

// ─── Shared Variants ─────────────────────────────────────────────────────────

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut', delay },
  }),
};

export const slideLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export const slideRight = {
  hidden: { opacity: 0, x: 50 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Scroll-triggered wrapper (viewport once) ─────────────────────────────────

export const ScrollReveal = ({ children, variant = fadeUp, delay = 0, className = '', ...props }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.12 }}
    variants={variant}
    custom={delay}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Stagger container that reveals children one-by-one
export const StaggerReveal = ({ children, className = '', ...props }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.08 }}
    variants={staggerContainer}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Individual staggered child
export const StaggerItem = ({ children, className = '', ...props }) => (
  <motion.div variants={staggerItem} className={className} {...props}>
    {children}
  </motion.div>
);

// ─── Page transition wrapper ──────────────────────────────────────────────────
export const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

// ─── Hover card (lifts + shadow) ─────────────────────────────────────────────
export const HoverCard = ({ children, className = '', ...props }) => (
  <motion.div
    whileHover={{ y: -7, boxShadow: '0 20px 40px rgba(0,0,0,0.10)' }}
    transition={{ type: 'spring', stiffness: 340, damping: 24 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// ─── Tap button ──────────────────────────────────────────────────────────────
export const TapButton = ({ children, className = '', ...props }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    className={className}
    {...props}
  >
    {children}
  </motion.button>
);
