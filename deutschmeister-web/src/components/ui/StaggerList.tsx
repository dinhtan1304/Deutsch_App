'use client';

import { Children, isValidElement } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { fadeUp, staggerContainer } from '@/lib/motion-presets';
import { MOTION } from '@/lib/tokens';

interface StaggerListProps {
  children: React.ReactNode;
  gap?: number;
  as?: 'div' | 'ul' | 'ol';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wraps each immediate child in a motion item with `fadeUp` variant, and
 * the container in `staggerContainer`. Useful for grids and vertical lists
 * where you want cards to cascade in.
 *
 * Children must be valid React elements (motion will skip strings/null).
 */
export function StaggerList({
  children,
  gap = MOTION.stagger.base,
  as = 'div',
  className,
  style,
}: StaggerListProps) {
  const reduce = useReducedMotion();
  const Container = motion[as];
  const items = Children.toArray(children).filter(isValidElement);

  if (reduce) {
    const Plain = as as 'div' | 'ul' | 'ol';
    return (
      <Plain className={className} style={style}>
        {children}
      </Plain>
    );
  }

  return (
    <Container
      variants={staggerContainer(gap)}
      initial="hidden"
      animate="show"
      className={className}
      style={style}
    >
      {items.map((child, i) => (
        <motion.div key={(child as { key?: string }).key ?? i} variants={fadeUp}>
          {child}
        </motion.div>
      ))}
    </Container>
  );
}
