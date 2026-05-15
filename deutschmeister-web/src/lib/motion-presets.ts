import type { Variants } from 'motion/react';
import { MOTION } from './tokens';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.duration.base, ease: MOTION.ease.decelerate },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: MOTION.duration.base, ease: MOTION.ease.decelerate },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: MOTION.spring.snappy },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: MOTION.duration.fast, ease: MOTION.ease.accelerate },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: MOTION.duration.base, ease: MOTION.ease.decelerate },
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: { duration: MOTION.duration.fast, ease: MOTION.ease.accelerate },
  },
};

export const staggerContainer = (gap: number = MOTION.stagger.base): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: 0.04 } },
});

export const shake: Variants = {
  idle: { x: 0 },
  shake: { x: [-6, 6, -4, 4, 0], transition: { duration: 0.35 } },
};

export const pagePresence: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.duration.fast, ease: MOTION.ease.standard },
  },
};

export const backdropFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: MOTION.duration.fast } },
  exit: { opacity: 0, transition: { duration: MOTION.duration.fast } },
};
