'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MOTION } from '@/lib/tokens';

interface LoadingCrossfadeProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Crossfades between a skeleton placeholder and the loaded content.
 * Drop-in replacement for `{isLoading ? <Skeleton /> : <Content />}` patterns.
 */
export function LoadingCrossfade({
  isLoading,
  skeleton,
  children,
  className,
}: LoadingCrossfadeProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{isLoading ? skeleton : children}</div>;
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isLoading ? 'skeleton' : 'content'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: MOTION.duration.fast } }}
          exit={{ opacity: 0, transition: { duration: MOTION.duration.instant } }}
        >
          {isLoading ? skeleton : children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
